import { memo } from 'react';
import LedgerLogo from '../../components/icons/LedgerLogo';
import CurrencyIcon from '../../components/icons/CurrencyIcon';
import { AccountWithSigners } from '../../types';
import type { ACTIONS } from '.';

type Props = {
  origin: string;
  accounts: AccountWithSigners[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  selectedAccount: AccountWithSigners | undefined;
  setConnected: (connected: boolean) => void;
  sendParentMessage: (params: { type: string; data?: Record<string, unknown> }) => void;
  setActionName: (actionName: keyof typeof ACTIONS | undefined) => void;
};

export const ConnectAction = ({
  origin,
  accounts,
  setSelectedAccountId,
  selectedAccountId,
  selectedAccount,
  setConnected,
  sendParentMessage,
  setActionName,
}: Props) => {
  return (
    <div className="flex flex-col flex-grow w-32 justify-between p-10 bg-zinc-950">
      <div className="flex flex-col items-center">
        <LedgerLogo size={50} />
        <span className="w-full text-center text-lg p-2 uppercase rounded border-t border-zinc-800 border-solid">
          Connection to Ledger Live Web
        </span>
      </div>
      <div className="p-2 text-center text-lg">Would you like to connect to this shit: {origin} ?</div>
      <div className="flex flex-row w-full px-4 py-2">
        <div className="flex flex-col flex-grow gap-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-row justify-between items-center w-full border border-zinc-700 py-4 px-3 rounded gap-3"
            >
              <input
                type="checkbox"
                checked={selectedAccountId === account.id}
                onChange={() => setSelectedAccountId(account.id)}
                className="checkbox"
              />
              <div className="flex flex-row gap-2 flex-grow items-center">
                <CurrencyIcon currency={account.currency} color={account.currency.color} size={20} />
                <span className="flex flex-col">
                  <span className="text-lg">{account.name}</span>
                  <span className="text-zinc-500">
                    {account.freshAddress.substring(0, 7) +
                      '...' +
                      account.freshAddress.substring(account.freshAddress.length - 6, account.freshAddress.length - 1)}
                  </span>
                </span>
              </div>
              <div className="flex">
                {parseFloat(account.balance.dividedBy(10 ** account.currency.units[0].magnitude).toPrecision(2))}{' '}
                {account.currency.units[0].code}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flew-row flew-grow justify-between gap-2 items-stretch my-4 px-4">
        <button className="btn btn-secondary" onClick={() => parent.window.postMessage({ type: 'close' }, '*')}>
          Nope.
        </button>
        <button
          className="btn btn-accent"
          onClick={() => {
            setConnected(true);
            sendParentMessage({
              type: 'connect:response',
              data: {
                address: selectedAccount?.freshAddress,
              },
            });
            sendParentMessage({ type: 'close' });
            setActionName(undefined);
          }}
        >
          Yes please
        </button>
      </div>
    </div>
  );
};

export default memo(ConnectAction);
