// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Vm } from "forge-std/Vm.sol";
import { Test } from "forge-std/Test.sol";
import { LedgerAccount } from "../src/Accounts/LedgerAccount.sol";
import { IEntryPoint } from "@account-abstraction/interfaces/IEntryPoint.sol";
import { LedgerAccountFactory } from "../src/Accounts/LedgerAccountFactory.sol";

contract LedgerAccountFactoryTest is Test {
  event LedgerAccountInitialized(
    IEntryPoint entryPoint,
    address indexed factoryAddr,
    string username,
    string domain
  );

  LedgerAccountFactory factory;
  function setUp() public {
    IEntryPoint entrypoint = IEntryPoint(address(0xdead));
    address webauthVerifier = address(1);
    factory = new LedgerAccountFactory(entrypoint, webauthVerifier);
  }

  function test_Should_Return_Same_Address_Than_Deployment(
    string calldata username,
    string calldata domain,
    uint256 salt
  ) public {
    vm.assume(
      keccak256(abi.encodePacked(username)) !=
        keccak256(abi.encodePacked(domain))
    );

    vm.expectEmit();
    emit LedgerAccountInitialized(
      IEntryPoint(address(0xdead)),
      address(factory),
      username,
      domain
    );

    address getAddressResult = factory.getAddress(username, domain, salt);
    LedgerAccount deploymentResult = factory.createAccount(
      username,
      domain,
      salt
    );

    assertTrue(getAddressResult == address(deploymentResult));
  }
}
