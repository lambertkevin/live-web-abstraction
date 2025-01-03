import classNames from 'classnames';
import type { TokenAccount } from '@ledgerhq/types-live';
import React, { memo, useCallback, useEffect, useState } from 'react';
import type { Transaction as EvmTransaction, TransactionStatus } from '@ledgerhq/coin-evm/lib/types/transaction';
import { ethAddressRegEx } from '../../libraries/coin-evm-abstraction/getTransactionStatus';
import { EvmAbstractionTransaction } from '../../libraries/coin-evm-abstraction/types';
import CurrencyIcon from '../../components/icons/CurrencyIcon';
import ArrowDown from '../../components/icons/ArrowDown';
import type { AccountWithSigners } from '../../types';
import Select from '../../components/Select';
import { factoryContract } from '../../contracts';
import { provider } from '../../providers';
import { theme } from '../../config';

type Props = {
  accounts: AccountWithSigners[];
  selectedAccount: AccountWithSigners | TokenAccount;
  mainAccount: AccountWithSigners;
  setSelectedAccount: (value: React.SetStateAction<AccountWithSigners | TokenAccount>) => void;
  transaction: EvmTransaction | EvmAbstractionTransaction;
  status: TransactionStatus | null | undefined;
  updateTransaction: (transaction: Partial<EvmTransaction | EvmAbstractionTransaction>) => void;
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
  const [recipientDomain, setRecipientDomain] = useState('');

  useEffect(() => {
    if (!selectedAccount || !recipient) return;

    const domainRegex = /(.*)\.(.*\..{2,})/g;
    const [, username, domain] = domainRegex.exec(recipient) || [];
    if (!username?.length || !domain?.length) {
      setRecipientDomain('');
      updateTransaction({
        recipient,
        subAccountId: selectedAccount.type === 'TokenAccount' ? selectedAccount.id : undefined,
        chainId: mainAccount.currency.ethereumLikeInfo?.chainId,
      });

      return;
    }

    factoryContract.getAddress(username, domain, 0).then((address: string) => {
      provider.getCode(address).then((code) => {
        if (code !== '0x') {
          setRecipientDomain(recipient);
          updateTransaction({
            recipient: address,
            subAccountId: selectedAccount.type === 'TokenAccount' ? selectedAccount.id : undefined,
            chainId: mainAccount.currency.ethereumLikeInfo?.chainId,
          });
        } else {
          setRecipientDomain('');
          updateTransaction({
            recipient,
            subAccountId: selectedAccount.type === 'TokenAccount' ? selectedAccount.id : undefined,
            chainId: mainAccount.currency.ethereumLikeInfo?.chainId,
          });
        }
      });
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

        {recipientDomain &&
          !isPending &&
          transaction.recipient !== recipientDomain &&
          transaction.recipient.match(ethAddressRegEx) && (
            <div className="flex flex-col my-4 p-3 text-center alert alert-info rounded-sm gap-0">
              <span>Domain resolution: </span>
              <span className="font-semibold">{transaction.recipient}</span>
            </div>
          )}
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
