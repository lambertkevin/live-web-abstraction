import { memo, useEffect, useMemo } from 'react';
import { Transaction } from '@ledgerhq/coin-evm/lib/types/transaction';
import { EvmAbstractionTransaction } from '../../libraries/coin-evm-abstraction/types';
import { AccountWithSigners, Signer } from '../../types';
import { SignerOptions } from '../../helpers';
import Transport from '@ledgerhq/hw-transport';

type Props = {
  account: AccountWithSigners;
  signer: Signer | undefined;
  setSigner: (signer: Signer) => void;
  goNextStep: () => void;
  transport: Transport | undefined;
  transaction: Transaction | EvmAbstractionTransaction | undefined;
};

const SignerStep = ({ account, setSigner, goNextStep, transport, signer }: Props) => {
  const availableSignersModes = useMemo(() => account.signers?.map(({ mode }) => mode) || ['EOA'], [account]);

  useEffect(() => {
    if (account.signers?.length === 1) {
      setSigner(account.signers[0]);
    }
  }, []);

  useEffect(() => {
    if (signer) {
      if (signer.mode === 'EOA' && (signer.transport || transport)) {
        goNextStep();
      }
      if (signer.mode === 'Webauthn') {
        goNextStep();
      }
    }
  }, [goNextStep, transport, signer]);

  return (
    <>
      <div className="text-lg pb-4 text-center">Pick a Signer :</div>
      <div className="flex flex-row gap-4 py-4 px-6">
        {SignerOptions.map((option) =>
          availableSignersModes?.includes(option.mode) ? (
            <button
              key={option.type}
              onClick={() => {
                setSigner({
                  mode: option.mode,
                  type: option.type,
                } as Signer);
              }}
              className="btn bg-zinc-950 aspect-square flex-1 text-center disabled:pointer-events-auto disabled:cursor-not-allowed hover:border hover:border-accent"
            >
              <span>{option.name}</span>
            </button>
          ) : null,
        )}
      </div>
    </>
  );
};

export default memo(SignerStep);
