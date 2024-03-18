import { DateTime } from 'luxon';
import groupBy from 'lodash/groupBy';
import React, { memo, useCallback, useMemo, useState } from 'react';
import type { Account, TokenAccount, OperationType } from '@ledgerhq/types-live';
import { useCurrencyPriceStore } from '../store';
import { iconsList } from './icons';
import classNames from 'classnames';
import { theme } from '../config';
import ChevronUp from './icons/ChevronUp';

type Props = {
  account: Account | TokenAccount;
};

const OperationTypeMap: Partial<Record<OperationType, string>> = {
  IN: 'Received',
  NFT_IN: 'NFT Received',
  OUT: 'Sent',
  NFT_OUT: 'NFT Sent',
  FEES: 'Fees',
};

const OperationTypeIconMap: Partial<Record<OperationType, string>> = {
  IN: 'arrowToBottom',
  NFT_IN: 'arrowToBottom',
  OUT: 'arrowFromBottom',
  NFT_OUT: 'arrowFromBottom',
  FEES: 'coins',
};

const OperationsHistory = ({ account }: Props) => {
  const [numberOfOps, setNumberOfOps] = useState(20);
  const showMoreOps = useCallback(() => {
    setNumberOfOps(numberOfOps + 20);
  }, [numberOfOps]);

  const flattenOperations = useMemo(
    () => account.operations.flatMap((op) => [op, ...(op?.internalOperations || []), ...(op.nftOperations || [])]),
    [account.operations],
  );
  const operationsByDate = useMemo(
    () =>
      Object.entries(
        groupBy(
          flattenOperations.slice(0, numberOfOps).filter(({ type }) => type !== 'NONE'),
          (op) => DateTime.fromJSDate(op.date).toFormat('dd/MM/yyyy'),
        ),
      ),
    [flattenOperations, numberOfOps],
  );
  const { prices } = useCurrencyPriceStore();

  return (
    <div>
      <div className="bg-zinc-900 rounded py-5">
        <div className="text-lg pb-5 px-5 border-b-zinc-700 border-b">Latest operations</div>
        {account.pendingOperations.length ? (
          <>
            <div className="text-sm text-zinc-400 py-3 px-5 bg-zinc-800 border-y border-y-zinc-700">
              Unconfirmed transactions
            </div>
            {account.pendingOperations.map((op, i) => {
              const Icon = iconsList[OperationTypeIconMap[op.type] || ''];
              const isLastOp = i === account.pendingOperations.length - 1;
              const isInOp = ['IN', 'NFT_IN'].includes(op.type);
              const isNFTOp = ['NFT_IN', 'NFT_OUT'].includes(op.type);
              const currency = account.type === 'Account' ? account.currency : account.token;

              return (
                <div
                  key={op.id}
                  className={classNames([
                    'flex flex-row items-center px-4 py-5 justify-stretch animate-pulse bg-zinc-700',
                    !isLastOp ? 'border-b-zinc-700 border-b' : null,
                  ])}
                >
                  <div className="flex flew-row gap-3 items-center w-2/12">
                    <div className="rounded-badge w-7 aspect-square relative overflow-hidden flex justify-center items-center">
                      <div
                        className={classNames([
                          isInOp ? 'bg-lime-800' : 'bg-zinc-700',
                          'absolute h-full w-full -z-0 bg-opacity-40',
                        ])}
                      ></div>
                      <Icon size={16} color={isInOp ? theme.colors.lime['500'] : theme.colors.slate['300']} />
                    </div>
                    <div>
                      <div>{OperationTypeMap[op.type]}</div>
                      <div className="text-sm text-zinc-400">{DateTime.fromJSDate(op.date).toFormat('hh:mm a')}</div>
                    </div>
                  </div>
                  <div className="w-3/12">{op.recipients}</div>
                  <div className="w-4/12"></div>
                  <div className="flex-grow text-right">
                    {!op.value.isZero() && !isNFTOp ? (
                      <>
                        <div className={isInOp ? 'text-lime-500' : ''}>
                          {isInOp ? '+' : '-'}
                          {parseFloat(op.value.dividedBy(10 ** currency.units[0].magnitude).toFixed(8))}{' '}
                          {currency.units[0].code}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {isInOp ? '+' : '-'}$
                          {parseFloat(
                            op.value
                              .dividedBy(10 ** currency.units[0].magnitude)
                              .times(
                                prices[
                                  (currency.type === 'CryptoCurrency'
                                    ? currency.units[0].code
                                    : currency.id
                                  ).toLowerCase()
                                ] || 0,
                              )
                              .toFixed(2),
                          )}
                        </div>
                      </>
                    ) : null}
                    {isNFTOp ? (
                      <>
                        <div className="text-zinc-400">
                          {op.contract?.substring(0, 6) +
                            '...' +
                            op.contract?.substring(op.contract.length - 5, op.contract.length - 1)}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {(op.tokenId?.length || 0) > 10
                            ? op.tokenId?.substring(0, 6) +
                              '...' +
                              op.tokenId?.substring(op.tokenId.length - 5, op.tokenId.length - 1)
                            : op.tokenId}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </>
        ) : null}
        {operationsByDate.map(([date, ops]) => (
          <React.Fragment key={date}>
            <div className="text-sm text-zinc-400 py-3 px-5 bg-zinc-800 border-y border-y-zinc-700">{date}</div>
            {ops.map((op, i) => {
              const Icon = iconsList[OperationTypeIconMap[op.type] || ''];
              const isLastOp = i === ops.length - 1;
              const isInOp = ['IN', 'NFT_IN'].includes(op.type);
              const isNFTOp = ['NFT_IN', 'NFT_OUT'].includes(op.type);
              const currency = account.type === 'Account' ? account.currency : account.token;

              return (
                <div
                  key={op.id}
                  className={classNames([
                    'flex flex-row items-center px-4 py-5 justify-stretch',
                    !isLastOp ? 'border-b-zinc-700 border-b' : null,
                  ])}
                >
                  <div className="flex flew-row gap-3 items-center w-2/12">
                    <div className="rounded-badge w-7 aspect-square relative overflow-hidden flex justify-center items-center">
                      <div
                        className={classNames([
                          isInOp ? 'bg-lime-800' : 'bg-zinc-700',
                          'absolute h-full w-full -z-0 bg-opacity-40',
                        ])}
                      ></div>
                      <Icon size={16} color={isInOp ? theme.colors.lime['500'] : theme.colors.slate['300']} />
                    </div>
                    <div>
                      <div>{OperationTypeMap[op.type]}</div>
                      <div className="text-sm text-zinc-400">{DateTime.fromJSDate(op.date).toFormat('hh:mm a')}</div>
                    </div>
                  </div>
                  <div className="w-3/12">{op.recipients}</div>
                  <div className="w-4/12"></div>
                  <div className="flex-grow text-right">
                    {!op.value.isZero() && !isNFTOp ? (
                      <>
                        <div className={isInOp ? 'text-lime-500' : ''}>
                          {isInOp ? '+' : '-'}
                          {parseFloat(op.value.dividedBy(10 ** currency.units[0].magnitude).toFixed(8))}{' '}
                          {currency.units[0].code}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {isInOp ? '+' : '-'}$
                          {parseFloat(
                            op.value
                              .dividedBy(10 ** currency.units[0].magnitude)
                              .times(
                                prices[
                                  (currency.type === 'CryptoCurrency'
                                    ? currency.units[0].code
                                    : currency.id
                                  ).toLowerCase()
                                ] || 0,
                              )
                              .toFixed(2),
                          )}
                        </div>
                      </>
                    ) : null}
                    {isNFTOp ? (
                      <>
                        <div className="text-zinc-400">
                          {op.contract?.substring(0, 6) +
                            '...' +
                            op.contract?.substring(op.contract.length - 5, op.contract.length - 1)}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {(op.tokenId?.length || 0) > 10
                            ? op.tokenId?.substring(0, 6) +
                              '...' +
                              op.tokenId?.substring(op.tokenId.length - 5, op.tokenId.length - 1)
                            : op.tokenId}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-center items-center">
        <button
          className="flex flex-row my-3 gap-2 text-sm items-center justify-center text-violet-400 flex-grow underline-offset-2 hover:underline"
          onClick={showMoreOps}
        >
          {numberOfOps < account.operations.length ? (
            <>
              <span>Show more</span> <ChevronUp size={12} className={'rotate-180'} />
            </>
          ) : null}
        </button>
      </div>
    </div>
  );
};

export default memo(OperationsHistory);
