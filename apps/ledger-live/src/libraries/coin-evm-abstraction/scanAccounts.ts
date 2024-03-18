import { Observable } from 'rxjs';
import { BigNumber } from 'bignumber.js';
import type { Observer } from '@ledgerhq/hw-transport';
import type { CurrencyBridge, ScanAccountEvent } from '@ledgerhq/types-live';
import { getAccountShape } from '@ledgerhq/coin-evm/lib/synchronization';
import type { AccountWithSigners, Signer } from '../../types';
import { factoryContract } from '../../contracts';

export const buildScanAccounts: (signer: Signer) => CurrencyBridge['scanAccounts'] =
  (signer: Signer) =>
  ({ currency }): Observable<ScanAccountEvent> =>
    new Observable((o: Observer<{ type: 'discovered'; account: AccountWithSigners }>) => {
      let finished = false;

      const unsubscribe = () => {
        finished = true;
      };

      if (finished) return;

      try {
        (async () => {
          if (finished) return;
          const address = await factoryContract.getAddress(signer.username!, signer.domain!, 0);
          const accountShape = await getAccountShape(
            {
              currency,
              index: 0,
              address,
              derivationPath: '',
              derivationMode: '',
              deviceId: `${signer.username}.${signer.domain}`,
            },
            { paginationConfig: {} },
          );
          const initialAccount: AccountWithSigners = {
            type: 'Account',
            id: '',
            seedIdentifier: `${signer.username}.${signer.domain}`,
            freshAddress: address,
            freshAddressPath: '',
            freshAddresses: [
              {
                address: address,
                derivationPath: '',
              },
            ],
            derivationMode: '',
            name: '',
            starred: false,
            used: false,
            index: 0,
            currency,
            operationsCount: 0,
            operations: [],
            swapHistory: [],
            pendingOperations: [],
            unit: currency.units[0],
            lastSyncDate: new Date(),
            creationDate: new Date(),
            balance: new BigNumber(0),
            spendableBalance: new BigNumber(0),
            blockHeight: 0,
            balanceHistoryCache: {
              HOUR: {
                latestDate: null,
                balances: [],
              },
              DAY: {
                latestDate: null,
                balances: [],
              },
              WEEK: {
                latestDate: null,
                balances: [],
              },
            },
            signers: [signer],
          };
          const account = { ...initialAccount, ...accountShape, name: `${signer.username}.${signer.domain}` };
          console.log({ account });
          o.next({
            type: 'discovered',
            account,
          });
          o.complete();
        })();
      } catch (e) {
        o.error(e);
        o.complete();
      }

      return unsubscribe;
    });
