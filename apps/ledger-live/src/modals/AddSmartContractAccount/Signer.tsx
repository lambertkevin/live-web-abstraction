import { ethers } from 'ethers';
import { v4 as uuid } from 'uuid';
import base64url from 'base64url';
import classNames from 'classnames';
import Eth from '@ledgerhq/hw-app-eth';
import { memo, useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import type { CryptoCurrency } from '@ledgerhq/types-cryptoassets';
import { authResponseToSigVerificationInput } from '../../libraries/webauthn/authResponseToSigVerificationInput';
import { decodeRegistrationCredential } from '../../libraries/webauthn/decodeRegistrationCredential';
import { SignerOption, SignerOptions, openNanoApp } from '../../helpers';
import type { Signer } from '../../types';

type Props = {
  currency: CryptoCurrency;
  signer: Signer | undefined;
  setSigner: (transport: Signer) => void;
  username: string;
  token: string | undefined;
  goNextStep: () => void;
};

const createPasskey = async (username: string) => {
  const signatureResponse = await startRegistration({
    rp: {
      name: 'Ledger Live Web',
      id: 'localhost',
    },
    user: {
      id: base64url.encode(uuid()),
      name: `${username}.ledger.com`,
      displayName: `${username}.ledger.com`,
    },
    challenge: '',
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7,
      },
    ],
    timeout: 60000,
    attestation: 'direct',
  });

  console.log('webauthn response', signatureResponse);
  const { response: decodedResponse } = decodeRegistrationCredential(signatureResponse);
  console.log('decoded webauthn response', decodedResponse);

  const credId = `0x${base64url.toBuffer(signatureResponse.id).toString('hex')}`;
  const credIdHash = ethers.utils.keccak256(Buffer.from(credId.slice(2), 'hex'));
  console.log('credId', credId);
  console.log('credIdHash', credIdHash);

  const ecVerifyInputs = authResponseToSigVerificationInput(
    decodedResponse.attestationObject.authData.parsedCredentialPublicKey,
    {
      authenticatorData: decodedResponse.authenticatorData!,
      clientDataJSON: signatureResponse.response.clientDataJSON,
      signature: decodedResponse.attestationObject.attStmt.sig!,
    },
  );
  console.log('verify inputs', ecVerifyInputs);

  return {
    credId,
    credIdHash,
    pubKey: ecVerifyInputs.publicKeyCoordinates,
  };
};

const SignerStep = ({ currency, signer, setSigner, goNextStep, username, token }: Props) => {
  const [transportError, setTransportError] = useState<Error | undefined>();
  const [selectedOption, setSelectedOption] = useState<SignerOption | undefined>();

  useEffect(() => {
    (async () => {
      if (signer) {
        if (signer.type !== 'webauthn') {
          if (!signer.transport) {
            openNanoApp(currency.managerAppName, signer.type).then(([transport, transErr]) => {
              if (transport) {
                (async () => {
                  const { address } = await new Eth(transport).getAddress("44'/60'/0'/0/0");
                  setSigner({ ...signer, transport, username, domain: 'ledger.com', address, token });
                })();
              }
              setTransportError(transErr || undefined);
            });
          }
        } else {
          if (signer.credId) return;

          const { credId, credIdHash, pubKey } = await createPasskey(username);
          setSigner({
            ...signer,
            username,
            domain: 'ledger.com',
            credId,
            credIdHash,
            pubKey,
            token,
          });
        }
      }
    })();
  }, [currency.managerAppName, setSigner, signer, username, token]);

  return (
    <>
      <div className="px-6">
        <h1 className="text-lg pb-4 text-center">Pick a Signer for your {currency.name} account</h1>
        <div className="flex flex-row gap-4 py-4">
          {SignerOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => {
                setSigner({
                  type: option.type,
                  mode: option.mode,
                } as Signer);
                setSelectedOption(option);
              }}
              className={classNames([
                'btn aspect-square flex-1 text-center disabled:pointer-events-auto disabled:cursor-not-allowed hover:border hover:border-accent',
                signer?.type === option.type ? 'btn-accent' : '',
              ])}
            >
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      </div>
      <hr className="border-zinc-700 my-4" />
      <div className="px-6 flex flew-row justify-end">
        {!(transportError?.message?.includes('user gesture') || transportError?.message?.includes('GATT')) ? (
          <button
            className="btn btn-primary"
            onClick={goNextStep}
            disabled={
              !signer ||
              !!(signer.mode === 'EOA' && !signer?.transport) ||
              !!(signer.mode === 'Webauthn' && !signer.credId)
            }
          >
            {signer && signer.mode === 'EOA' && !signer?.transport ? (
              <span className="inline-flex flex-row items-center gap-2">
                Openning the Nano app... <span className="loading loading-ring loading-xs" />
              </span>
            ) : (
              'Continue'
            )}
          </button>
        ) : (
          <button className="btn btn-neutral outline-none outline-primary" onClick={() => setSigner({ ...signer! })}>
            Reconnect {selectedOption!.name}
          </button>
        )}
      </div>
    </>
  );
};

export default memo(SignerStep);
