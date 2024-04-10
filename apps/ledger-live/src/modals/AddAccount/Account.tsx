import uniqBy from 'lodash/uniqBy';
import Eth from '@ledgerhq/hw-app-eth';
import { memo, useCallback, useEffect, useState } from 'react';
import type { CryptoCurrency } from '@ledgerhq/types-cryptoassets';
import { buildCurrencyBridge } from '@ledgerhq/coin-evm/lib/bridge/js';
import CurrencyIcon from '../../components/icons/CurrencyIcon';
import type { AccountWithSigners, Signer } from '../../types';
import { useAccountsStore, useModalStore } from '../../store';

type Props = {
  currency: CryptoCurrency;
  signer: Signer;
};

const AccountStep = ({ signer, currency }: Props) => {
  const [accounts, setAccounts] = useState<AccountWithSigners[]>([]);
  const { addAccount } = useAccountsStore();
  const { closeModal } = useModalStore();

  useEffect(() => {
    (async () => {
      const { preload } = buildCurrencyBridge(() => ({}) as any);
      await preload(currency);
    })();
  }, []);

  useEffect(() => {
    if (!signer || signer.type === 'webauthn' || !signer.transport || accounts.length) return;

    const bridge = buildCurrencyBridge(async (deviceId: string, fn) => {
      console.log('building bridge');
      const app = new Eth(signer.transport!);
      return fn(app);
    });

    const obs = bridge
      .scanAccounts({ currency, deviceId: '', syncConfig: { paginationConfig: { operations: 10 } } })
      .subscribe({
        async next(event) {
          console.log(event);
          if (event.type === 'discovered') {
            setAccounts(uniqBy([...accounts, event.account], ({ id }) => id));
            await signer.transport?.close();
          }
        },
        error(err) {
          console.log({ err });
        },
        complete() {
          console.log('finished!');
        },
      });

    return () => obs.unsubscribe();
  }, [accounts, currency, signer]);

  const onContinue = useCallback(() => {
    accounts.forEach(addAccount);
    closeModal();
  }, [accounts, addAccount, closeModal]);

  return (
    <>
      <div className="px-6">
        <div className="flex flex-col items-center">
          {accounts.length ? (
            <div className="flex flex-row w-full p-10">
              {accounts.map((account) => (
                <div key={account.id} className="flex flex-row justify-between w-full">
                  <div className="w-8/12 flex flex-row gap-2">
                    <CurrencyIcon currency={account.currency} color={account.currency.color} size={20} />
                    <span>
                      {account.freshAddress.substring(0, 7) +
                        '...' +
                        account.freshAddress.substring(
                          account.freshAddress.length - 6,
                          account.freshAddress.length - 1,
                        )}
                    </span>
                  </div>
                  <div className="w-3/12">
                    {parseFloat(account.balance.dividedBy(10 ** currency.units[0].magnitude).toPrecision(2))}{' '}
                    {currency.units[0].code}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="loading loading-infinity loading-lg animate-ping"></span>
          )}
        </div>
      </div>
      <hr className="border-zinc-700 my-4 mt-10" />
      <div className="flex px-6 justify-end items-center">
        <button className="btn btn-primary" disabled={accounts.length === 0} onClick={onContinue}>
          <span>Add account</span>
        </button>
      </div>
    </>
  );
};

export default memo(AccountStep);
