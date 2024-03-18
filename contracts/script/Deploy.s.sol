// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { console2 } from "forge-std/console2.sol";
import { EntryPointSimulations } from "@account-abstraction/core/EntryPointSimulations.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";

import { BroadcasterScript } from "./Broadcaster.s.sol";
import { LedgerAccountFactory } from "../src/Accounts/LedgerAccountFactory.sol";
import { WebauthnVerifier256r1 } from "../src/Webauthn/WebauthnVerifier256r1.sol";

contract DeployAnvil is BroadcasterScript, Test {
  function run() external broadcast returns (address[3] memory) {
    EntryPointSimulations entryPoint = new EntryPointSimulations();
    console2.log("entrypoint", address(entryPoint));

    address webAuthnAddr = address(new WebauthnVerifier256r1());
    console2.log("webAuthn", webAuthnAddr);

    address factory = address(
      new LedgerAccountFactory(entryPoint, webAuthnAddr)
    );
    console2.log("factory", factory);

    return [address(entryPoint), webAuthnAddr, factory];
  }
}
