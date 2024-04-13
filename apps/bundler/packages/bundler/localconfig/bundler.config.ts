// @ts-expect-error accessible via docker volume
// eslint-disable-next-line import/no-unresolved
import addresses from "../contracts-config/addresses";

export default {
  gasFactor: "1",
  port: process.env.BUNDLER_PORT,
  network: process.env.RPC_DEBUG || process.env.RPC,
  unsafe: Boolean(process.env.BUNDLER_UNSAFE),
  entryPoint: addresses.ENTRYPOINT_CONTRACT,
  privateKey: process.env.BUNDLER_SK,
  beneficiary: process.env.BUNDLER_BENEFICIARY,
  minBalance: process.env.BUNDLER_MIN_BALANCE,
  maxBundleGas: 5e6,
  minStake: process.env.BUNDLER_MIN_STAKE,
  minUnstakeDelay: 0,
  autoBundleInterval: 3,
  autoBundleMempoolSize: 10
};
