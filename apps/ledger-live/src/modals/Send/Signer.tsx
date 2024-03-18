import { memo, useEffect, useMemo } from 'react';
import { AccountWithSigners, Signer } from '../../types';
import { SignerOptions } from '../../helpers';

type Props = {
  account: AccountWithSigners;
  signer: Signer | undefined;
  setSigner: (signer: Signer) => void;
  goNextStep: () => void;
};

const SignerStep = ({ account, setSigner, goNextStep }: Props) => {
  const availableSignersModes = useMemo(() => account.signers?.map(({ mode }) => mode) || ['EOA'], [account]);

  useEffect(() => {
    if (account.signers?.length === 1) {
      setSigner(account.signers[0]);
      goNextStep();
    }
  }, []);

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
                goNextStep();
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
