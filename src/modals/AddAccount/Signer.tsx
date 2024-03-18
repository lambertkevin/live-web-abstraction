import { memo, useEffect } from 'react';
import type { CryptoCurrency } from '@ledgerhq/types-cryptoassets';
import { openNanoApp } from '../../helpers';
import { Signer } from '../../types';
import classNames from 'classnames';

type Props = {
  currency: CryptoCurrency;
  signer: Signer | undefined;
  setSigner: (transport: Signer) => void;
  goNextStep: () => void;
};

const SignerOptions: Signer[] = [
  {
    type: 'ledger-usb',
    name: 'USB',
    enabled: true,
  },
  {
    type: 'ledger-ble',
    name: 'Bluetooth',
    enabled: true,
  },
  {
    type: 'webauthn',
    name: 'Webauthn',
    enabled: false,
  },
];

const SignerStep = ({ currency, signer, setSigner, goNextStep }: Props) => {
  useEffect(() => {
    if (signer) {
      if (signer.type !== 'webauthn') {
        if (!signer.transport) {
          openNanoApp(currency.managerAppName, signer.type).then((transport) => {
            setSigner({
              ...signer,
              transport,
            });
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
        <button
          className="btn btn-primary"
          onClick={goNextStep}
          disabled={!signer || !!(signer.type !== 'webauthn' && !signer?.transport)}
        >
          {signer && signer.type !== 'webauthn' && !signer?.transport ? (
            <span className="inline-flex flex-row items-center gap-2">
              Waiting for transport... <span className="loading loading-ring loading-xs" />
            </span>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </>
  );
};

export default memo(SignerStep);
