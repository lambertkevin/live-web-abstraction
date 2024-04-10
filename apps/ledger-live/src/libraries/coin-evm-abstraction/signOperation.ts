import { ethers } from 'ethers';
import base64url from 'base64url';
import { Observable } from 'rxjs';
import Eth from '@ledgerhq/hw-app-eth';
import { startAuthentication } from '@simplewebauthn/browser';
import type { AccountBridge, EIP712Message, SignOperationEvent } from '@ledgerhq/types-live';
import { SignatureCurveType, SignatureDryRun, SignatureMessageType, getSignatureType, packUserOp } from '../../helpers';
import { authResponseToSigVerificationInput } from '../webauthn/authResponseToSigVerificationInput';
import { decodeAuthenticationCredential } from '../webauthn/decodeAuthenticationCredential';
import { buildOptimisticOperation } from './buildOptimisticOperation';
import { transactionToUserOperation } from './adapters/userOperation';
import type { EvmAbstractionTransaction } from './types';
import type { PackedUserOperation, Signer } from '../../types';
import nodeApi from './api/nodeApi';

export const signOperation: (signer: Signer) => AccountBridge<EvmAbstractionTransaction>['signOperation'] =
  (signer: Signer) =>
  ({ account, transaction }): Observable<SignOperationEvent> =>
    new Observable((o) => {
      async function main(): Promise<void> {
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
          const packedUserOp: PackedUserOperation = packUserOp(userOp);
          const EIP712: EIP712Message = {
            domain: {
              name: 'Ledger Smart Contract Account',
              version: '1',
              chainId: account.currency.ethereumLikeInfo?.chainId,
              verifyingContract: account.freshAddress,
            },
            message: {
              sender: packedUserOp.sender,
              nonce: packedUserOp.nonce,
              initCode: packedUserOp.initCode,
              callData: `0x${Buffer.from(packedUserOp.callData as Uint8Array).toString('hex')}`,
              accountGasLimits: packedUserOp.accountGasLimits,
              preVerificationGas: packedUserOp.preVerificationGas,
              gasFees: packedUserOp.gasFees,
              paymasterAndData: packedUserOp.paymasterAndData,
              userOpHash,
            },
            primaryType: 'PackedUserOperationAndHash',
            types: {
              EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
              ],
              PackedUserOperationAndHash: [
                { name: 'sender', type: 'address' },
                { name: 'nonce', type: 'uint256' },
                { name: 'initCode', type: 'bytes' },
                { name: 'callData', type: 'bytes' },
                { name: 'accountGasLimits', type: 'bytes32' },
                { name: 'preVerificationGas', type: 'uint256' },
                { name: 'gasFees', type: 'bytes32' },
                { name: 'paymasterAndData', type: 'bytes' },
                { name: 'userOpHash', type: 'bytes32' },
              ],
            },
          };
          const app = new Eth(signer.transport);
          const ecdsaSignature = await app.signEIP712Message("44'/60'/0'/0/0", EIP712);

          signature = `0x${Buffer.concat([
            Buffer.from(
              getSignatureType(SignatureDryRun.OFF, SignatureMessageType.EIP712, SignatureCurveType.P256_K1_ECRECOVER)
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
