import { ethers } from 'ethers';
import { ETHAddressNonEIP, InvalidAddress, RecipientRequired } from '@ledgerhq/errors';
import type { EvmAbstractionTransaction } from './types';
import type { AccountWithSigners } from '../../types';
import type { AccountBridge } from '@ledgerhq/types-live';
import { getEstimatedFees } from './logic';

type ValidatedTransactionFields =
  | 'recipient'
  | 'gasLimit'
  | 'gasPrice'
  | 'amount'
  | 'maxPriorityFee'
  | 'maxFee'
  | 'feeTooHigh';
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

// This regex will not work with Starknet since addresses are 65 caracters long after the 0x
const ethAddressRegEx = /^(0x)?[0-9a-fA-F]{40}$/;

export const validateRecipient = (
  account: AccountWithSigners,
  tx: EvmAbstractionTransaction,
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  if (tx.recipient) {
    // Check if recipient is matching the format of a valid eth address or not
    const isRecipientMatchingEthFormat = tx.recipient.match(ethAddressRegEx);

    if (!isRecipientMatchingEthFormat) {
      errors.recipient = new InvalidAddress('', {
        currencyName: account.currency.name,
      });
    } else {
      // Check if address is respecting EIP-55
      try {
        const recipientChecksumed = ethers.utils.getAddress(tx.recipient);
        if (tx.recipient !== recipientChecksumed) {
          // this case can happen if the user is entering an ICAP address.
          throw new Error();
        }
      } catch (e) {
        // either getAddress throws for a bad checksum or we throw manually if the recipient isn't the same.
        warnings.recipient = new ETHAddressNonEIP(); // "Auto-verification not available: carefully verify the address"
      }
    }
  } else {
    errors.recipient = new RecipientRequired(); // ""
  }

  return [errors, warnings];
};

export const getTransactionStatus: AccountBridge<EvmAbstractionTransaction>['getTransactionStatus'] = async (
  account,
  transaction,
) => {
  const estimatedFees = getEstimatedFees(transaction);

  const [recipientErrors, recipientWarnings] = validateRecipient(account, transaction);

  const errors = {
    ...recipientErrors,
  };
  const warnings = {
    ...recipientWarnings,
  };

  return {
    amount: transaction.amount,
    errors,
    warnings,
    totalSpent: transaction.amount.plus(estimatedFees),
    estimatedFees,
  };
};
