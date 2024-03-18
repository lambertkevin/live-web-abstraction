// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { console2 } from "forge-std/console2.sol";
import { EntryPointSimulations } from "@account-abstraction/core/EntryPointSimulations.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";

import { BroadcasterScript } from "./Broadcaster.s.sol";
import { Paymaster } from "../src/Paymaster/Paymaster.sol";
import { QuiVeutEtreMonNFT } from "../src/NFT/NFT.sol";
import { LedgerAccountFactory } from "../src/Accounts/LedgerAccountFactory.sol";
import { WebauthnVerifier256r1 } from "../src/Webauthn/WebauthnVerifier256r1.sol";

contract DeployAnvil is BroadcasterScript, Test {
  function run() external broadcast returns (address[5] memory) {
    EntryPointSimulations entryPoint = new EntryPointSimulations();
    console2.log("entrypoint", address(entryPoint));

    address namingServiceAddr = 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955;
    address webAuthnAddr = address(new WebauthnVerifier256r1());
    console2.log("webAuthn", webAuthnAddr);

    address factory = address(
      new LedgerAccountFactory(entryPoint, namingServiceAddr, webAuthnAddr)
    );
    console2.log("factory", factory);

    Paymaster paymaster = new Paymaster(
      entryPoint,
      0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f
    );
    console2.log("paymaster", address(paymaster));
    paymaster.deposit{ value: 10 ether }();
    console2.log("paymaster deposit", paymaster.getDeposit());

    QuiVeutEtreMonNFT queVeutEtreMonNFT = new QuiVeutEtreMonNFT(
      0x976EA74026E726554dB657fA54763abd0C3a0aa9
    );
    payable(address(queVeutEtreMonNFT)).transfer(10 ether);
    console2.log("balance", address(queVeutEtreMonNFT).balance);

    return [
      address(entryPoint),
      webAuthnAddr,
      factory,
      address(paymaster),
      address(queVeutEtreMonNFT)
    ];
  }
}
