import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccountsStore } from '../../store';
import { RawEthersTransaction } from '../../types';
import ConnectAction from './ConnectAction';
import SignAction from './SignAction';
// import SignMessageAction from './SignMessageAction';

export const ACTIONS = {
  Connect: ConnectAction,
  // SignMessage: SignMessageAction,
  Sign: SignAction,
};

export const ConnectView = () => {
  const [origin, setOrigin] = useState<string>();
  const [connected, setConnected] = useState(false);

  const [actionName, setActionName] = useState<keyof typeof ACTIONS>();
  const Action = useMemo(() => (actionName ? ACTIONS[actionName] : null), [actionName]);

  const { accounts } = useAccountsStore();
  const [selectedAccountId, setSelectedAccountId] = useState<string>();
  const selectedAccount = useMemo(
    () => accounts.find(({ id }) => id === selectedAccountId),
    [accounts, selectedAccountId],
  );

  const [initialTransaction, setInitialTransaction] = useState<RawEthersTransaction>();

  const [actionId, setActionId] = useState<string>();

  const sendParentMessage = useCallback(
    (message: {
      id?: string;
      type?: string;
      data?: Record<string, unknown>;
      result?: string | string[];
      error?: string | string[];
    }) => parent.window.postMessage(message, '*'),
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
      }: {
        data: {
          method?: string;
          params: RawEthersTransaction[];
          id?: string;
          type: string;
          data?: Record<string, unknown>;
        };
      } = event;
      if (content.type === 'dapp') {
        console.log(content);
        switch (content.method) {
          case 'eth_requestAccounts':
          case 'enable':
          case 'eth_accounts':
            sendParentMessage({
              id: content.id,
              result: selectedAccount ? [selectedAccount.freshAddress] : [],
            });
            break;
          case 'eth_chainId':
            sendParentMessage({ id: content.id, result: `0x${Number(1).toString(16)}` });
            break;
          case 'eth_sendTransaction':
            if (connected && content.params[0]) {
              console.log(content.params[0]);
              setActionId(content.id);
              setActionName('Sign');
              setInitialTransaction(content.params[0]);
              sendParentMessage({ type: 'open' });
            } else {
              sendParentMessage({
                id: content.id,
                error: !connected ? 'NotConnected' : 'NoTransaction',
              });
            }
            break;
          case 'personal_sign':
            if (connected && content.params[0]) {
              console.log(content.params[0]);
              setActionId(content.id);
              // setActionName('SignMessage');
              setActionName('Sign');
              setInitialTransaction(content.params[0]);
              sendParentMessage({ type: 'open' });
            } else {
              sendParentMessage({
                id: content.id,
                error: !connected ? 'NotConnected' : 'NoTransaction',
              });
            }
            break;
          case 'eth_signTypedData':
          case 'eth_signTypedData_v2':
          case 'eth_signTypedData_v3':
          case 'eth_signTypedData_v4':
            if (connected && content.params[1]) {
              console.log(content.params[1]);
              setActionId(content.id);
              // setActionName('SignMessage');
              setActionName('Sign');
              setInitialTransaction(content.params[1]);
              sendParentMessage({ type: 'open' });
            } else {
              sendParentMessage({
                id: content.id,
                error: !connected ? 'NotConnected' : 'NoTransaction',
              });
            }
            break;
          default:
            void axios({
              method: 'POST',
              url: 'https://eth-dapps.api.live.ledger.com',
              data: content,
            }).then((res) => {
              sendParentMessage(res.data);
            });
            break;
        }
      } else {
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
      }
    };

    window.addEventListener('message', listener, false);
    return () => {
      window.removeEventListener('message', listener, false);
    };
  }, [accounts.length, connected, selectedAccount, sendParentMessage]);

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
          actionId={actionId}
          setActionId={setActionId}
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
