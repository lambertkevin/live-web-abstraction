import { ethers } from 'ethers';
import base64url from 'base64url';
import { Observable } from 'rxjs';
import Eth from '@ledgerhq/hw-app-eth';
import { startAuthentication } from '@simplewebauthn/browser';
import type { AccountBridge, SignOperationEvent } from '@ledgerhq/types-live';
import { SignatureCurveType, SignatureDryRun, SignatureMessageType, getSignatureType } from '../../helpers';
import { authResponseToSigVerificationInput } from '../webauthn/authResponseToSigVerificationInput';
import { decodeAuthenticationCredential } from '../webauthn/decodeAuthenticationCredential';
import { transactionToUserOperation } from './adapters/userOperation';
import { EvmAbstractionTransaction } from './types';
import nodeApi from './api/nodeApi';
import { buildOptimisticOperation } from './buildOptimisticOperation';

export const signOperation: AccountBridge<EvmAbstractionTransaction>['signOperation'] = ({
  account,
  transaction,
}): Observable<SignOperationEvent> =>
  new Observable((o) => {
    async function main(): Promise<void> {
      const { signer } = transaction;
      if (!signer) throw new Error("Couldn't not find signer for signature");

      const userOp = transactionToUserOperation(account, transaction);
      console.log({ userOp });
      const userOpHash = await nodeApi.getUserOpHash(userOp);
      console.log({ userOpHash });
      o.next({
        type: 'device-signature-requested',
      });

      let signature;
      if (signer.mode === 'Webauthn') {
        if (!signer.credId) throw new Error("Webauthn signer doesn't have credId");

        const challenge = Buffer.from(userOpHash.slice(2), 'hex');
        const signatureResponse = await startAuthentication({
          challenge: base64url.encode(challenge),
          allowCredentials: [
            {
              id: base64url.encode(Buffer.from(signer.credId.slice(2), 'hex')),
              type: 'public-key',
              transports: ['internal', 'hybrid'],
            },
          ],
        });
        const { response: decodedResponse } = decodeAuthenticationCredential(signatureResponse);

        const ecVerifyInputs = authResponseToSigVerificationInput({}, signatureResponse.response);

        const challengeOffsetRegex = new RegExp(`(.*)${Buffer.from(base64url.encode(challenge)).toString('hex')}`);
        const challengePrefix = challengeOffsetRegex.exec(
          base64url.toBuffer(signatureResponse.response.clientDataJSON).toString('hex'),
        )?.[1];

        console.log('Unpacked', [
          decodedResponse.authenticatorData.flagsMask,
          `0x${base64url.toBuffer(signatureResponse.response.authenticatorData).toString('hex')}`,
          `0x${base64url.toBuffer(signatureResponse.response.clientDataJSON).toString('hex')}`,
          `0x${Buffer.from(userOpHash.slice(2), 'hex').toString('hex')}`,
          Buffer.from(challengePrefix || '', 'hex').length,
          ecVerifyInputs.signature[0],
          ecVerifyInputs.signature[1],
          ethers.utils.keccak256(Buffer.from(signer.credId.slice(2), 'hex')),
        ]);

        const webauthnPackedData = ethers.utils.defaultAbiCoder.encode(
          ['bytes1', 'bytes', 'bytes', 'bytes32', 'uint256', 'uint256', 'uint256', 'bytes32'],
          [
            decodedResponse.authenticatorData.flagsMask,
            base64url.toBuffer(signatureResponse.response.authenticatorData),
            base64url.toBuffer(signatureResponse.response.clientDataJSON),
            Buffer.from(userOpHash.slice(2), 'hex'),
            Buffer.from(challengePrefix || '', 'hex').length,
            ecVerifyInputs.signature[0],
            ecVerifyInputs.signature[1],
            ethers.utils.keccak256(Buffer.from(signer.credId.slice(2), 'hex')),
          ],
        );

        signature = `0x${Buffer.concat([
          Buffer.from(
            getSignatureType(SignatureDryRun.OFF, SignatureMessageType.WEBAUTHN, SignatureCurveType.P256_R1_VERIFY)
              .toString(16)
              .padStart(2, '0'),
            'hex',
          ),
          Buffer.from(webauthnPackedData.slice(2), 'hex'),
        ]).toString('hex')}`;
      } else {
        if (!signer.transport) throw new Error("EOA signer doesn't have transport");

        const app = new Eth(signer.transport);
        const ecdsaSignature = await app.signPersonalMessage("44'/60'/0'/0/0", userOpHash.slice(2));

        signature = `0x${Buffer.concat([
          Buffer.from(
            getSignatureType(SignatureDryRun.OFF, SignatureMessageType.EIP191, SignatureCurveType.P256_K1_ECRECOVER)
              .toString(16)
              .padStart(2, '0'),
            'hex',
          ),
          Buffer.from(
            ethers.utils
              .joinSignature({
                r: `0x${ecdsaSignature.r}`,
                s: `0x${ecdsaSignature.s}`,
                v: ecdsaSignature.v,
              })
              .slice(2),
            'hex',
          ),
        ]).toString('hex')}`;
      }
      console.log('signature', signature);

      o.next({ type: 'device-signature-granted' }); // Signature is done

      const operation = buildOptimisticOperation(account, transaction);

      o.next({
        type: 'signed',
        signedOperation: {
          operation,
          signature,
          rawData: { unsignedUserOp: userOp },
        },
      });
    }

    main().then(
      () => o.complete(),
      /* istanbul ignore next: don't test throwing an error */
      (e) => o.error(e),
    );
  });
