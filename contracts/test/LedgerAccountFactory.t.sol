// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Vm } from "forge-std/Vm.sol";
import { Test } from "forge-std/Test.sol";
import { LedgerAccount } from "../src/Accounts/LedgerAccount.sol";
import { IEntryPoint } from "@account-abstraction/interfaces/IEntryPoint.sol";
import { LedgerAccountFactory } from "../src/Accounts/LedgerAccountFactory.sol";

contract LedgerAccountFactoryTest is Test {
  event LedgerAccountSignerAdded();

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
    uint256 salt,
    string calldata walletLabel
  ) public {
    vm.assume(
      keccak256(abi.encodePacked(username)) !=
        keccak256(abi.encodePacked(domain))
    );

    Vm.Wallet memory wallet = vm.createWallet(walletLabel);
    bytes memory signerPayload = abi.encodePacked(bytes1(0x09), wallet.addr);

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
      salt,
      signerPayload
    );

    assertTrue(getAddressResult == address(deploymentResult));
  }

  function test_Should_Create_Account_With_EOA_Signer(
    string calldata username,
    string calldata domain,
    uint256 salt,
    string calldata walletLabel
  ) public {
    Vm.Wallet memory wallet = vm.createWallet(walletLabel);
    bytes memory signerPayload = abi.encodePacked(bytes1(0x09), wallet.addr);

    vm.expectEmit();
    emit LedgerAccountSignerAdded();

    factory.createAccount(username, domain, salt, signerPayload);
  }

  function test_Should_Create_Account_With_Webauthn_Signer(
    string calldata username,
    string calldata domain,
    uint256 salt
  ) public {
    bytes memory signerElements = abi.encode(
      bytes32(
        0xf4a19843f202d80062b74cf76360f2b78a4ec203640632fb1f048064d1a0a780
      ),
      uint256(
        0x57959ef891d217cdddedcc776880298057c933067bb4730e7508f6606d1018dc
      ),
      uint256(
        0x864b17cc21b46029f589e9a7a69c44987231211c9a9882df241d9279a4d5e915
      )
    );
    bytes memory signerPayload = abi.encodePacked(bytes1(0x00), signerElements);

    vm.expectEmit();
    emit LedgerAccountSignerAdded();

    factory.createAccount(username, domain, salt, signerPayload);
  }
}
