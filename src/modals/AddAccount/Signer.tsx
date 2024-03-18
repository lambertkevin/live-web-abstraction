import classNames from 'classnames';
import { memo, useEffect, useState } from 'react';
import type { CryptoCurrency } from '@ledgerhq/types-cryptoassets';
import { SignerOptions, openNanoApp } from '../../helpers';
import type { Signer } from '../../types';

type Props = {
  currency: CryptoCurrency;
  signer: Signer | undefined;
  setSigner: (transport: Signer) => void;
  goNextStep: () => void;
};

const SignerStep = ({ currency, signer, setSigner, goNextStep }: Props) => {
  const [transportError, setTransportError] = useState<Error | undefined>();
  useEffect(() => {
    if (signer) {
      if (signer.type !== 'webauthn') {
        if (!signer.transport) {
          openNanoApp(currency.managerAppName, signer.type).then(([transport, transErr]) => {
            if (transport) {
              setSigner({ ...signer, transport });
            }
            setTransportError(transErr || undefined);
          });
        }
      } else {
        alert('NOT YET');
      }
    }
  }, [currency.managerAppName, setSigner, signer]);

  return (
    <>
      <div className="px-6">
        <h1 className="text-lg pb-4 text-center">Pick a Signer for you {currency.name} account</h1>
        <div className="flex flex-row gap-4 py-4">
          {SignerOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => setSigner(option)}
              disabled={!option.enabled}
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
            disabled={!signer || !!(signer.type !== 'webauthn' && !signer?.transport)}
          >
            {signer && signer.type !== 'webauthn' && !signer?.transport ? (
              <span className="inline-flex flex-row items-center gap-2">
                Openning the Nano app... <span className="loading loading-ring loading-xs" />
              </span>
            ) : (
              'Continue'
            )}
          </button>
        ) : (
          <button className="btn btn-neutral outline-none outline-primary" onClick={() => setSigner({ ...signer! })}>
            Reconnect {signer!.name}
          </button>
        )}
      </div>
    </>
  );
};

export default memo(SignerStep);
