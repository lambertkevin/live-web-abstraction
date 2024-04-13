// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { console2 } from "forge-std/console2.sol";
import { EntryPoint } from "@account-abstraction/core/EntryPoint.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";
import { Strings } from "@openzeppelin/utils/Strings.sol";

import { BroadcasterScript } from "./Broadcaster.s.sol";
import { Paymaster } from "../src/Paymaster/Paymaster.sol";
import { QuiVeutEtreMonNFT } from "../src/NFT/NFT.sol";
import { LedgerAccountFactory } from "../src/Accounts/LedgerAccountFactory.sol";
import { WebauthnVerifier256r1 } from "../src/Webauthn/WebauthnVerifier256r1.sol";

contract DeployAnvil is BroadcasterScript, Test {
  function run() external broadcast returns (address[5] memory) {
    EntryPoint entryPoint = new EntryPoint();
    console2.log("entrypoint", address(entryPoint));

    address namingServiceAddr = vm
      .createWallet(vm.envUint(("NAMING_SERVICE_SK")))
      .addr;
    address webAuthnAddr = address(new WebauthnVerifier256r1());
    console2.log("webAuthn", webAuthnAddr);

    address factory = address(
      new LedgerAccountFactory(entryPoint, namingServiceAddr, webAuthnAddr)
    );
    console2.log("factory", factory);

    Paymaster paymaster = new Paymaster(
      entryPoint,
      vm.createWallet(vm.envUint(("PAYMASTER_SK"))).addr
    );
    console2.log("paymaster", address(paymaster));
    paymaster.deposit{ value: 10 ether }();
    console2.log("paymaster deposit", paymaster.getDeposit());

    QuiVeutEtreMonNFT queVeutEtreMonNFT = new QuiVeutEtreMonNFT(
      vm.createWallet(vm.envUint(("NFT_OWNER_SK"))).addr
    );
    payable(address(queVeutEtreMonNFT)).transfer(10 ether);
    console2.log("balance", address(queVeutEtreMonNFT).balance);

    string memory jsonObj = string(
      abi.encodePacked(
        '{ "ENTRYPOINT_CONTRACT": "',
        Strings.toHexString(address(entryPoint)),
        '", "FACTORY_CONTRACT": "',
        Strings.toHexString(factory),
        '", "PAYMASTER_CONTRACT": "',
        Strings.toHexString(address(paymaster)),
        '", "WEBAUTHN_CONTRACT": "',
        Strings.toHexString(address(webAuthnAddr)),
        '", "NFT_CONTRACT": "',
        Strings.toHexString(address(queVeutEtreMonNFT)),
        '" }'
      )
    );
    vm.writeJson(jsonObj, "./config/addresses.json");

    return [
      address(entryPoint),
      webAuthnAddr,
      factory,
      address(paymaster),
      address(queVeutEtreMonNFT)
    ];
  }
}
