import { SignerType } from '@prisma/client';
import { ethers } from 'ethers';
import { CraftSigner } from './types';

// Cannot exceed 2 entries (1 bit)
export enum SignatureDryRun {
  OFF,
  ON,
}

// Cannot exceed 16 entries (4 bits)
export enum SignatureMessageType {
  WEBAUTHN,
  EIP191,
  EIP712,
}

// Cannot exceed 8 entries (3 bits)
export enum SignatureCurveType {
  P256_R1_VERIFY,
  P256_K1_ECRECOVER,
}

/**
 * Signature format (1 byte / 8 bits):
 * 1 high order bit for dry run
 * 4 bits for message type
 * 3 bits for curve type
 *
 * 0x80 => 1 0000 000 -> DRY RUN ON  | WEBAUTHN | P256_R1_VERIFY
 * 0x09 => 0 0001 001 -> DRY RUN OFF | EIP191   | P256_K1_ECRECOVER
 * 0x11 => 0 0010 001 -> DRY RUN OFF | EIP712   | P256_K1_ECRECOVER
 */
export const getSignatureType = (
  dryRun: SignatureDryRun,
  messageType: SignatureMessageType,
  curveType: SignatureCurveType,
) => {
  let signatureType = 0;

  signatureType += dryRun; // 1 bit

  // 4 bits
  signatureType = signatureType << 4;
  signatureType += messageType;

  // 3 bits
  signatureType = signatureType << 3;
  signatureType += curveType;

  return signatureType;
};

/**
 * Reverse function of the getSignatureType method
 */
export const decodeSignatureType = (
  signatureType: number,
): {
  dryRun: SignatureDryRun;
  messageType: SignatureMessageType;
  curveType: SignatureCurveType;
} => {
  return {
    dryRun: signatureType >> 7,
    messageType: (signatureType >> 3) & 0x0f, // 0x0f <=> 0111 mask
    curveType: signatureType & 0x07, // 0x07 <=> 00000111 mask
  };
};

export const craftAddSignerPayload = (signer: CraftSigner) => {
  if (signer.type === 'WEBAUTHN') {
    if (!signer.credId || !signer.pubKey || !signer.pubKey[0] || !signer.pubKey[1])
      throw new Error("Couldn't create initCode for Webauthn");

    const firstByte = getSignatureType(
      SignatureDryRun.OFF,
      SignatureMessageType.WEBAUTHN,
      SignatureCurveType.P256_R1_VERIFY,
    );

    return Buffer.concat([
      Buffer.from(firstByte.toString(16).padStart(2, '0'), 'hex'),
      Buffer.from(
        ethers.utils.defaultAbiCoder
          .encode(
            ['bytes32', 'uint256', 'uint256'],
            [ethers.utils.keccak256(Buffer.from(signer.credId.slice(2), 'hex')), signer.pubKey[0], signer.pubKey[1]],
          )
          .slice(2),
        'hex',
      ),
    ]);
  } else {
    if (!signer.address) throw new Error("Couldn't create initCode for EOA");
    const firstByte = getSignatureType(
      SignatureDryRun.OFF,
      SignatureMessageType.EIP191,
      SignatureCurveType.P256_K1_ECRECOVER,
    );

    return Buffer.concat([
      Buffer.from(firstByte.toString(16).padStart(2, '0'), 'hex'),
      Buffer.from(signer.address.slice(2), 'hex'),
    ]);
  }
};
