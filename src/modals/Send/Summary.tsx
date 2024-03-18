import { memo, useMemo } from 'react';
import type { Account, TokenAccount } from '@ledgerhq/types-live';
import type { CryptoOrTokenCurrency } from '@ledgerhq/types-cryptoassets';
import type { Transaction, TransactionStatus } from '@ledgerhq/coin-evm/lib/types/transaction';
import CurrencyIcon from '../../components/icons/CurrencyIcon';
import { useCurrencyPriceStore } from '../../store';
import BigNumber from 'bignumber.js';

type Props = {
  transaction: Transaction;
  account: Account | TokenAccount;
  currency: CryptoOrTokenCurrency;
  status: TransactionStatus | null | undefined;
  goNextStep: () => void;
};

const SummaryStep = ({ transaction, account, status, goNextStep, currency }: Props) => {
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

  const from = useMemo(() => (account.type === 'Account' ? account.name : account.token.name), [account]);
  const estimatedFees = useMemo(
    () => (status?.estimatedFees || new BigNumber(0)).dividedBy(10 ** currency.units[0].magnitude),
    [currency.units, status?.estimatedFees],
  );
  const totalAmount = useMemo(
    () =>
      transaction.amount.plus(status?.estimatedFees || new BigNumber(0)).dividedBy(10 ** currency.units[0].magnitude),
    [transaction.amount, status?.estimatedFees, currency.units],
  );

  return (
    <>
      <div className="px-14 mb-8">
        <div className="flex flex-col mb-2">
          <div className="label text-zinc-500 pb-0 pl-0">From</div>
          <div className="flex flex-row items-center gap-1.5">
            <div className="rounded-badge w-4 aspect-square relative overflow-hidden flex justify-center items-center">
              <div
                style={{
                  backgroundColor: (currency.type === 'CryptoCurrency' ? currency : currency.parentCurrency).color,
                }}
                className="absolute h-full w-full -z-0 opacity-10"
              ></div>
              <CurrencyIcon currency={currency} color={mainCurrency.color} size={14} />
            </div>
            <span>{from}</span>
          </div>
        </div>
        <div className="flex flex-col mb-4">
          <div className="label text-zinc-500 pb-0 pl-0">To</div>
          <div className="flex flex-row items-center gap-1">{transaction.recipient}</div>
        </div>
        <hr className="mt-3 mb-2 h-[1px] border-none bg-zinc-700" />
        <div className="flex flex-row justify-between items-baseline">
          <div className="label text-zinc-500 pb-0 pl-0">Amount</div>
          <div className="flex flex-col justify-center gap-1 text-right">
            <span>
              {transaction.amount.dividedBy(10 ** currency.units[0].magnitude).toFixed()} {currency.units[0].code}
            </span>
            <span>
              $
              {transaction.amount
                .dividedBy(10 ** currency.units[0].magnitude)
                .times(prices[currencyStoreId])
                .toPrecision(2)}
            </span>
          </div>
        </div>
        <div className="flex flex-row justify-between items-baseline">
          <div className="label text-zinc-500 pb-0 pl-0">Max network fees</div>
          <div className="flex flex-col justify-center gap-1 text-right">
            <span>
              {estimatedFees.toFixed()} {mainCurrency.units[0].code}
            </span>
            <span>${estimatedFees.times(prices[mainCurrencyStoreId]).toPrecision(2)}</span>
          </div>
        </div>
        {account.type === 'Account' && (
          <>
            <hr className="mt-3 mb-2 h-[1px] border-none bg-zinc-700" />
            <div className="flex flex-row justify-between items-baseline">
              <div className="label text-zinc-500 pb-0 pl-0">Total</div>
              <div className="flex flex-col justify-center gap-1 text-right">
                <span>
                  {totalAmount.toFixed()} {currency.units[0].code}
                </span>
                <span>${totalAmount.times(prices[mainCurrencyStoreId]).toPrecision(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
      <hr className="border-zinc-700 my-4" />
      <div className="px-6 flex flew-row justify-end">
        <button className="btn btn-primary" onClick={goNextStep}>
          <span>Continue</span>
        </button>
      </div>
    </>
  );
};

export default memo(SummaryStep);
