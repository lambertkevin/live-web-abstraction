import type Transport from '@ledgerhq/hw-transport';
import { memo, useEffect, useState } from 'react';
import type { AccountBridge, SignedOperation } from '@ledgerhq/types-live';
import getDeviceTransactionConfig from '@ledgerhq/coin-evm/lib/deviceTransactionConfig';
import type { CommonDeviceTransactionField } from '@ledgerhq/coin-framework/lib/transaction/common';
import type { Transaction as EvmTransaction, TransactionStatus } from '@ledgerhq/coin-evm/lib/types/transaction';
import getDeviceEvmAbstractionTransactionConfig from '../../libraries/coin-evm-abstraction/deviceTransactionConfig';
import { EvmAbstractionTransaction } from '../../libraries/coin-evm-abstraction/types';
import { useAccountsStore, useModalStore } from '../../store';
import type { AccountWithSigners, Signer } from '../../types';
import RoundCheck from '../../components/icons/RoundCheck';
import RoundCross from '../../components/icons/RoundCross';
import { SignerOptions } from '../../helpers';
import { theme } from '../../config';

type Props = {
  transaction: EvmTransaction | EvmAbstractionTransaction;
  account: AccountWithSigners;
  bridge: AccountBridge<EvmTransaction> | AccountBridge<EvmAbstractionTransaction>;
  isPending: boolean;
  status: TransactionStatus;
  signer: Signer | undefined;
  setSigner: (transport: Signer | undefined) => void;
  transport: Transport | undefined;
};

const SignatureStep = ({ transaction, account, bridge, status, isPending, signer, transport, setSigner }: Props) => {
  console.log({ status });
  const { updateAccount } = useAccountsStore();
  const [signedOperation, setSignedOperation] = useState<SignedOperation | undefined>();
  const [error, setError] = useState<Error | undefined>();

  const [deviceConfig, setDeviceConfig] = useState<CommonDeviceTransactionField[]>([]);
  useEffect(() => {
    if (transaction.family === 'evm') {
      setDeviceConfig(getDeviceTransactionConfig({ account, parentAccount: null, transaction, status }));
    } else {
      getDeviceEvmAbstractionTransactionConfig({
        account,
        parentAccount: null,
        transaction,
        status,
      }).then(setDeviceConfig);
    }
  }, [account, status, transaction]);

  useEffect(() => {
    if (!signer || isPending) return;
    setError(undefined);
    bridge
      .signOperation({
        account,
        deviceId: '',
        transaction,
      })
      .subscribe({
        async next(event) {
          if (event.type === 'signed') {
            setSignedOperation(event.signedOperation);
            await transport?.close();
          }
        },
        async error(err) {
          setError(err);
          await transport?.close();
        },
      });
  }, [account, bridge, isPending, transaction, signer, transport]);

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

  if (error) {
    return (
      <>
        {!signedOperation ? (
          <>
            <div className="px-6">
              <div className="flex flex-row justify-center items-center">
                <div className="px-3 py-10 flex flex-col justify-center items-center">
                  <div className="font-bold mb-4 text-center">Transaction has been rejected</div>
                  <div className="font-semibold mb-4 text-center alert alert-error">{error.message}</div>
                  <button
                    className="btn btn-neutral border border-primary hover:btn-primary px-10"
                    disabled={!signer}
                    onClick={async () => {
                      if (!signer) return;
                      setSigner({ ...signer });
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="px-6">
              <div className="flex flex-row justify-center items-center">
                <div className="px-3 py-10 flex flex-col justify-center items-center">
                  <RoundCross size={50} color={theme.colors.red[600]} />
                  <div className="font-bold mb-4 text-center">Broadcast failed</div>
                  <div className="font-semibold mb-4 text-center alert alert-error">{error.message}</div>
                  <button
                    className="btn btn-neutral border border-primary hover:btn-primary px-10"
                    disabled={!signer}
                    onClick={() => {
                      if (!signer) return;
                      setSigner({ ...signer! });
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
  }

  if (signedOperation) {
    return isBroadcasted ? (
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
    ) : (
      <>
        <div className="px-6">
          <div className="flex flex-row justify-center items-center">
            <div className="flex flex-col justify-center items-center gap-3 text-center py-10">
              <span className="loading loading-infinity loading-lg"></span>
            </div>
          </div>
        </div>
        <hr className="border-zinc-700 my-4" />
        <div className="flex px-6 justify-end items-center">
          <button className="btn btn-neutral" onClick={closeModal} disabled={true}>
            Close
          </button>
        </div>
      </>
    );
  }

  if (!signer) {
    return (
      <>
        <div className="text-lg pb-4 text-center">Pick a Signer :</div>
        <div className="flex flex-row gap-4 py-4 px-6">
          {SignerOptions.filter((option) => account.signers?.find((signer) => signer.mode === option.mode)).map(
            (option) => (
              <button
                key={option.type}
                onClick={() => {
                  setSigner(option as Signer);
                }}
                className="btn aspect-square flex-1 text-center disabled:pointer-events-auto disabled:cursor-not-allowed hover:border hover:border-accent"
              >
                <span>{option.name}</span>
              </button>
            ),
          )}
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="px-6">
          <div className="flex flex-row justify-center items-center">
            <div className="px-3">
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
              {signer.mode === 'EOA' ? <img src="/confirm-nano.png" className="py-10" /> : null}
            </div>
          </div>
        </div>
      </>
    );
  }
};

export default memo(SignatureStep);
