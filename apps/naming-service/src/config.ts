import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

export const nodeConfig = {
  port: process.env.NAMING_SERVICE_PORT || 4340,
  debug: { request: ['error'] },
  routes: {
    cors: true,
  },
};

export const provider = new ethers.providers.StaticJsonRpcProvider(process.env.RPC);

export const prisma = new PrismaClient();

export const LOCK_DURATION_IN_MS = 60 * 60 * 1000; // 60 mins

export const NS_SK = fs.readFileSync(path.join(path.resolve('.'), '.keys', 'ns.sk'), 'utf-8');
export const NS_PK = fs.readFileSync(path.join(path.resolve('.'), '.keys', 'ns.pk'), 'utf-8');
export const nsSigner = new ethers.Wallet(process.env.NAMING_SERVICE_SK!);
