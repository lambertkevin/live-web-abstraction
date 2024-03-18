import classNames from 'classnames';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { Account, TokenAccount } from '@ledgerhq/types-live';
import { useBridge } from '../../hooks/useBridge';
import { useAccountsStore } from '../../store';
import SignatureStep from './Signature';
import RecipientStep from './Recipient';
import SummaryStep from './Summary';
import AmountStep from './Amount';
import './index.css';

type Props = {
  accountId: string;
};

const STEPS = ['Recipients', 'Amount', 'Summary', 'Signature'];

const SendModal = ({ accountId }: Props) => {
  const { accounts, setSyncInterval, syncInterval } = useAccountsStore();
  const [selectedAccount, setSelectedAccount] = useState<Account | TokenAccount>(
    accounts
      .flatMap((account) => [
        account,
        ...(account.subAccounts?.filter(
          (subAccount): subAccount is TokenAccount => subAccount.type === 'TokenAccount',
        ) || []),
      ])
      .find(({ id }) => id === accountId.replaceAll('/', '%2F')) || accounts[0],
  );
  const mainAccount = useMemo(
    () =>
      selectedAccount &&
      (selectedAccount.type === 'Account' ? selectedAccount : accounts.find((a) => a.id === selectedAccount?.parentId)),
    [accounts, selectedAccount],
  );

  const { transaction, status, updateTransaction, isPending, bridge } = useBridge(mainAccount!);

  const [step, setStep] = useState(0);
  const goNextStep = useCallback(() => {
    setStep(Math.min(step + 1, STEPS.length - 1));
  }, [step]);
  const goPreviousStep = useCallback(() => {
    setStep(Math.max(step - 1, 0));
  }, [step]);

  useEffect(() => {
    const previousInterval = syncInterval;
    setSyncInterval(30 * 1000);

    return () => {
      setSyncInterval(previousInterval);
    };
  }, []);

  return (
    <>
      {step > 0 && step < STEPS.length - 1 ? (
        <div
          className="absolute left-4 pt-2 text-zinc-500 hover:text-inherit hover:cursor-pointer"
          onClick={goPreviousStep}
        >
          {'< Back'}
        </div>
      ) : null}
      <div className="text-2xl text-center capitalize p-3">Send</div>
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
        <RecipientStep
          accounts={accounts}
          mainAccount={mainAccount!}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          status={status}
          transaction={transaction}
          updateTransaction={updateTransaction}
          isPending={isPending}
          goNextStep={goNextStep}
        />
      )}
      {step === 1 && (
        <AmountStep
          status={status}
          transaction={transaction}
          updateTransaction={updateTransaction}
          isPending={isPending}
          currency={selectedAccount.type === 'TokenAccount' ? selectedAccount.token : selectedAccount.currency}
          goNextStep={goNextStep}
        />
      )}
      {step === 2 && (
        <SummaryStep
          transaction={transaction}
          account={selectedAccount}
          status={status}
          currency={selectedAccount.type === 'TokenAccount' ? selectedAccount.token : selectedAccount.currency}
          goNextStep={goNextStep}
        />
      )}
      {step === 3 && (
        <SignatureStep transaction={transaction} account={mainAccount!} bridge={bridge} status={status!} />
      )}
    </>
  );
};

export default memo(SendModal);
