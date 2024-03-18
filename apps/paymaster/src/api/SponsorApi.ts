import Joi from 'joi';
import type { Plugin } from '@hapi/hapi';
import SponsorController from '../controllers/SponsorController';
import { UserOperation } from '../types';

export const SponsorApi: Plugin<unknown> = {
  name: 'SponsorApi',
  version: '1.0.0',
  register: (server) => {
    server.route<{ Payload: UserOperation }>({
      method: 'POST',
      path: '/sponsor',
      handler: (request) => SponsorController.sponsorUserOperation(request.payload),
      options: {
        validate: {
          failAction: async (request, h, err) => {
            console.log({ payload: request.payload });
            // During development, log and respond with the full error.
            console.error(err);
            throw err;
          },
          payload: Joi.object({
            sender: Joi.string()
              .regex(/^0x[0-9a-fA-F]{40}$/)
              .required(),
            nonce: Joi.string()
              .regex(/^(0x)?[0-9a-fA-F]{1,64}$/)
              .required(),
            factory: Joi.string()
              .regex(/^0x[0-9a-fA-F]{40}$/)
              .optional(),
            factoryData: Joi.string()
              .regex(/^0x[0-9a-fA-F]*$/)
              .optional(),
            callData: Joi.string()
              .regex(/^0x([0-9a-fA-F]{8,})?$/)
              .required(),
            callGasLimit: Joi.string()
              .regex(/^(0x)?[0-9a-fA-F]{1,64}$/)
              .required(),
            verificationGasLimit: Joi.string()
              .regex(/^(0x)?[0-9a-fA-F]{1,64}$/)
              .required(),
            preVerificationGas: Joi.string()
              .regex(/^(0x)?[0-9a-fA-F]{1,64}$/)
              .required(),
            maxFeePerGas: Joi.string()
              .regex(/^(0x)?[0-9a-fA-F]{1,64}$/)
              .required(),
            maxPriorityFeePerGas: Joi.string()
              .regex(/^(0x)?[0-9a-fA-F]{1,64}$/)
              .required(),
            signature: Joi.string()
              .regex(/^0x[0-9a-fA-F]*$/)
              .required(),
          }).options({ stripUnknown: true }),
        },
      },
    });

    server.route({
      method: 'GET',
      path: '/test',
      handler: () => 'ok',
    });
  },
};

export default SponsorApi;
