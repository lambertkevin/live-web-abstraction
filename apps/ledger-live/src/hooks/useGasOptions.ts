import { getGasTracker } from '@ledgerhq/coin-evm/lib/api/gasTracker/index';
import type { GasOptions, Transaction as EvmTransaction } from '@ledgerhq/coin-evm/types/index';
import { EvmAbstractionTransaction } from '../libraries/coin-evm-abstraction/types';
import type { CryptoCurrency } from '@ledgerhq/types-cryptoassets';
import { useEffect, useMemo, useState } from 'react';

/**
 * React hook to get gas options for a given currency
 * Used in the send flow to get the gas options for the currency,
 * for example in SelectFeeStrategy.tsx file in the renderer/families/{currency} folder in LLD
 */
export const useGasOptions = ({
  currency,
  transaction,
  // interval is the time in milliseconds between each call to the gas tracker
  interval = 60 * 1000,
}: {
  currency: CryptoCurrency;
  transaction: EvmTransaction | EvmAbstractionTransaction;
  interval?: number;
}): [GasOptions | undefined, Error | null, boolean] => {
  const shouldUseEip1559 = transaction.family === 'evm-abstraction' || transaction.type === 2;
  const gasTracker = useMemo(() => getGasTracker(currency), [currency]);
  const [error, setError] = useState<Error | null>(null);
  const [gasOptions, setGasOptions] = useState<GasOptions | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gasTracker) {
      setLoading(false);
      return;
    }

    const getGasOptionsCallback = async () =>
      gasTracker
        .getGasOptions({ currency, options: { useEIP1559: shouldUseEip1559 } })
        .then(setGasOptions)
        .catch(setError)
        .finally(() => setLoading(false));

    getGasOptionsCallback();
    if (interval > 0) {
      const intervalId = setInterval(() => getGasOptionsCallback(), interval);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [gasTracker, interval, currency, shouldUseEip1559]);

  return [gasOptions, error, loading];
};
