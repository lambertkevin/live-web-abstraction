import classNames from 'classnames';
import { memo, useCallback, useState } from 'react';
import type { CryptoCurrency } from '@ledgerhq/types-cryptoassets';
import type { Signer } from '../../types';
import AccountStep from './Account';
import SignerStep from './Signer';
import AssetStep from './Asset';

const STEPS = ['Asset', 'Signer', 'Account', 'Confirmation'];

const AddAccountModal = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency | undefined>();
  const [signer, setSigner] = useState<Signer>();

  const [step, setStep] = useState(0);
  const goNextStep = useCallback(() => {
    setStep(Math.min(step + 1, STEPS.length - 1));
  }, [step]);
  const goPreviousStep = useCallback(() => {
    setStep(Math.max(step - 1, 0));
  }, [step]);

  return (
    <>
      {step > 0 && (
        <div
          className="absolute left-4 pt-2 text-zinc-500 hover:text-inherit hover:cursor-pointer"
          onClick={goPreviousStep}
        >
          {'< Back'}
        </div>
      )}
      <div className="text-2xl text-center capitalize p-3">Add Account</div>
      <div className="w-10/12 flex justify-center mt-4 mb-10 mx-auto">
        <ul className="steps flex-grow">
          {STEPS.map((stepName, index) => (
            <li key={index} className={classNames('step', index <= step ? 'step-primary' : '')}>
              {stepName}
            </li>
          ))}
        </ul>
      </div>
      {step === 0 && (
        <AssetStep
          setSelectedCurrency={setSelectedCurrency}
          selectedCurrency={selectedCurrency}
          goNextStep={goNextStep}
        />
      )}
      {step === 1 && (
        <SignerStep currency={selectedCurrency!} signer={signer} setSigner={setSigner} goNextStep={goNextStep} />
      )}
      {step === 2 && <AccountStep signer={signer!} currency={selectedCurrency!} />}
    </>
  );
};

export default memo(AddAccountModal);
