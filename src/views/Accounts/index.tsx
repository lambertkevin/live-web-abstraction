import { memo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPreview from '../../components/AccountPreview';
import { useAccountsStore, useModalStore } from '../../store';
import Plus from '../../components/icons/Plus';

const Accounts = () => {
  const { openModal } = useModalStore();
  const { syncAccounts, accounts } = useAccountsStore();
  const navigate = useNavigate();

  const onClick = useCallback((accountId: string) => navigate(`/accounts/${accountId}`), [navigate]);

  useEffect(() => {
    syncAccounts();
  }, []);

  return (
    <div className="flex flex-col w-full flex-grow">
      <div className="flex justify-between mb-5">
        <h1 className="text-2xl">Accounts</h1>
        {accounts.length ? (
          <button className="btn btn-primary text-sm min-h-0 h-auto" onClick={() => openModal('addAccount', {})}>
            <Plus /> Add account
          </button>
        ) : null}
      </div>
      {accounts.length ? (
        <div>
          <ul>
            {accounts.map((account) => (
              <AccountPreview key={account.id} account={account} onClick={onClick} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col flex-grow items-center justify-center">
          <button
            className="btn btn-primary border-primary border-dashed hover:border-primary text-lg p-4 animate-bounce"
            onClick={() => openModal('addAccount', {})}
          >
            <Plus /> Add account
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(Accounts);
