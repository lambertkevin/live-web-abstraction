export type TraceTransaction = {
  action: {
    from: `0x${string}`;
    to?: `0x${string}`;
    gas: `0x${string}`;
    init: `0x${string}`;
    value: `0x${string}`;
    input?: `0x${string}`;
    callType?: string;
  };
  blockHash: `0x${string}`;
  blockNumber: number;
  result: {
    address: `0x${string}`;
    code: `0x${string}`;
    gasUsed: `0x${string}`;
  };
  subtraces: number;
  traceAddress: unknown[];
  transactionHash: `0x${string}`;
  transactionPosition: number;
  type: string;
};
