import { memo, useCallback, useMemo, useState } from 'react';
import type { TokenAccount } from '@ledgerhq/types-live';
import { useAccountsStore, useCurrencyPriceStore } from '../store';
import type { AccountWithSigners } from '../types';
import CurrencyIcon from './icons/CurrencyIcon';
import ChevronUp from './icons/ChevronUp';
import Check from './icons/Check';
import Star from './icons/Star';
import { theme } from '../config';

type Props = {
  account: AccountWithSigners;
  onClick?: (accountId: string) => void;
};

const AccountPreview = ({ account, onClick }: Props) => {
  const { updateAccount } = useAccountsStore();
  const onStarAccount = useCallback((account: AccountWithSigners) => {
    updateAccount({ ...account, starred: !account.starred });
  }, []);

  const tokenAccounts = useMemo(
    () =>
      account.subAccounts?.filter((subAccount): subAccount is TokenAccount => subAccount.type === 'TokenAccount') || [],
    [account],
  );
  const [showTokenAccounts, setShowTokenAccounts] = useState(false);
  const toggleTokenAccounts = useCallback(() => {
    setShowTokenAccounts(!showTokenAccounts);
  }, [showTokenAccounts]);

  const { prices } = useCurrencyPriceStore();

  return (
    <div
      className="bg-zinc-900 py-2 mb-3 rounded border border-transparent hover:border-zinc-600 hover:cursor-pointer"
      onClick={() => onClick?.(account.id)}
    >
      <div className="py-1 px-5 flex flex-row items-center justify-between">
        <div className="w-4/12">
          <div className="flex flex-row items-center gap-3">
            <CurrencyIcon currency={account.currency} color={account.currency.color} size={24} />
            <div>
              <div className="uppercase text-xs text-slate-300">{account.currency.name}</div>
              <div className="">{account.name}</div>
            </div>
          </div>
        </div>
        <div className="w-1/12">
          <Check color={theme.colors.lime['500']} />
        </div>
        <div className="w-2/12">
          {parseFloat(account.balance.dividedBy(10 ** account.unit.magnitude).toFixed(6))} {account.unit.code}
        </div>
        <div className="w-3/12">
          $
          {account.balance
            .dividedBy(10 ** account.unit.magnitude)
            .times(prices[account.unit.code.toLowerCase()] || 0)
            .toFixed(2)}
        </div>
        <div
          className="w-1/12 cursor-pointer flex justify-end"
          onClick={(e) => {
            e.stopPropagation();
            onStarAccount(account);
          }}
        >
          <Star
            color={account.starred ? theme.colors.yellow['400'] : 'none'}
            stroke={account.starred ? 'none' : theme.colors.white}
          />
        </div>
      </div>
      {tokenAccounts.length ? (
        <div className="pt-4 -mt-1">
          {showTokenAccounts &&
            tokenAccounts.map((tokenAccount) => (
              <div
                key={tokenAccount.id}
                className="py-4 px-5 flex flex-row items-center justify-between"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.(tokenAccount.id);
                }}
              >
                <div className="w-4/12 pl-8">
                  <div className="flex flex-row items-center gap-3">
                    <div className="rounded-badge w-5 aspect-square relative overflow-hidden flex justify-center items-center">
                      <div
                        style={{ backgroundColor: account.currency.color }}
                        className="absolute h-full w-full -z-0 opacity-10"
                      ></div>
                      <CurrencyIcon currency={tokenAccount.token} size={18} color={account.currency.color} />
                    </div>
                    <div>
                      <div className="">{tokenAccount.token.name}</div>
                    </div>
                  </div>
                </div>
                <div className="w-1/12"></div>
                <div className="w-2/12">
                  {parseFloat(tokenAccount.balance.dividedBy(10 ** tokenAccount.token.units[0].magnitude).toFixed(6))}{' '}
                  {tokenAccount.token.units[0].code}
                </div>
                <div className="w-3/12">
                  {prices[tokenAccount.token.id.toLowerCase()] && !tokenAccount.balance.isZero() ? (
                    `$${tokenAccount.balance
                      .dividedBy(10 ** tokenAccount.token.units[0].magnitude)
                      .times(prices[tokenAccount.token.id.toLowerCase()] || 0)
                      .toFixed(2)}`
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </div>
                <div className="w-1/12 cursor-pointer flex justify-end"></div>
              </div>
            ))}
          <hr className="mt-3 mb-2 h-[1px] border-none bg-zinc-700" />
          <div className="flex justify-center items-center">
            <button
              className="flex flex-row gap-2 items-center justify-center text-violet-400 flex-grow underline-offset-2 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                toggleTokenAccounts();
              }}
            >
              {showTokenAccounts ? `Hide tokens (${tokenAccounts.length})` : `Show tokens (${tokenAccounts.length})`}
              <ChevronUp size={12} className={!showTokenAccounts ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default memo(AccountPreview);
