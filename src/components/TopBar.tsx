import { memo, useCallback } from 'react';
import { useAccountsStore } from '../store';
import RoundCheck from './icons/RoundCheck';
import LiveLoader from './icons/LiveLoader';
import { theme } from '../config';

const TopBar = () => {
  const accountStore = useAccountsStore();
  const onClick = useCallback(async () => {
    accountStore.syncAccounts();
  }, [accountStore]);

  return (
    <div className="flex flex-col h-10 items-end justify-center content-stretch mb-5 flex-grow-0">
      <button className="btn btn-transparent text-base" onClick={onClick}>
        {accountStore.isSyncing ? (
          <>
            <LiveLoader color={theme.colors.zinc['700']} className="inline-flex animate-spin" />
            Synchronizing...
          </>
        ) : (
          <>
            <RoundCheck color={theme.colors.lime['500']} className="inline-flex" />
            Synchronized
          </>
        )}
      </button>
    </div>
  );
};

export default memo(TopBar);
