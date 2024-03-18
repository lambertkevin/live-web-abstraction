import Joi from 'joi';
import type { Plugin } from '@hapi/hapi';
import type { Prisma } from '@prisma/client';
import { getSignedPayload, createLock } from '../controllers/LockController';
import { CraftSigner, ExcludeOptionalProps } from '../types';

export const LockApi: Plugin<unknown> = {
  name: 'LockApi',
  version: '1.0.0',
  register: (server) => {
    server.route<{ Payload: ExcludeOptionalProps<Prisma.LockCreateInput>; Params: { usernameAndDomain: string } }>({
      method: 'POST',
      path: '/set/{usernameAndDomain}',
      handler: (req) => {
        const [, username, domain = '.ledger.com'] =
          new RegExp(/(.*)\.(.*\.[a-z]{2,})$/g).exec(req.params.usernameAndDomain) || [];

        return createLock({ username, domain });
      },
      options: {
        validate: {
          failAction: async (request, h, err) => {
            console.log({ payload: request.payload });
            // During development, log and respond with the full error.
            console.error(err);
            throw err;
          },
          params: Joi.object({
            usernameAndDomain: Joi.string()
              .regex(/(.*)\.(.*\.[a-z]{2,})$/)
              .required(),
          }),
        },
      },
    });

    server.route<{ Headers: { authorization: string }; Payload: CraftSigner }>({
      method: 'POST',
      path: '/sign',
      handler: (req) => {
        const { headers, payload } = req;

        const jwt = headers.authorization.replace('Bearer', '').trim();
        return getSignedPayload(jwt, payload);
      },
      options: {
        validate: {
          failAction: async (request, h, err) => {
            console.log({ payload: request.payload });
            // During development, log and respond with the full error.
            console.error(err);
            throw err;
          },
          headers: Joi.object({
            Authorization: Joi.string(),
          }).options({ allowUnknown: true }),
          payload: Joi.alternatives().try(
            Joi.object({
              type: Joi.string().equal('EOA').required(),
              address: Joi.string()
                .regex(/^0x[0-9a-fA-F]{40}$/)
                .required(),
            }),
            Joi.object({
              type: Joi.string().equal('WEBAUTHN').required(),
              credId: Joi.string()
                .regex(/^0x[0-9a-fA-F]*$/)
                .required(),
              pubKey: Joi.array()
                .items(Joi.string().regex(/^0x[0-9a-fA-F]*$/))
                .length(2)
                .required(),
            }),
          ),
        },
      },
    });
  },
};

export default LockApi;
