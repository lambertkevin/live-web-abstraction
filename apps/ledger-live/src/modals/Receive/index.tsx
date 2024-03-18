import Eth from '@ledgerhq/hw-app-eth';
import { memo, useEffect, useMemo, useState } from 'react';
import { buildAccountBridge as buildEvmAbstractionAccountBridge } from '../../libraries/coin-evm-abstraction/bridge';
import type { TokenAccount } from '@ledgerhq/types-live';
import { buildAccountBridge } from '@ledgerhq/coin-evm/lib/bridge/js';
import { useAccountsStore, useModalStore } from '../../store';
import RoundCheck from '../../components/icons/RoundCheck';
import { AccountWithSigners } from '../../types';
import { openNanoApp } from '../../helpers';

type Props = {
  accountId: string;
};

const Receive = ({ accountId }: Props) => {
  const { accounts } = useAccountsStore();
  const { closeModal } = useModalStore();
  const selectedAccount = useMemo<AccountWithSigners | TokenAccount>(
    () =>
      accounts
        .flatMap((account) => [
          account,
          ...(account.subAccounts?.filter(
            (subAccount): subAccount is TokenAccount => subAccount.type === 'TokenAccount',
          ) || []),
        ])
        .find(({ id }) => id === accountId.replaceAll('/', '%2F')) || accounts[0],
    [accountId, accounts],
  );
  const mainAccount = useMemo(
    () =>
      selectedAccount &&
      (selectedAccount.type === 'Account' ? selectedAccount : accounts.find((a) => a.id === selectedAccount?.parentId)),
    [accounts, selectedAccount],
  );
  console.log({ mainAccount });

  const isEOAAccount = useMemo(() => !mainAccount?.signers?.length, [mainAccount?.signers]);
  const [address, setAddress] = useState(isEOAAccount ? mainAccount?.freshAddress : undefined);

  useEffect(() => {
    if (!mainAccount) {
      closeModal();
      return;
    }

    if (isEOAAccount) {
      openNanoApp('Ethereum', 'ledger-usb').then(([transport]) => {
        if (!transport) throw new Error('No transport');
        const bridge = buildAccountBridge((_, fn) => {
          const app = new Eth(transport);
          return fn(app);
        });

        (async () => {
          const { address } = (await bridge.receive(mainAccount, { deviceId: '', verify: true }).toPromise()) || {};
          if (address === mainAccount?.freshAddress) {
            closeModal();
          }
        })();
      });
    } else {
      const bridge = buildEvmAbstractionAccountBridge();
      (async () => {
        const { address: smartContractAddress } =
          (await bridge.receive(mainAccount, { deviceId: '', verify: true }).toPromise()) || {};
        setAddress(smartContractAddress);
      })();
    }
  }, []);

  const [isCopied, setIsCopied] = useState(false);
  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setIsCopied(false);
      }, 1000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isCopied]);

  if (!mainAccount) return <></>;

  return (
    <>
      <div className="text-2xl text-center capitalize p-3">Receive</div>
      <div className="px-6 mt-6 flex flex-col">
        <div className="mb-2">Address for {mainAccount.name}</div>
        <div className="flex flex-row">
          <input
            type="text"
            className="input input-disabled text-white border-1 border-zinc-700 border-r-0 text-center rounded-r-none flex-grow"
            value={address}
          />
          <div className="tooltip tooltip-right text-xs" data-tip={isCopied ? 'Copied!' : 'Copy'}>
            <button
              className="btn btn-ghost h-full bg-zinc-900 w-[2.5rem] border-zinc-700 border- rounded-l-none cursor-pointer text-xl"
              onClick={() => navigator.clipboard.writeText(mainAccount.freshAddress).then(() => setIsCopied(true))}
            >
              {!isCopied ? '◲' : '✓'}
            </button>
          </div>
        </div>
        {isEOAAccount ? (
          <>
            <hr className="my-8" />
            <img src="/confirm-nano.png" className="py-6" />
          </>
        ) : (
          <>
            <button
              className="btn btn-primary flex flex-row gap-1 my-8 items-center justify-center"
              disabled={!address}
              onClick={closeModal}
            >
              <span>Validated</span>
              <span>
                <RoundCheck size={15} />
              </span>
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default memo(Receive);
