import isEqual from 'lodash/isEqual';
import type { AccountBridge } from '@ledgerhq/types-live';
import type { EvmAbstractionTransaction } from './types';

export const updateTransaction: AccountBridge<EvmAbstractionTransaction>['updateTransaction'] = (t, patch) => {
  const patched = { ...t, ...patch };
  return isEqual(t, patched) ? t : patched;
};
