import React, { memo, useCallback, useEffect, useState } from 'react';
import type { Account, TokenAccount } from '@ledgerhq/types-live';
import type { Transaction, TransactionStatus } from '@ledgerhq/coin-evm/lib/types/transaction';
import CurrencyIcon from '../../components/icons/CurrencyIcon';
import ArrowDown from '../../components/icons/ArrowDown';
import Select from '../../components/Select';
import { theme } from '../../config';
import classNames from 'classnames';

type Props = {
  accounts: Account[];
  selectedAccount: Account | TokenAccount;
  mainAccount: Account;
  setSelectedAccount: (value: React.SetStateAction<Account | TokenAccount>) => void;
  transaction: Transaction;
  status: TransactionStatus | null | undefined;
  updateTransaction: (transaction: Partial<Transaction>) => void;
  isPending: boolean;
  goNextStep: () => void;
};

const RecipientStep = ({
  accounts,
  selectedAccount,
  mainAccount,
  setSelectedAccount,
  transaction,
  status,
  updateTransaction,
  isPending,
  goNextStep,
}: Props) => {
  const { errors, warnings } = status || {};

  const onSelectAccountChange = useCallback(
    ({ value }: { value: string }) => {
      const newSelectedAccount = accounts
        .flatMap((a) => [
          a,
          ...(a.subAccounts?.filter((subAccount): subAccount is TokenAccount => subAccount.type === 'TokenAccount') ||
            []),
        ])
        .find(({ id }) => id === value);
      if (newSelectedAccount) setSelectedAccount(newSelectedAccount);
    },
    [accounts, setSelectedAccount],
  );

  const [recipient, setRecipient] = useState('');
  useEffect(() => {
    if (!selectedAccount) return;
    updateTransaction({
      recipient,
      subAccountId: selectedAccount.type === 'TokenAccount' ? selectedAccount.id : undefined,
      chainId: mainAccount.currency.ethereumLikeInfo?.chainId,
    });
  }, [mainAccount.currency.ethereumLikeInfo?.chainId, recipient, selectedAccount, updateTransaction]);

  const options = accounts.flatMap((account) => [
    {
      label: (
        <div className="flex flex-row items-center py-2.5 justify-between">
          <div className="flex flex-row gap-3 w-6/12 items-center">
            <div className="w-[20px] aspect-square">
              <CurrencyIcon currency={account.currency} size={24} color={account.currency.color} />
            </div>
            <div className="whitespace-nowrap overflow-ellipsis overflow-hidden">{account.name}</div>
          </div>
          <div className="w-3/12 text-right">
            {parseFloat(account.balance.dividedBy(10 ** account.unit.magnitude).toFixed(5))} {account.unit.code}
          </div>
        </div>
      ),
      value: account.id,
    },
    ...(account.subAccounts
      ?.filter((subAccount): subAccount is TokenAccount => subAccount.type === 'TokenAccount')
      ?.map((subAccount) => ({
        label: (
          <div className="subaccount flex flex-row gap-3 items-center justify-between pl-4 border-l border-l-zinc-800 py-2.5">
            <div className="flex flex-row gap-3 w-6/12 items-center">
              <div className="rounded-badge w-[20px] aspect-square relative overflow-hidden flex justify-center items-center">
                <div
                  style={{ backgroundColor: account.currency.color }}
                  className="absolute h-full w-full -z-0 opacity-10"
                ></div>
                <CurrencyIcon currency={subAccount.token} size={18} color={account.currency.color} />
              </div>
              <div>{subAccount.token.name}</div>
            </div>
            <div className="w-3/12 text-right">
              {parseFloat(subAccount.balance.dividedBy(10 ** subAccount.token.units[0].magnitude).toFixed(5))}{' '}
              {subAccount.token.ticker}
            </div>
          </div>
        ),
        value: subAccount.id,
      })) || []),
  ]);

  return (
    <>
      <div className="px-6">
        <label className="text-sm text-zinc-400 mb-1 inline-flex">Account to debit</label>
        <Select
          options={options}
          placeholder="Search"
          openMenuOnClick={true}
          onChange={onSelectAccountChange}
          value={options.find(({ value }) => value === selectedAccount?.id)}
        />
        <div className="relative">
          <div className="flex rounded-full aspect-square w-8 bg-zinc-900 border border-zinc-700 items-center justify-center absolute left-[50%] translate-x-[-50%] translate-y-[-50%]">
            <ArrowDown color={theme.colors.violet['300']} />
          </div>
          <hr className="border-zinc-700 my-10" />
        </div>

        <label className="text-sm text-zinc-400 mb-1 inline-flex">Recipient address</label>
        <input
          className={classNames(
            'input border w-full focus:outline-none',
            transaction?.recipient.length && errors?.recipient ? 'border-error focus:border-error' : 'border-zinc-700',
            transaction?.recipient.length && warnings?.recipient
              ? 'border-warning focus:border-warning'
              : 'border-zinc-700',
          )}
          type="text"
          placeholder={`Enter ${mainAccount?.currency.name} address`}
          value={recipient || ''}
          onChange={(e) => {
            if (!selectedAccount) return;
            setRecipient(e.target.value);
          }}
          disabled={!selectedAccount}
        />
        {transaction?.recipient.length > 0 && !isPending && errors?.recipient && (
          <div className="label">
            <span className="label-text-alt text-error pl-2">{errors.recipient.message}</span>
          </div>
        )}
        {transaction?.recipient.length > 0 && !isPending && warnings?.recipient && (
          <div className="label">
            <span className="label-text-alt text-warning pl-2">{warnings.recipient.message}</span>
          </div>
        )}
      </div>
      <hr className="border-zinc-700 my-4" />
      <div className="flex px-6 justify-end">
        <button
          className="btn btn-primary"
          disabled={!recipient || !!errors?.recipient || isPending}
          onClick={goNextStep}
        >
          <span className={isPending ? 'opacity-0' : ''}>Continue</span>
          {isPending ? <span className="loading loading-spinner loading-md absolute"></span> : null}
        </button>
      </div>
    </>
  );
};

export default memo(RecipientStep);
