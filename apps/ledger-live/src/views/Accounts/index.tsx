import { memo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPreview from '../../components/AccountPreview';
import { useAccountsStore, useModalStore } from '../../store';
import Plus from '../../components/icons/Plus';
import CoolButton from '../../components/CoolButton';

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
          <div className="flex flew-row gap-2">
            <button className="btn btn-primary text-sm min-h-0 h-auto" onClick={() => openModal('AddAccount', {})}>
              <Plus /> Add account
            </button>
            <CoolButton className="flex text-sm flex-row gap-3" onClick={() => openModal('AddSmartAccount', {})}>
              <Plus /> <span className="text-nowrap">Add Smart Account</span>
            </CoolButton>
          </div>
        ) : null}
      </div>
      {accounts.length ? (
        <div>
          {accounts.map((account) => (
            <AccountPreview key={account.id} account={account} onClick={onClick} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col flex-grow items-center justify-center">
          <div className="flex flex-row gap-4">
            <button className="btn btn-primary text-lg p-4" onClick={() => openModal('AddAccount', {})}>
              <Plus /> Add account
            </button>
            <CoolButton className="text-lg p-4 flex flex-row gap-3" onClick={() => openModal('AddSmartAccount', {})}>
              <Plus /> <span className="text-nowrap">Add Smart Account</span>
            </CoolButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(Accounts);
