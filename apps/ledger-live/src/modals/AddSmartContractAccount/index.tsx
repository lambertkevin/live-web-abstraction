import classNames from 'classnames';
import { memo, useCallback, useState } from 'react';
import type { CryptoCurrency } from '@ledgerhq/types-cryptoassets';
import type { Signer } from '../../types';
import UsernameStep from './Username';
import AccountStep from './Account';
import SignerStep from './Signer';
import AssetStep from './Asset';

const STEPS = ['Asset', 'Username', 'Signer', 'Account', 'Confirmation'];

const AddSmartContractAccount = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency | undefined>();
  const [username, setUsername] = useState('');
  const [signer, setSigner] = useState<Signer>();
  const [token, setToken] = useState<string>();

  const [step, setStep] = useState(0);
  const goNextStep = useCallback(
    (stepsToSkip = 1) => {
      setStep(Math.min(step + stepsToSkip, STEPS.length - 1));
    },
    [step],
  );
  const goPreviousStep = useCallback(
    (stepsToSkip = 1) => {
      setStep(Math.max(step - stepsToSkip, 0));
    },
    [step],
  );

  return (
    <>
      {step > 0 && (
        <div
          className="absolute left-4 pt-2 text-zinc-500 hover:text-inherit hover:cursor-pointer"
          onClick={() => goPreviousStep()}
        >
          {'< Back'}
        </div>
      )}
      <div className="text-2xl text-center capitalize p-3">Add Smart Contract Account</div>
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
        <UsernameStep
          username={username}
          setUsername={setUsername}
          setToken={setToken}
          setSigner={setSigner}
          goNextStep={goNextStep}
        />
      )}
      {step === 2 && (
        <SignerStep
          currency={selectedCurrency!}
          signer={signer}
          setSigner={setSigner}
          username={username}
          token={token}
          goNextStep={goNextStep}
        />
      )}
      {step === 3 && <AccountStep signer={signer!} currency={selectedCurrency!} />}
    </>
  );
};

export default memo(AddSmartContractAccount);
