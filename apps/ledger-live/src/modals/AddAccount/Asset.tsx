import { memo, useCallback, useMemo } from 'react';
import Select from '../../components/Select';
import type { CryptoCurrency } from '@ledgerhq/types-cryptoassets';
import { listCryptoCurrencies } from '@ledgerhq/cryptoassets/lib/currencies';
import CurrencyIcon from '../../components/icons/CurrencyIcon';

type Props = {
  setSelectedCurrency: (selectedCurrency: CryptoCurrency | undefined) => void;
  selectedCurrency: CryptoCurrency | undefined;
  goNextStep: () => void;
};

const AssetStep = ({ selectedCurrency, setSelectedCurrency, goNextStep }: Props) => {
  const allCurrencies = useMemo(
    () => [
      {
        type: 'CryptoCurrency',
        id: 'anvil' as any,
        name: 'Anvil',
        // the ticker name in exchanges / countervalue apis (e.g. BTC).
        ticker: 'ETH',
        // all units of a currency (e.g. Bitcoin have bitcoin, mBTC, bit, satoshi)
        // by convention, [0] is the default and have "highest" magnitude
        units: [
          {
            name: 'ETH',
            code: 'ETH',
            magnitude: 18,
          },
        ],
        managerAppName: 'Ethereum',
        coinType: 60,
        scheme: 'anvil',
        color: '#00FF00',
        family: 'evm-abstraction',
        ethereumLikeInfo: {
          chainId: 31337,
          node: {
            type: 'external',
            uri: 'http://localhost:8545',
          },
          explorer: {
            type: 'etherscan',
            uri: 'http://localhost:43371',
          },
        },
        explorerViews: [{}],
      },
      ...listCryptoCurrencies(true).filter(
        (currency) => currency.family === 'evm' && Object.keys(currency?.ethereumLikeInfo || {}).length,
      ),
    ],
    [],
  );

  const onCurrencyChange = useCallback(({ value }: { value: CryptoCurrency | undefined }) => {
    setSelectedCurrency(value);
  }, []);

  const options = useMemo(
    () =>
      allCurrencies.map((currency) => ({
        label: (
          <div key={currency.id} className="flex flex-row items-center gap-3 my-2">
            <div className="rounded-badge w-10 aspect-square relative overflow-hidden flex justify-center items-center">
              <div
                style={{
                  backgroundColor: currency.color,
                }}
                className="absolute h-full w-full -z-0 opacity-10"
              ></div>
              <CurrencyIcon currency={currency} size={24} color={currency.color} />
            </div>
            <div>
              {currency.name} ({currency.units[0].code})
            </div>
          </div>
        ),
        value: currency,
      })),
    [allCurrencies],
  );
  return (
    <>
      <div className="px-6">
        <Select
          placeholder="Choose a crypto asset"
          options={options}
          onChange={onCurrencyChange}
          filterOption={(candidate, input) => {
            if (input) {
              return (candidate.value as unknown as CryptoCurrency).name.toLowerCase().includes(input.toLowerCase());
            }
            return true;
          }}
        />
      </div>
      <hr className="border-zinc-700 my-4 mt-10" />
      <div className="flex px-6 justify-end items-center">
        <button className="btn btn-primary" disabled={!selectedCurrency} onClick={goNextStep}>
          <span>Continue</span>
        </button>
      </div>
    </>
  );
};

export default memo(AssetStep);
