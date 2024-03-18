import type Transport from '@ledgerhq/hw-transport';
import { memo, useEffect, useMemo, useState } from 'react';
import type { Transaction, TransactionStatus } from '@ledgerhq/coin-evm/lib/types/transaction';
import getDeviceTransactionConfig from '@ledgerhq/coin-evm/lib/deviceTransactionConfig';
import type { Account, AccountBridge, SignedOperation } from '@ledgerhq/types-live';
import RoundCheck from '../../components/icons/RoundCheck';
import { useAccountsStore, useModalStore } from '../../store';
import { theme } from '../../config';
import { SignerOptions } from '../../helpers';
import { Signer } from '../../types';

type Props = {
  transaction: Transaction;
  account: Account;
  bridge: AccountBridge<Transaction>;
  isPending: boolean;
  status: TransactionStatus;
  signer: Signer | undefined;
  setSigner: (transport: Signer | undefined) => void;
  transport: Transport | undefined;
  transportError: Error | undefined;
};

const SignatureStep = ({
  transaction,
  account,
  bridge,
  status,
  isPending,
  signer,
  setSigner,
  transport,
  transportError,
}: Props) => {
  const { updateAccount } = useAccountsStore();
  const [signedOperation, setSignedOperation] = useState<SignedOperation | undefined>();
  const [error, setError] = useState<Error | undefined>();

  const deviceConfig = useMemo(
    () => getDeviceTransactionConfig({ account, parentAccount: null, transaction, status }),
    [account, status, transaction],
  );

  useEffect(() => {
    if (!transport || isPending) return;
    setError(undefined);
    bridge.signOperation({ account, deviceId: '', transaction }).subscribe({
      next: (res) => {
        if (res.type === 'signed') {
          setSignedOperation(res.signedOperation);
        }
      },
      error(err) {
        console.log({ err });
        setError(err);
      },
    });
  }, [account, bridge, isPending, transport, transaction]);

  const [isBroadcasted, setIsBroadcasted] = useState(false);
  useEffect(() => {
    if (!signedOperation) return;
    (async () => {
      const optimisticOperation = await bridge.broadcast({ account, signedOperation });
      updateAccount({ ...account, pendingOperations: [optimisticOperation] });
      setIsBroadcasted(true);
    })();
  }, [account, bridge, signedOperation, updateAccount]);

  const { closeModal } = useModalStore();

  return (
    <>
      {isBroadcasted ? (
        <>
          <div className="px-6">
            <div className="flex flex-row justify-center items-center">
              <div className="flex flex-col justify-center items-center gap-3 text-center py-10">
                <RoundCheck size={50} color={theme.colors.lime['400']} />
                <span className="text-lg">Transaction sent</span>
                <span className="text-zinc-400 text-sm">
                  Your account balance will be updated when the blockchain confirms the transaction
                </span>
              </div>
            </div>
          </div>
          <hr className="border-zinc-700 my-4" />
          <div className="flex px-6 justify-end items-center">
            <button className="btn btn-neutral" onClick={closeModal}>
              Close
            </button>
          </div>
        </>
      ) : null}
      {!signer && (
        <>
          <div className="text-lg pb-4 text-center">Pick a Signer :</div>
          <div className="flex flex-row gap-4 py-4 px-6">
            {SignerOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => {
                  setSigner(option);
                }}
                disabled={!option.enabled}
                className="btn aspect-square flex-1 text-center disabled:pointer-events-auto disabled:cursor-not-allowed hover:border hover:border-accent"
              >
                <span>{option.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {signer && !transport && (
        <>
          <div className="text-lg p-10 pb-12 text-center">
            Openning the Nano app... <span className="loading loading-ring loading-xs" />
            {(transportError?.message?.includes('user gesture') || transportError?.message?.includes('GATT')) && (
              <div>
                <button className="btn btn-primary m-4" onClick={() => setSigner({ ...signer })}>
                  Reconnect {signer.name}
                </button>
              </div>
            )}
          </div>
        </>
      )}
      {!signedOperation && !error && signer && signer?.type !== 'webauthn' && transport ? (
        <>
          <div className="px-6">
            <div className="flex flex-row justify-center items-center">
              <div className="px-3">
                <div className="flex flex-row items justify-center mb-4">
                  <button className="btn btn-ghost outline-accent outline-none" onClick={() => setSigner(undefined)}>
                    {signer.name}
                  </button>
                </div>
                <div className="font-bold mb-14 text-center">
                  Please confirm the operation on your device to finalize it
                </div>
                {deviceConfig.map((field, i) => (
                  <div key={i} className="flex flew-row justify-between">
                    <div className="w-4/12 text-sm text-zinc-400">{field.label}</div>
                    <div className="w-7/12 text-sm mb-2 text-right break-keep">
                      {field.type === 'amount' && (
                        <>
                          {transaction.amount.dividedBy(10 ** account.currency.units[0].magnitude).toFixed()}{' '}
                          {account.currency.units[0].code}
                        </>
                      )}
                      {field.type === 'address' && <span className="break-all">{field.address}</span>}
                      {field.type === 'text' && <span className="break-all">{field.value}</span>}
                      {field.type === 'fees' && (
                        <>
                          {status.estimatedFees.dividedBy(10 ** account.currency.units[0].magnitude).toFixed()}{' '}
                          {account.currency.units[0].code}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <img src="/confirm-nano.png" className="py-10" />
              </div>
            </div>
          </div>
        </>
      ) : null}

      {error && (
        <>
          <div className="px-6">
            <div className="flex flex-row justify-center items-center">
              <div className="px-3 py-10 flex flex-col justify-center items-center">
                <div className="font-bold mb-4 text-center">Transaction has been rejected</div>
                <button
                  className="btn btn-neutral border border-primary hover:btn-primary px-10"
                  onClick={() => {
                    setError(undefined);
                    setSigner(undefined);
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default memo(SignatureStep);
