import { ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';
import type { AccountBridge, TokenAccount } from '@ledgerhq/types-live';
import { SignatureCurveType, SignatureDryRun, SignatureMessageType, getSignatureType } from '../../helpers';
import { transactionToUserOperation } from './adapters/userOperation';
import { validateRecipient } from './getTransactionStatus';
import type { EvmAbstractionTransaction } from './types';
import accountAbi from '../../abis/Account.abi.json';
import { factoryContract } from '../../contracts';
import erc20Abi from '../../abis/ERC20.abi.json';
import { Signer } from '../../types';
import nodeApi from './api/nodeApi';

const accountInterface = new ethers.utils.Interface(accountAbi);
const erc20Interface = new ethers.utils.Interface(erc20Abi);

const dryRunSignatureBySigner: Record<EvmAbstractionTransaction['signer']['type'], Buffer> = {
  'ledger-usb': Buffer.from(
    '89745fdb8f84e30b5e984103bf95520045ae48baf5531f882f81c238af048d0380118d7deef4ad33fa624ff273d0f5954cc20649cc819e58b75905b479cab9600d1c',
    'hex',
  ),
  'ledger-ble': Buffer.from(
    '89745fdb8f84e30b5e984103bf95520045ae48baf5531f882f81c238af048d0380118d7deef4ad33fa624ff273d0f5954cc20649cc819e58b75905b479cab9600d1c',
    'hex',
  ),
  webauthn: Buffer.from(
    '804500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001e05eeb467d2e01a93c278665262fcec5d8fd9181052a81f6f94bfdd01aaf037fcf00000000000000000000000000000000000000000000000000000000000000270efbec632baf85ff5228c8c2bbe849cd01a35a96fd7ece0888f5b70d871df17401e6d9b85bf7cbe2267a8cb2a347f5901fc59788dafcc6a06350e40c730af2d6f4a19843f202d80062b74cf76360f2b78a4ec203640632fb1f048064d1a0a78000000000000000000000000000000000000000000000000000000000000000a449960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97634500000000adce000235bcc60a648b0b25f1f0550300203150fed76d9f9e802162236fd45540f7765b22d9702ff17a4584a9368cfcd88ca501020326200121582057959ef891d217cdddedcc776880298057c933067bb4730e7508f6606d1018dc225820864b17cc21b46029f589e9a7a69c44987231211c9a9882df241d9279a4d5e9150000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000897b2274797065223a22776562617574686e2e637265617465222c226368616c6c656e6765223a2258757447665334427154776e686d556d4c383746325032526751557167666235535f335147713844663838222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a31323334222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000000000000000',
    'hex',
  ),
};

const craftAddSignerPayload = (signer: Signer) => {
  if (signer.type === 'webauthn') {
    if (!signer.credIdHash || !signer.pubKey || !signer.pubKey[0] || !signer.pubKey[1])
      throw new Error("Couldn't create initCode for Webauthn");

    const firstByte = getSignatureType(
      SignatureDryRun.OFF,
      SignatureMessageType.WEBAUTHN,
      SignatureCurveType.P256_R1_VERIFY,
    );

    return Buffer.concat([
      Buffer.from(firstByte.toString(16).padStart(2, '0'), 'hex'),
      Buffer.from(
        ethers.utils.defaultAbiCoder
          .encode(['bytes32', 'uint256', 'uint256'], [signer.credIdHash, signer.pubKey[0], signer.pubKey[1]])
          .slice(2),
        'hex',
      ),
    ]);
  } else {
    if (!signer.address) throw new Error("Couldn't create initCode for EOA");
    const firstByte = getSignatureType(
      SignatureDryRun.OFF,
      SignatureMessageType.EIP191,
      SignatureCurveType.P256_K1_ECRECOVER,
    );

    return Buffer.concat([
      Buffer.from(firstByte.toString(16).padStart(2, '0'), 'hex'),
      Buffer.from(signer.address.slice(2), 'hex'),
    ]);
  }
};

export const prepareTransaction: AccountBridge<EvmAbstractionTransaction>['prepareTransaction'] = async (
  account,
  transaction,
) => {
  const nonce = await nodeApi.getNonce(account.freshAddress);
  const tokenAccount = transaction.subAccountId
    ? account.subAccounts?.find(
        (subAccount): subAccount is TokenAccount =>
          subAccount.type === 'TokenAccount' && subAccount.id === transaction.subAccountId,
      )
    : null;
  const feeData = await nodeApi.getFeeData();
  const { username, domain } = transaction.signer || {};
  const hasCode = await nodeApi.hasCode(account.freshAddress);
  const shouldDeployAccount = !hasCode && username && domain;
  // const [, username, domain] = new RegExp(/(.*)\.(.*\.[a-z]{2,})$/g).exec(account.seedIdentifier) || [];

  const initCode = shouldDeployAccount
    ? {
        factory: import.meta.env.VITE_WALLETFACTORY_CONTRACT,
        factoryData: Buffer.from(
          factoryContract.interface
            .encodeFunctionData('createAccount', [username, domain, 0, craftAddSignerPayload(transaction.signer)])
            .slice(2),
          'hex',
        ),
      }
    : {};

  const callData = validateRecipient(account, transaction)
    ? Buffer.from(
        accountInterface
          .encodeFunctionData(
            'execute',
            tokenAccount
              ? [
                  tokenAccount.token.contractAddress,
                  0,
                  erc20Interface.encodeFunctionData('transfer', [
                    transaction.recipient,
                    transaction.useAllAmount ? tokenAccount.balance.toString() : transaction.amount.toString(),
                  ]),
                ]
              : [transaction.recipient, transaction.amount.toString(), '0x'],
          )
          .slice(2),
        'hex',
      )
    : Buffer.alloc(0);

  const draftTransaction: EvmAbstractionTransaction = {
    ...transaction,
    ...initCode,
    nonce,
    callData,
    maxPriorityFeePerGas: new BigNumber(feeData.maxPriorityFeePerGas!.toHexString()),
    maxFeePerGas: new BigNumber(feeData.maxFeePerGas!.toHexString()),
  };

  const userOp = transactionToUserOperation(account, draftTransaction);
  const { callGasLimit, preVerificationGas, verificationGasLimit } = await nodeApi
    .getGasEstimation({ ...userOp, signature: dryRunSignatureBySigner[draftTransaction.signer?.type] })
    .catch((e) => {
      console.log(e);
      return {
        callGasLimit: new BigNumber(0),
        preVerificationGas: new BigNumber(0),
        verificationGasLimit: new BigNumber(0),
      };
    });

  console.log({
    callGasLimit: callGasLimit.toFixed(),
    preVerificationGas: preVerificationGas.toFixed(),
    verificationGasLimit: verificationGasLimit.toFixed(),
  });

  return {
    ...draftTransaction,
    callGasLimit,
    preVerificationGas,
    verificationGasLimit,
  };
};