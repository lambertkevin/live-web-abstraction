import type { Plugin } from '@hapi/hapi';
import { findAccountByUsername } from '../controllers/AccountController';
import { notFound } from '@hapi/boom';
import { prisma } from '../config';

export const AccountApi: Plugin<unknown> = {
  name: 'AccountApi',
  version: '1.0.0',
  register: (server) => {
    server.route({
      method: 'GET',
      path: '/{usernameAndDomain}',
      handler: async (req) => {
        const [, username, domain = '.ledger.com'] =
          new RegExp(/(.*)\.(.*\.[a-z]{2,})$/g).exec(req.params.usernameAndDomain) || [];
        const account = await findAccountByUsername(username, domain);
        if (!account) throw notFound();

        return Promise.all(
          account?.signers.map(async (signer) => {
            if (signer.type === 'EOA') {
              return signer.id;
            } else {
              const credential = await prisma.credentialId.findUnique({
                where: {
                  hash: signer.id,
                },
              });
              return credential ? credential.value : null;
            }
          }),
        ).then((res) => res.filter(Boolean));
      },
    });
  },
};

export default AccountApi;
