import { memo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPreview from '../../components/AccountPreview';
import Plus from '../../components/icons/Plus';
import { useAccountsStore } from '../../store';

const Portfolio = () => {
  const accountsStore = useAccountsStore();
  const navigate = useNavigate();

  const onClick = useCallback((accountId: string) => navigate(`/accounts/${accountId}`), [navigate]);

  useEffect(() => {
    accountsStore.syncAccounts();
  }, []);

  return (
    <div>
      <div className="flex justify-between mb-5">
        <h1 className=" text-2xl">Accounts</h1>
        <button className="btn btn-primary text-sm min-h-0 h-auto">
          <Plus /> Add account
        </button>
      </div>
      <div className="">
        <ul>
          {accountsStore.accounts.map((account) => (
            <AccountPreview key={account.id} account={account} onClick={onClick} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default memo(Portfolio);
