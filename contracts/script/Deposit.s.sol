// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { console2 } from "forge-std/console2.sol";
import { BroadcasterScript } from "./Broadcaster.s.sol";
import { Paymaster } from "../src/Paymaster/Paymaster.sol";

contract DeployAnvil is BroadcasterScript, Test {
  function run() external broadcast returns (address[1] memory) {
    Paymaster paymaster = Paymaster(
      payable(0xF72a3d695D7820347d48F4BC278a1F4E903C8F69)
    );
    console2.log("paymaster", address(paymaster));
    paymaster.deposit{ value: 2 ether }();
    console2.log("paymaster deposit", paymaster.getDeposit());
    return [address(paymaster)];
  }
}
