import type Transport from '@ledgerhq/hw-transport';
import type { Account } from '@ledgerhq/types-live';
import type { BigNumberish, BytesLike } from 'ethers';

export type Signer = {
  username?: string;
  domain?: string;
} & (
  | {
      type: 'ledger-usb';
      mode: 'EOA';
      transport?: Transport;
      address?: string;
    }
  | {
      type: 'ledger-ble';
      mode: 'EOA';
      transport?: Transport;
      address?: string;
    }
  | {
      type: 'webauthn';
      mode: 'Webauthn';
      credId?: string;
      credIdHash?: string;
      pubKey?: string[];
    }
);

export type AccountWithSigners = Account & {
  signers?: Signer[];
};

export type PackedUserOperation = {
  sender: string;
  nonce: BigNumberish;
  initCode: BytesLike;
  callData: BytesLike;
  accountGasLimits: BytesLike;
  preVerificationGas: BigNumberish;
  gasFees: BytesLike;
  paymasterAndData: BytesLike;
  signature: BytesLike;
};
export interface UserOperation {
  sender: string;
  nonce: BigNumberish;
  factory?: string;
  factoryData?: BytesLike;
  callData: BytesLike;
  callGasLimit: BigNumberish;
  verificationGasLimit: BigNumberish;
  preVerificationGas: BigNumberish;
  maxFeePerGas: BigNumberish;
  maxPriorityFeePerGas: BigNumberish;
  paymaster?: string;
  paymasterVerificationGasLimit?: BigNumberish;
  paymasterPostOpGasLimit?: BigNumberish;
  paymasterData?: BytesLike;
  signature: BytesLike;
}
