import classNames from 'classnames';
import { useParams } from 'react-router-dom';
import type { TokenAccount } from '@ledgerhq/types-live';
import { memo, useCallback, useEffect, useMemo } from 'react';
import CurrencyIcon from '../../components/icons/CurrencyIcon';
import ArrowFromBottom from '../../components/icons/ArrowFromBottom';
import ArrowToBottom from '../../components/icons/ArrowToBottom';
import TokenAccountsPreview from '../../components/TokenAccountsPreview';
import OperationsHistory from '../../components/OperationsHistory';
import { useAccountsStore, useModalStore } from '../../store';
import NftsPreview from '../../components/NftsPreview';
import Coins from '../../components/icons/Coins';
import Star from '../../components/icons/Star';
import Swap from '../../components/icons/Swap';
import Buy from '../../components/icons/Buy';
import Graph from '../../components/Graph';
import { theme } from '../../config';

const Account = () => {
  const { accountId } = useParams();
  const { accounts, updateAccount, syncAccounts } = useAccountsStore();
  const account = useMemo(
    () =>
      accounts
        .flatMap((account) => [
          account,
          ...(account.subAccounts?.filter(
            (subAccount): subAccount is TokenAccount => subAccount.type === 'TokenAccount',
          ) || []),
        ])
        .find(({ id }) => id === accountId?.replaceAll('/', '%2F')),
    [accountId, accounts],
  );
  const currency = useMemo(
    () => (account ? (account.type === 'Account' ? account.currency : account.token) : null),
    [account],
  );

  const { openModal } = useModalStore();

  const onStarAccount = useCallback(() => {
    if (!account || account.type !== 'Account') return;
    updateAccount({ ...account, starred: !account.starred });
  }, [account, updateAccount]);

  useEffect(() => {
    syncAccounts();
  }, []);

  if (!account || !currency) return null;
  return (
    <div className="flex flex-col gap-8">
      <div>
        <header className="flex flex-row gap-1 justify-between mb-4">
          <div className="flex flex-row gap-1">
            <CurrencyIcon
              currency={currency}
              size={36}
              color={currency.type === 'CryptoCurrency' ? currency.color : currency.parentCurrency.color}
            />
            <div>
              <div className="uppercase text-[0.65rem] tracking-[0.1em] text-slate-300">{currency.name}</div>
              <div className="text-2xl">{account.type === 'Account' ? account.name : currency.name}</div>
            </div>
          </div>
          <div>
            {account.type === 'Account' && (
              <button
                onClick={onStarAccount}
                className={classNames([
                  account.starred ? 'bg-yellow-400 border-yellow-400' : 'hover:bg-white hover:bg-opacity-70',
                  'border rounded-full aspect-square w-10 flex justify-center items-center',
                ])}
              >
                <Star
                  color={account.starred ? theme.colors.white : 'none'}
                  stroke={account.starred ? 'none' : theme.colors.white}
                />
              </button>
            )}
          </div>
        </header>
        <div className="flex gap-3">
          {account.type === 'Account' && (
            <>
              <button className="btn btn-primary rounded-full ring-2 ring-transparent hover:ring-opacity-50 hover:ring-violet-500">
                <Coins />
                Stake
              </button>
              <button className="btn btn-primary rounded-full ring-2 ring-transparent hover:ring-opacity-50 hover:ring-violet-500">
                <Swap />
                Swap
              </button>
              <button className="btn btn-primary rounded-full ring-2 ring-transparent hover:ring-opacity-50 hover:ring-violet-500">
                <Buy /> Buy
              </button>
            </>
          )}
          <button
            className="btn btn-primary rounded-full ring-2 ring-transparent hover:ring-opacity-50 hover:ring-violet-500"
            onClick={() => openModal('send', { accountId: account.id })}
          >
            <ArrowFromBottom />
            Send
          </button>
          <button className="btn btn-primary rounded-full ring-2 ring-transparent hover:ring-opacity-50 hover:ring-violet-500">
            <ArrowToBottom />
            Receive
          </button>
        </div>
      </div>
      <Graph account={account} />
      {account?.type === 'Account' && account.nfts?.length ? <NftsPreview account={account} /> : null}
      {account?.type === 'Account' ? <TokenAccountsPreview account={account} /> : null}
      <OperationsHistory account={account} />
    </div>
  );
};

export default memo(Account);
