import type { Account, AccountLike } from '@ledgerhq/types-live';
import { getMainAccount } from '@ledgerhq/coin-framework/lib/account/helpers';
import type { TransactionStatus } from '@ledgerhq/coin-evm/lib/types/transaction';
import type { CommonDeviceTransactionField } from '@ledgerhq/coin-framework/transaction/common';
import { EvmAbstractionTransaction } from './types';
import { accountInterface } from '../../contracts';
import { Signer } from '../../types';
import axios from 'axios';

type DeviceTransactionField = CommonDeviceTransactionField;

/**
 * Method responsible for creating the summary of the screens visible on the nano
 */
const getDeviceTransactionConfig = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike & { signers?: Signer[] };
  parentAccount: (Account & { signers?: Signer[] }) | null | undefined;
  transaction: EvmAbstractionTransaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const fields: Array<DeviceTransactionField> = [];

  const { func } = transaction.callData
    ? accountInterface.decodeFunctionData('execute', transaction.callData)
    : { func: undefined };

  const method = await axios
    .get<{
      results: { text_signature: string }[];
    }>(`https://www.4byte.directory/api/v1/signatures/?format=json&hex_signature=${func}`)
    .then(({ data }) => data.results[0]?.text_signature);

  switch (transaction.mode) {
    default:
    case 'send':
      fields.push(
        {
          type: 'text',
          label: 'data',
          value: method || 'Present',
        },
        {
          type: 'amount',
          label: 'Amount',
        },
        {
          type: 'text',
          label: 'Address',
          value: transaction.recipient,
        },
        {
          type: 'amount',
          label: 'Amount',
        },
      );
      break;
  }

  fields.push(
    {
      type: 'text',
      label: 'Network',
      value: mainAccount.currency.name,
    },
    {
      type: 'fees',
      label: transaction.paymaster && transaction.paymasterData ? 'Sponsored fees' : 'Max fees',
    },
  );

  return fields;
};

export default getDeviceTransactionConfig;
