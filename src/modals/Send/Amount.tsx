import classNames from 'classnames';
import BigNumber from 'bignumber.js';
import { getEstimatedFees } from '@ledgerhq/coin-evm/lib/logic';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { getTypedTransaction } from '@ledgerhq/coin-evm/lib/transaction';
import type { CryptoOrTokenCurrency } from '@ledgerhq/types-cryptoassets';
import type { Transaction, TransactionStatus } from '@ledgerhq/coin-evm/lib/types/transaction';
import CurrencyIcon from '../../components/icons/CurrencyIcon';
import SpeedMedium from '../../components/icons/SpeedMedium';
import { useGasOptions } from '../../hooks/useGasOptions';
import SpeedSlow from '../../components/icons/SpeedSlow';
import SpeedFast from '../../components/icons/SpeedFast';
import Exchange from '../../components/icons/Exchange';
import { useCurrencyPriceStore } from '../../store';
import { theme } from '../../config';

type Props = {
  transaction: Transaction;
  currency: CryptoOrTokenCurrency;
  status: TransactionStatus | null | undefined;
  updateTransaction: (transaction: Partial<Transaction>) => void;
  isPending: boolean;
  goNextStep: () => void;
};

const SpeedComponent = {
  slow: SpeedSlow,
  medium: SpeedMedium,
  fast: SpeedFast,
};

const AmountStep = ({ currency, isPending, status, goNextStep, updateTransaction, transaction }: Props) => {
  const { prices } = useCurrencyPriceStore();
  const mainCurrency = useMemo(
    () => (currency.type === 'CryptoCurrency' ? currency : currency.parentCurrency),
    [currency],
  );
  const currencyStoreId = useMemo(
    () => (currency.type === 'CryptoCurrency' ? currency.units[0].code : currency.id).toLowerCase(),
    [currency.id, currency.type, currency.units],
  );
  const mainCurrencyStoreId = useMemo(() => mainCurrency.units[0].code.toLowerCase(), [mainCurrency.units]);

  const [amount, setAmount] = useState<string | undefined>();
  const [value, setValue] = useState<string | undefined>();
  const [useMax, setUseMax] = useState(false);

  const setSanitizedAmount = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) {
        setAmount(undefined);
        setValue(undefined);
        return;
      }

      const sanitizedAmount = new BigNumber(e.target.value);
      if (!sanitizedAmount.isNaN()) {
        setAmount(e.target.value);
        setValue(sanitizedAmount.times(prices[currencyStoreId]).toFixed());
      }
    },
    [currencyStoreId, prices],
  );
  const setSanitizedValue = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) {
        setValue(undefined);
        setAmount(undefined);
        return;
      }
      const sanitizedValue = new BigNumber(e.target.value);
      if (!sanitizedValue.isNaN()) {
        setValue(e.target.value);
        setAmount(sanitizedValue.dividedBy(prices[currencyStoreId]).toFixed());
      }
    },
    [currencyStoreId, prices],
  );
  const toggleUseMax = useCallback(() => {
    setUseMax(!useMax);
  }, [useMax]);

  useEffect(() => {
    updateTransaction(
      useMax
        ? { useAllAmount: true }
        : {
            amount: new BigNumber(amount || 0).times(10 ** currency.units[0].magnitude),
            useAllAmount: false,
          },
    );
  }, [amount, useMax, currency.units, updateTransaction]);

  const [gasOptionsValues, gasError, gasPending] = useGasOptions({
    currency: currency.type === 'TokenCurrency' ? currency.parentCurrency : currency,
    transaction,
  });
  const gasOptions = useMemo(() => {
    if (gasPending || gasError || !gasOptionsValues) return [];

    return Object.entries(gasOptionsValues).map(([strategyName, option]) => {
      const estimatedValue = getEstimatedFees(getTypedTransaction(transaction, option)).dividedBy(
        10 ** mainCurrency.units[0].magnitude,
      );
      const estimatedCost = estimatedValue.multipliedBy(prices[mainCurrencyStoreId]);

      return {
        Icon: SpeedComponent[strategyName as keyof typeof SpeedComponent],
        strategyName: strategyName as Transaction['feesStrategy'],
        estimatedValue,
        estimatedCost,
      };
    });
  }, [gasError, gasOptionsValues, gasPending, mainCurrency.units, mainCurrencyStoreId, prices, transaction]);

  useEffect(() => {
    if (!transaction?.feesStrategy && gasOptionsValues) {
      updateTransaction({ feesStrategy: 'medium', gasOptions: gasOptionsValues });
    }
  }, [gasOptionsValues, transaction, updateTransaction]);

  const [selectedStrategy, setSelectedStrategy] = useState<Transaction['feesStrategy']>('medium');
  const onSelectStrategy = useCallback(
    (strategyName: Transaction['feesStrategy']) => {
      setSelectedStrategy(strategyName);
      updateTransaction({ feesStrategy: strategyName });
    },
    [updateTransaction],
  );

  const { errors, estimatedFees } = status || {};
  console.log({ errors, transaction });
  return (
    <>
      <div className="px-6">
        <div className="flex flex-row justify-between items-center w-5/12 mb-1">
          <div className="text-zinc-400">Amount</div>
          <div className="flex flex-row justify-end">
            <label className="label text-xs text-zinc-500 p-0">
              Send Max
              <input
                type="checkbox"
                className="ml-2 toggle h-[13px] w-6 [--handleoffset:0.5rem] [--tglbg:#52525b] hover:bg-zinc-900 checked:[--tglbg:#c4b5fd] bg-zinc-900 border-none"
                checked={useMax}
                onChange={toggleUseMax}
              />
            </label>
          </div>
        </div>
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row w-5/12 relative">
            <input
              type="text"
              className={classNames([
                'input w-full focus:outline-none pr-14 disabled:bg-zinc-950 ',
                !isPending && amount && errors?.amount
                  ? 'border-error focus:border-error disabled:border-error'
                  : 'border-zinc-700 focus:border-primary disabled:border-zinc-700',
              ])}
              placeholder="0"
              value={useMax ? transaction.amount.dividedBy(10 ** currency.units[0].magnitude).toFixed() : amount || ''}
              onChange={setSanitizedAmount}
              disabled={useMax}
            />
            <span className="absolute right-3 top-[50%] translate-y-[-50%] text-zinc-400">{currency.ticker}</span>
          </div>
          <div className="flex flex-row justify-center items-center">
            <Exchange size={24} color={theme.colors.zinc['500']} className="translate-x-[25%]" />
          </div>
          <div className="flex flex-row w-5/12 relative">
            <input
              type="text"
              className="input w-full border-zinc-700 disabled:border-zinc-700 disabled:bg-zinc-950 focus:outline-none focus:border-primary pr-12"
              placeholder="0"
              value={
                useMax
                  ? transaction.amount
                      .dividedBy(10 ** currency.units[0].magnitude)
                      .times(prices[currencyStoreId])
                      .toFixed()
                  : value || ''
              }
              onChange={setSanitizedValue}
              disabled={useMax}
            />
            <span className="absolute right-3 top-[50%] translate-y-[-50%] text-zinc-400">$</span>
          </div>
        </div>
        <div className="flex flex-row justify-between items-center w-5/12 mt-8 mb-1">
          <div className="text-zinc-400">Fees</div>
        </div>
        <div className="flex flex-row justify-between gap-3">
          {gasPending ? (
            <>
              {new Array(3).fill(null).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-center items-center border border-zinc-700 w-1/3 h-[95px] p-4 rounded animate-pulse"
                >
                  <span className="loading loading-ring loading-lg"></span>
                </div>
              ))}
            </>
          ) : (
            gasOptions.map((gasOption) => (
              <div
                key={gasOption.strategyName}
                className={classNames([
                  'text-center border p-4 rounded hover:cursor-pointer w-1/3',
                  gasOption.strategyName === selectedStrategy ? 'border-primary' : 'border-zinc-700',
                ])}
                onClick={() => onSelectStrategy(gasOption.strategyName)}
              >
                <div
                  className={classNames([
                    'uppercase text-xs text-zinc-400 mb-2 flex flex-row justify-center gap-1.5',
                    gasOption.strategyName === selectedStrategy ? 'text-primary' : 'text-inherit',
                  ])}
                >
                  <gasOption.Icon size={12} />
                  {gasOption.strategyName}
                </div>
                <div
                  className={classNames([
                    'text-sm mb-1',
                    gasOption.strategyName === selectedStrategy ? 'text-primary' : 'text-inherit',
                  ])}
                >
                  {gasOption.estimatedValue.toFixed(5)} {mainCurrency.units[0].code}
                </div>
                <div className="text-zinc-400">$ {gasOption.estimatedCost.toPrecision(2)}</div>
              </div>
            ))
          )}
        </div>
      </div>
      <hr className="border-zinc-700 my-4" />
      <div className="flex px-6 justify-between items-center">
        <div className="flex flex-row items-center gap-x-2">
          <div className="rounded-badge w-10 aspect-square relative overflow-hidden flex justify-center items-center">
            <div
              style={{
                backgroundColor: (currency.type === 'CryptoCurrency' ? currency : currency.parentCurrency).color,
              }}
              className="absolute h-full w-full -z-0 opacity-10"
            ></div>
            <CurrencyIcon
              currency={currency.type === 'CryptoCurrency' ? currency : currency.parentCurrency}
              color={currency.type === 'CryptoCurrency' ? currency.color : currency.parentCurrency.color}
              size={22}
            />
          </div>
          <div>
            <div className="text-zinc-400 text-sm mb-0">Max network fees</div>
            <div className="text-lg mb-0">
              {(estimatedFees || new BigNumber(0)).dividedBy(10 ** currency.units[0].magnitude).toFixed(8)}{' '}
              {mainCurrency.units[0].code}
            </div>
            <div className="text-sm text-zinc-400 mb-0">
              $
              {(estimatedFees || new BigNumber(0))
                .dividedBy(10 ** mainCurrency.units[0].magnitude)
                .times(prices[mainCurrencyStoreId])
                .toPrecision(2)}
            </div>
          </div>
        </div>
        <button
          className="btn btn-primary"
          disabled={isPending || !!Object.values(errors || {}).length}
          onClick={goNextStep}
        >
          <span className={isPending ? 'opacity-0' : ''}>Continue</span>
          {isPending ? <span className="loading loading-spinner loading-md absolute"></span> : null}
        </button>
      </div>
    </>
  );
};

export default memo(AmountStep);
