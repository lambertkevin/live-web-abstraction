export type RawEthersTransaction = {
  to: string | undefined;
  from: string | undefined;
  nonce: number;
  gasLimit: string;
  gasPrice: string | undefined;
  maxPriorityFeePerGas: string | undefined;
  maxFeePerGas: string | undefined;
  data: string;
  value: string;
  chainId: number;
};
