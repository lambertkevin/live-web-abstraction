import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccountsStore } from '../../store';
import ConnectAction from './ConnectAction';
import SignAction from './SignAction';
import { RawEthersTransaction } from '../../types';

export const ACTIONS = {
  Connect: ConnectAction,
  Sign: SignAction,
};

export const ConnectView = () => {
  const [origin, setOrigin] = useState<string>();
  const [connected, setConnected] = useState(false);

  const [actionName, setActionName] = useState<keyof typeof ACTIONS>();
  const Action = useMemo(() => (actionName ? ACTIONS[actionName] : null), [actionName]);

  const { accounts } = useAccountsStore();
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id);
  const selectedAccount = useMemo(
    () => accounts.find(({ id }) => id === selectedAccountId),
    [accounts, selectedAccountId],
  );

  const [initialTransaction, setInitialTransaction] = useState<RawEthersTransaction>();

  const sendParentMessage = useCallback(
    ({ type, data }: { type: string; data?: Record<string, unknown> }) =>
      parent.window.postMessage(
        {
          type,
          data,
        },
        '*',
      ),
    [],
  );
  useEffect(() => {
    sendParentMessage({ type: 'rendered' });
  }, []);
  useEffect(() => {
    const listener = async (event: MessageEvent) => {
      setOrigin(event.origin);
      const {
        data: content,
      }: { data: { type: string; data?: Record<string, unknown>; target?: string; source?: string } } = event;
      if (content.target || content.source) return;

      switch (content.type) {
        case 'connect':
          if (!accounts.length) {
            sendParentMessage({ type: 'error', data: { error: 'NoAccounts' } });
            break;
          }

          setActionName('Connect');
          sendParentMessage({ type: 'open' });
          break;

        case 'sign':
          if (connected && content.data?.transaction) {
            console.log(content.data?.transaction);
            setActionName('Sign');
            setInitialTransaction(content.data.transaction as RawEthersTransaction);
            sendParentMessage({ type: 'open' });
          } else {
            sendParentMessage({ type: 'error', data: { error: !connected ? 'NotConnected' : 'NoTransaction' } });
          }
          break;
      }
    };

    window.addEventListener('message', listener, false);
    return () => {
      window.removeEventListener('message', listener, false);
    };
  }, [accounts.length, connected, sendParentMessage]);

  return (
    <>
      <button
        className="btn btn-transparent opacity-60 hover:opacity-80 absolute right-2 top-2 p-2 text-lg z-10 outline-none"
        onClick={() => {
          sendParentMessage({ type: 'close' });
          setActionName(undefined);
        }}
      >
        ✕
      </button>
      {Action && origin ? (
        <Action
          origin={origin}
          accounts={accounts}
          selectedAccount={selectedAccount}
          selectedAccountId={selectedAccountId}
          setConnected={setConnected}
          setSelectedAccountId={setSelectedAccountId}
          initialTransaction={initialTransaction}
          sendParentMessage={sendParentMessage}
          setActionName={setActionName}
        />
      ) : null}
    </>
  );
};

export default ConnectView;
