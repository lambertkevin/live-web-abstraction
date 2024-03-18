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
    () =>
      listCryptoCurrencies(true).filter(
        (currency) => currency.family === 'evm' && currency.managerAppName === 'Ethereum',
      ),
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
