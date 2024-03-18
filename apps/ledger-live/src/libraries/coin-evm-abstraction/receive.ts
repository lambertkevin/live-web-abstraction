import type { AccountBridge } from '@ledgerhq/types-live';
import { EvmAbstractionTransaction } from './types';
import { Observable } from 'rxjs';
import { factoryContract } from '../../contracts';

export const receive: AccountBridge<EvmAbstractionTransaction>['receive'] = (account) =>
  new Observable((o) => {
    const [, username, domain] = new RegExp(/(.*)\.(.*\.[a-z]{2,})$/g).exec(account.seedIdentifier) || [];

    (async () => {
      const address = await factoryContract.getAddress(username, domain, 0);

      o.next({
        address,
        path: '',
      });
      o.complete();
    })();
  });
