import eip55 from 'eip55';
import BlueBirdPromise from 'bluebird';
import { utils, providers, ethers } from 'ethers';
import type {
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanInternalTransaction,
  EtherscanOperation,
} from '@ledgerhq/coin-evm/lib/types/index';
import ERC20ABI from '../abis/ERC20.abi.json';
import ERC721ABI from '../abis/ERC721.abi.json';
import { TraceTransaction } from '../types';

const MAX_BLOCK_RANGE = 1024;

const provider = new providers.StaticJsonRpcProvider(process.env.RPC);
const ERC20Interface = new utils.Interface(ERC20ABI);
const ERC721Interface = new utils.Interface(ERC721ABI);

const TRANSFER_EVENTS_TOPICS = {
  ERC20: ERC20Interface.getEventTopic('Transfer'),
  ERC721: ERC721Interface.getEventTopic('Transfer'),
};

export const safeEncodeEIP55 = (addr: string): string => {
  if (!addr || addr === '0x' || addr === '0x0') {
    return '';
  }

  try {
    return eip55.encode(addr);
  } catch (e) {
    console.error(e);
    return addr;
  }
};

export const explorerOperationByAddress: Record<string, Map<string, EtherscanOperation[]> | null> = {};
export const explorerERC20EventsByAddress: Record<string, Map<string, EtherscanERC20Event[]> | null> = {};
export const explorerERC721EventsByAddress: Record<string, Map<string, EtherscanERC721Event[]> | null> = {};
export const explorerInternalByAddress: Record<string, Map<string, EtherscanInternalTransaction[]> | null> = {};

export const clearExplorerAppendix = () => {
  for (const address in explorerOperationByAddress) {
    delete explorerOperationByAddress[address];
  }
  for (const address in explorerERC20EventsByAddress) {
    delete explorerERC20EventsByAddress[address];
  }
  for (const address in explorerERC721EventsByAddress) {
    delete explorerERC721EventsByAddress[address];
  }
};

const logPromise = async (log: providers.Log) => {
  const contractDecimals = provider
    .call({ to: log.address, data: ERC20Interface.encodeFunctionData('decimals') })
    .then((res) => (!res || res === '0x' ? false : true));

  const isERC20 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC20 && contractDecimals;
  const isERC721 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC721 && !contractDecimals;

  if (isERC20) {
    const [name, ticker, decimals, block, tx, receipt] = await Promise.all([
      provider.call({ to: log.address, data: ERC20Interface.encodeFunctionData('name') }),
      provider.call({ to: log.address, data: ERC20Interface.encodeFunctionData('symbol') }),
      provider.call({ to: log.address, data: ERC20Interface.encodeFunctionData('decimals') }),
      provider.getBlock(log.blockHash),
      provider.getTransaction(log.transactionHash),
      provider.getTransactionReceipt(log.transactionHash),
    ]);

    const from = safeEncodeEIP55(ethers.utils.defaultAbiCoder.decode(['address'], log.topics[1])[0]);
    const to = safeEncodeEIP55(ethers.utils.defaultAbiCoder.decode(['address'], log.topics[2])[0]);

    const erc20Event: EtherscanERC20Event = {
      blockNumber: block.toString(),
      timeStamp: block.timestamp.toString(),
      hash: log.transactionHash,
      nonce: tx.nonce.toString(),
      blockHash: block.hash,
      from,
      to,
      value: tx.value.toBigInt().toString(),
      tokenName: name,
      tokenSymbol: ticker,
      tokenDecimal: decimals,
      transactionIndex: block.transactions.indexOf(log.transactionHash).toString(),
      gas: tx.gasLimit.toString(),
      gasPrice: tx.gasPrice?.toString() || '',
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      gasUsed: receipt?.gasUsed?.toString() || '0',
      input: tx.data,
      confirmations: tx.confirmations.toString(),
      contractAddress: tx.to!,
    };

    if (!explorerERC20EventsByAddress[from]) {
      explorerERC20EventsByAddress[from] = new Map<string, EtherscanERC20Event[]>();
    }
    explorerERC20EventsByAddress[from]!.set(erc20Event.hash, [
      ...(explorerERC20EventsByAddress[from]!.get(erc20Event.hash) || []),
      erc20Event,
    ]);

    if (tx.to) {
      if (!explorerERC20EventsByAddress[to]) {
        explorerERC20EventsByAddress[to] = new Map<string, EtherscanERC20Event[]>();
      }
      explorerERC20EventsByAddress[to]!.set(erc20Event.hash, [
        ...(explorerERC20EventsByAddress[to]!.get(erc20Event.hash) || []),
        erc20Event,
      ]);
    }
  } else if (isERC721) {
    const [name, symbol, block, tx, receipt] = await Promise.all([
      provider.call({ to: log.address, data: ERC20Interface.encodeFunctionData('name') }),
      provider.call({ to: log.address, data: ERC20Interface.encodeFunctionData('symbol') }),
      provider.getBlock(log.blockHash),
      provider.getTransaction(log.transactionHash),
      provider.getTransactionReceipt(log.transactionHash),
    ]);

    const from = safeEncodeEIP55(ethers.utils.defaultAbiCoder.decode(['address'], log.topics[2])[0]);
    const to = safeEncodeEIP55(ethers.utils.defaultAbiCoder.decode(['address'], log.topics[3])[0]);
    const tokenID = ethers.utils.defaultAbiCoder.decode(['uint256'], log.topics[4])[0];

    const erc721Event: EtherscanERC721Event = {
      blockNumber: block.number.toString(),
      timeStamp: block.timestamp.toString(),
      hash: tx.hash,
      nonce: tx.nonce.toString(),
      blockHash: block.hash,
      from,
      to,
      transactionIndex: block.transactions.indexOf(log.transactionHash).toString(),
      gas: tx.gasLimit.toString(),
      gasPrice: tx.gasPrice?.toString() || '',
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      gasUsed: receipt?.gasUsed?.toString() || '0',
      input: tx.data,
      confirmations: tx.confirmations.toString(),
      contractAddress: tx.to!,
      tokenID,
      tokenName: name,
      tokenSymbol: symbol,
      tokenDecimal: '0',
    };

    if (!explorerERC721EventsByAddress[from]) {
      explorerERC721EventsByAddress[from] = new Map<string, EtherscanERC721Event[]>();
    }
    explorerERC721EventsByAddress[from]!.set(erc721Event.hash, [
      ...(explorerERC721EventsByAddress[from]!.get(erc721Event.hash) || []),
      erc721Event,
    ]);

    if (tx.to) {
      if (!explorerERC721EventsByAddress[to]) {
        explorerERC721EventsByAddress[to] = new Map<string, EtherscanERC721Event[]>();
      }
      explorerERC721EventsByAddress[to]!.set(erc721Event.hash, [
        ...(explorerERC721EventsByAddress[to]!.get(erc721Event.hash) || []),
        erc721Event,
      ]);
    }
  }
};

const blockPromise = async (blockNumber: number) => {
  const block = await provider.getBlockWithTransactions(blockNumber);
  console.log('BLOCK', blockNumber);

  for (const transaction of block?.transactions || []) {
    console.log({ transactionHash: transaction.hash });
    const [receipt, traces] = await Promise.all([
      provider.getTransactionReceipt(transaction.hash),
      provider.send('trace_transaction', [transaction.hash]) as Promise<TraceTransaction[]>,
    ]);

    const code = transaction.to ? await provider.getCode(transaction.to) : false;
    const from = safeEncodeEIP55(transaction.from);
    const to = safeEncodeEIP55(transaction.to || '');
    const operation: EtherscanOperation = {
      blockNumber: block.number.toString(),
      timeStamp: block.timestamp.toString(),
      hash: transaction.hash,
      nonce: transaction.nonce.toString(),
      blockHash: block.hash,
      transactionIndex: block.transactions.indexOf(transaction).toString(),
      from,
      to,
      value: transaction.value.toBigInt().toString(),
      gas: transaction.gasLimit.toString(),
      gasPrice: transaction.gasPrice?.toString() || '',
      isError: receipt.status === 1 ? '0' : '1',
      txreceipt_status: receipt.status!.toString(),
      input: transaction.data,
      contractAddress: code === '0x' ? '' : transaction.to!,
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      gasUsed: receipt?.gasUsed?.toString() || '0',
      confirmations: transaction.confirmations.toString(),
      methodId: transaction.data?.length > 10 ? transaction.data.slice(0, 10) : '',
      functionName: '',
    };

    if (!explorerOperationByAddress[from]) {
      explorerOperationByAddress[from] = new Map<string, EtherscanOperation[]>();
    }
    explorerOperationByAddress[from]!.set(operation.hash, [
      ...(explorerOperationByAddress[from]!.get(operation.hash) || []),
      operation,
    ]);

    if (operation.to) {
      if (!explorerOperationByAddress[to]) {
        explorerOperationByAddress[to] = new Map<string, EtherscanOperation[]>();
      }
      explorerOperationByAddress[to]!.set(operation.hash, [
        ...(explorerOperationByAddress[to]!.get(operation.hash) || []),
        operation,
      ]);
    }

    for (const { action, result, type, transactionHash, transactionPosition } of traces.filter(
      (trace) => trace.type === 'call',
    )) {
      if (action?.callType !== 'call') continue;
      const code = action.to ? await provider.getCode(action.to) : false;
      const from = safeEncodeEIP55(action.from || '');
      const to = safeEncodeEIP55(action.to || '');
      const internalTransaction: EtherscanInternalTransaction = {
        blockNumber: blockNumber.toString(),
        timeStamp: block.timestamp.toString(),
        hash: transactionHash,
        from,
        to,
        value: ethers.BigNumber.from(action.value).toBigInt().toString(),
        contractAddress: code === '0x' ? '' : action.to!,
        input: action.input || '0x',
        type,
        gas: ethers.BigNumber.from(action.gas).toBigInt().toString(),
        gasUsed: ethers.BigNumber.from(result?.gasUsed || '0')
          .toBigInt()
          .toString(),
        traceId: transactionPosition.toString(),
        isError: receipt.status === 1 ? '0' : '1',
        errCode: '',
      };

      if (!explorerInternalByAddress[from]) {
        explorerInternalByAddress[from] = new Map<string, EtherscanInternalTransaction[]>();
      }
      explorerInternalByAddress[from]!.set(internalTransaction.hash, [
        ...(explorerInternalByAddress[from]!.get(internalTransaction.hash) || []),
        internalTransaction,
      ]);

      if (internalTransaction.to) {
        if (!explorerInternalByAddress[to]) {
          explorerInternalByAddress[to] = new Map();
        }
        explorerInternalByAddress[to]!.set(internalTransaction.hash, [
          ...(explorerInternalByAddress[to]!.get(internalTransaction.hash) || []),
          internalTransaction,
        ]);
      }
    }
  }
};

let fromBlock = 0;
export const indexBlocks = async () => {
  const startIndexing = async () => {
    let latestBlockNumber = await provider.getBlockNumber();
    const toBlock = Math.min(fromBlock + MAX_BLOCK_RANGE, latestBlockNumber);
    console.log({ fromBlock, toBlock });
    const blocks = Array(toBlock - fromBlock)
      .fill('')
      .map((_, index) => fromBlock + index)
      .sort((a, b) => a - b);

    const logs = await provider.getLogs({
      fromBlock,
      toBlock,
      topics: [[TRANSFER_EVENTS_TOPICS.ERC20, TRANSFER_EVENTS_TOPICS.ERC721]],
    });

    await BlueBirdPromise.map(
      logs,
      async (log) => Promise.all([logPromise(log), new Promise((resolve) => setTimeout(resolve, 500))]),
      { concurrency: 10 },
    );
    await BlueBirdPromise.map(
      blocks,
      async (blockNumber) =>
        Promise.all([blockPromise(blockNumber), new Promise((resolve) => setTimeout(resolve, 500))]),
      { concurrency: 10 },
    );

    latestBlockNumber = await provider.getBlockNumber();
    fromBlock = Math.max(Math.min(toBlock - 80, latestBlockNumber), 0);
    console.log({ endBlock: toBlock });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    startIndexing();
  };
  await startIndexing();
};
