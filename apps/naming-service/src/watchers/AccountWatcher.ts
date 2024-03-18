import { ethers } from 'ethers';
import { addSignerToAccount, createAccount } from '../controllers/AccountController';
import WebauthnSignerLibAbi from '../abis/Webauthn256r1SignerLib.abi.json';
import EOASignerLibAbi from '../abis/EOASignerLib.abi.json';
import accountAbi from '../abis/Account.abi.json';
import { provider } from '../config';

const accountInterface = new ethers.utils.Interface(accountAbi);
const EOASignerInterface = new ethers.utils.Interface(EOASignerLibAbi);
const webauthnSignerInterface = new ethers.utils.Interface(WebauthnSignerLibAbi);

const ACCOUNT_EVENTS = {
  LedgerAccountInitialized: 'LedgerAccountInitialized',
  LedgerAccountSignerAdded: 'LedgerAccountSignerAdded',
};

const SIGNER_EVENTS = {
  EOASignerAdded: 'EOASignerAdded',
  WebauthnSignerAdded: 'WebauthnSignerAdded',
};

const MAX_BLOCK_RANGE = 1024;

const AccountInitializedTopic = accountInterface.getEventTopic(ACCOUNT_EVENTS.LedgerAccountInitialized);
const EOASignerAddedTopic = EOASignerInterface.getEventTopic(SIGNER_EVENTS.EOASignerAdded);
const WebauthnSignerAddedTopic = webauthnSignerInterface.getEventTopic(SIGNER_EVENTS.WebauthnSignerAdded);

export const startAccountWatcher = async () => {
  let initialBlock = parseInt(process.env.NAMING_SERVICE_START_INDEXING_BLOCK!, 10);

  const getLogs = async () => {
    try {
      console.log('ACCOUNTS: LOOKING FROM BLOCK', initialBlock);

      const logs = await provider
        .getLogs({
          fromBlock: initialBlock,
          toBlock: initialBlock + MAX_BLOCK_RANGE,
          topics: [[AccountInitializedTopic, EOASignerAddedTopic, WebauthnSignerAddedTopic]],
        })
        .then((logs) =>
          logs.sort((a) => {
            return a.topics[0] === AccountInitializedTopic ? -1 : 1;
          }),
        );

      if (logs.length) {
        for (const log of logs) {
          switch (log.topics[0]) {
            case AccountInitializedTopic: {
              const logDescription = accountInterface.parseLog(log);
              await createAccount({
                address: log.address,
                username: logDescription.args.username,
                domain: logDescription.args.domain,
              })
                .then((res) => (res ? console.log('ACCOUNT CREATED') : console.log('ACCOUNT ALREADY ADDED')))
                .catch((e) => console.log('ERROR CREATING ACCOUNT', e, log));
              break;
            }

            case EOASignerAddedTopic: {
              const logDescription = EOASignerInterface.parseLog(log);
              await addSignerToAccount(log.address, 'EOA', logDescription.args.addr)
                .then((res) => (res ? console.log('EOA SIGNER ADDED') : console.log('EOA SIGNER ALREADY ADDED')))
                .catch((e) => console.log('ERROR ADDING EOA SIGNER', e, log));
              break;
            }

            case WebauthnSignerAddedTopic: {
              const logDescription = webauthnSignerInterface.parseLog(log);
              await addSignerToAccount(log.address, 'WEBAUTHN', logDescription.args.credIdHash)
                .then((res) =>
                  res ? console.log('WEBAUTHN SIGNER ADDED') : console.log('WEBAUTHN SIGNER ALREADY ADDED'),
                )
                .catch((e) => console.log('ERROR ADDING WEBAUTHN SIGNER', e, log));
              break;
            }

            default: {
              console.log('EVENT IGNORED', log);
            }
          }
        }
      }
      const currentBlock = await provider.getBlockNumber();
      initialBlock = Math.min(initialBlock + MAX_BLOCK_RANGE, currentBlock);
    } catch (e) {
      console.log('ACCOUNTS: AN ERROR HAS OCCURED DURING INDEXING', e);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      getLogs();
    }
  };

  getLogs();
};

export default startAccountWatcher;
