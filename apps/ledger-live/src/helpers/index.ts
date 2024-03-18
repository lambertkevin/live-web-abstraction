import classNames from 'classnames';
import { twMerge } from 'tailwind-merge';
import Transport from '@ledgerhq/hw-transport';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TransportWebBLE from '@ledgerhq/hw-transport-web-ble';
import { Signer } from '../types';

export * from './4337';

export const openNanoApp = async (
  appName: string,
  type: 'ledger-usb' | 'ledger-ble',
): Promise<[Transport | null, Error | null]> => {
  try {
    const transport = await (type === 'ledger-usb'
      ? TransportWebUSB.create().catch((eee) => {
          console.log('usb', { eee });
          throw eee;
        })
      : TransportWebBLE.create().catch((eee) => {
          console.log('ble', { eee });
          throw eee;
        }));
    console.log('Create new transport', { type, transport });

    // getAppAndVersion
    const getAppAndVersionBuffer = await transport.send(0xb0, 0x01, 0x00, 0x00).catch((eeee) => {
      console.log({ eeee });
      throw eeee;
    });
    console.log({ getAppAndVersionBuffer });
    const nanoAppNameLength = getAppAndVersionBuffer[1];
    const openedNanoAppName = getAppAndVersionBuffer.slice(2, 2 + nanoAppNameLength).toString('ascii');
    console.log({ nanoAppName: openedNanoAppName });

    if (openedNanoAppName !== appName) {
      console.log('Not in Ethereum App');
      // quitApp
      await transport.send(0xb0, 0xa7, 0x00, 0x00);
      console.log('Back to dashboard');
      console.log('Requesting Ethereum App');
      // open Ethereum
      await transport.send(0xe0, 0xd8, 0x00, 0x00, Buffer.from(appName));
      console.log('Should be opened now');

      await transport.close();
      console.log('closing the transport');
      await new Promise((resolve) => {
        setTimeout(() => resolve(undefined), 2500);
      });
      console.log('waiting 2.5s');
      // retry
      return openNanoApp(appName, type);
    }
    return [transport, null];
  } catch (e) {
    return [null, e as Error];
  }
};

export type SignerOption = { type: Signer['type']; mode: Signer['mode']; name: string };

export const SignerOptions: SignerOption[] = [
  {
    type: 'ledger-usb',
    mode: 'EOA',
    name: 'USB',
  },
  {
    type: 'ledger-ble',
    mode: 'EOA',
    name: 'Bluetooth',
  },
  {
    type: 'webauthn',
    mode: 'Webauthn',
    name: 'Passkey',
  },
];

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

export function cn(...inputs: string[]) {
  return twMerge(classNames(inputs));
}
