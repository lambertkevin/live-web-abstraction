import { useNavigate } from 'react-router-dom';
import { memo, useCallback, useMemo, useState } from 'react';
import type { Account, TokenAccount } from '@ledgerhq/types-live';
import { useCurrencyPriceStore } from '../store';
import CurrencyIcon from './icons/CurrencyIcon';
import ChevronUp from './icons/ChevronUp';
import { theme } from '../config';
import Star from './icons/Star';

type Props = {
  account: Account;
};

const TokenAccountsPreview = ({ account }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const toggleShowAll = useCallback(() => setShowAll(!showAll), [showAll]);
  const navigate = useNavigate();
  const onClick = useCallback((accountId: string) => () => navigate(`/accounts/${accountId}`), []);

  const tokenAccounts: TokenAccount[] = useMemo(() => {
    const accounts =
      account.subAccounts?.filter((subAccount): subAccount is TokenAccount => subAccount.type === 'TokenAccount') || [];

    return showAll ? accounts : accounts.slice(0, 3);
  }, [account.subAccounts, showAll]);
  const { prices } = useCurrencyPriceStore();

  return (
    <div className="bg-zinc-900 rounded py-5">
      <div className="text-lg pb-5 px-5 border-b-zinc-800 border-b">Tokens</div>
      {tokenAccounts.map((tokenAccount) => (
        <div
          key={tokenAccount.id}
          className="py-4 px-5 flex flex-row items-center justify-between hover:cursor-pointer"
          onClick={onClick(tokenAccount.id)}
        >
          <div className="w-4/12">
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
          <div
            className="w-1/12 cursor-pointer flex justify-end"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Star
              color={tokenAccount.starred ? theme.colors.yellow['400'] : 'none'}
              stroke={tokenAccount.starred ? 'none' : theme.colors.white}
            />
          </div>
        </div>
      ))}
      {(account.subAccounts?.length || 0) > 3 ? (
        <>
          <hr className="mt-2 mb-4 h-[1px] border-none bg-zinc-800" />
          <div className="flex justify-center items-center">
            <button
              className="flex flex-row gap-2 items-center justify-center text-violet-400 flex-grow underline-offset-2 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                toggleShowAll();
              }}
            >
              {showAll
                ? `Hide tokens (${account.subAccounts?.length})`
                : `Show tokens (${account.subAccounts?.length})`}
              <ChevronUp size={12} className={!showAll ? 'rotate-180' : ''} />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default memo(TokenAccountsPreview);
