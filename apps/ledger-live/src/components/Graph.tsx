import max from 'lodash/max';
import min from 'lodash/min';
import uniq from 'lodash/uniq';
import { DateTime } from 'luxon';
import { memo, useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import { ResponsiveLine } from '@nivo/line';
import type { Operation, TokenAccount } from '@ledgerhq/types-live';
import type { AccountWithSigners } from '../types';
import { useCurrencyPriceStore } from '../store';
import { theme } from '../config';

type Props = {
  account: AccountWithSigners | TokenAccount;
};

const Graph = ({ account }: Props) => {
  const { prices } = useCurrencyPriceStore();
  const { operations } = account;
  const unit = useMemo(() => (account.type === 'TokenAccount' ? account.token.units[0] : account.unit), [account]);
  const currency = useMemo(
    () => (account.type === 'TokenAccount' ? account.token.parentCurrency : account.currency),
    [account],
  );

  const balanceHistory = useMemo(
    () =>
      operations
        ? operations
            .toReversed()
            .filter((op) => op.type !== 'NONE' || (op.type === 'NONE' && op?.internalOperations?.length))
            .flatMap((op) => [op, ...(op?.internalOperations || [])])
            .reduce((prev, curr) => {
              const previousBalance = Array.from(prev)?.[prev.size - 1]?.[1] || new BigNumber(0);

              if (curr.type === 'IN') {
                return prev.set(curr, previousBalance.plus(curr.value));
              } else {
                return prev.set(curr, BigNumber.maximum(previousBalance.minus(curr.value), 0));
              }
            }, new Map<Operation, BigNumber>())
        : new Map<Operation, BigNumber>(),
    [operations],
  );
  const data = useMemo<{ x: Date; y: number; tooltip: React.JSX.Element }[]>(
    () =>
      Array.from(balanceHistory).map(([{ date }, value]) => {
        const d = DateTime.fromJSDate(date);
        const b = value.dividedBy(10 ** unit.magnitude);

        return {
          x: date,
          y: b.toNumber(),
          tooltip: (
            <div className="p-3 border border-zinc-600 bg-zinc-900 rounded text-center">
              <div className="text-lg">
                {b.toFixed(8)} {unit.code}
              </div>
              <div className="text-zinc-400">${b.times(prices[unit.code.toLowerCase()] || 0).toFixed(2)}</div>
              <div className="text-zinc-400 pt-4">{d.toFormat('dd/mm/yyyy')}</div>
              <div className="text-zinc-400">{d.toFormat('HH:mm')}</div>
            </div>
          ),
        };
      }),
    [unit, balanceHistory, prices],
  );
  const yValues = useMemo(() => {
    const values = Array.from(new Set((data || []).map(({ y }) => parseFloat(y.toFixed(1)))));
    const maxValue = max(values) || 0;
    const minValue = min(values) || 0;
    const gap = (maxValue - minValue) / 3;

    return uniq(new Array(3).fill(null).map((_, i) => (maxValue - gap * i).toFixed(1)));
  }, [data]);

  return (
    <div className="bg-zinc-900 rounded py-8 px-8">
      <div className="text-4xl">
        {parseFloat(account.balance.dividedBy(10 ** unit.magnitude).toFixed(8))} {unit.code}
      </div>
      <div className="text-xl flex flex-row gap-5">
        <div className="text-zinc-400">
          $
          {account.balance
            .dividedBy(10 ** unit.magnitude)
            .times(prices[unit.code.toLowerCase()] || 0)
            .toFixed(2)}
        </div>
        <div className="text-nowrap">
          1 {unit.code} = ${(prices[unit.code.toLowerCase()] || 0)?.toFixed?.(2)}
        </div>
      </div>
      <div className="w-full h-[200px] pt-6">
        {yValues.length > 1 && (
          <ResponsiveLine
            data={[
              {
                id: account.id,
                color: currency.color,
                data,
              },
            ]}
            colors={(d) => d.color}
            defs={[
              {
                colors: [
                  {
                    color: 'inherit',
                    offset: 60,
                  },
                  {
                    color: 'inherit',
                    offset: 100,
                    opacity: 0.1,
                  },
                ],
                id: 'gradientA',
                type: 'linearGradient',
              },
            ]}
            fill={[
              {
                id: 'gradientA',
                match: '*',
              },
            ]}
            margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            tooltip={({ point }) => {
              // @ts-expect-error fuck it
              return point.data.tooltip;
            }}
            xScale={{ type: 'time' }}
            yScale={{
              type: 'linear',
              nice: true,
            }}
            curve="basis"
            axisBottom={{
              tickSize: 0,
              tickPadding: 20,
              format: (date) => DateTime.fromJSDate(date).toLocaleString({ day: '2-digit', month: 'short' }),
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 10,
              tickValues: yValues,
            }}
            gridYValues={yValues}
            enableGridX={false}
            theme={{
              axis: {
                ticks: {
                  text: {
                    fill: theme.colors.zinc['500'],
                  },
                },
              },
              grid: {
                line: {
                  stroke: theme.colors.zinc['600'],
                  strokeWidth: '1',
                  strokeDasharray: '5 6',
                },
              },
            }}
            pointSize={0}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={0}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={0}
            enableArea={true}
            enableCrosshair={false}
            useMesh={true}
            legends={[]}
          />
        )}
      </div>
    </div>
  );
};

export default memo(Graph);
