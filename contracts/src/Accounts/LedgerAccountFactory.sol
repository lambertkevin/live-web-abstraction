// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { LedgerAccount } from "./LedgerAccount.sol";
import { Create2 } from "@openzeppelin/utils/Create2.sol";
import { ERC1967Proxy } from "@openzeppelin/proxy/ERC1967/ERC1967Proxy.sol";
import { IEntryPoint } from "@account-abstraction/interfaces/IEntryPoint.sol";

/**
 * A sample factory contract for WebAuthnAccount
 * A UserOperations "initCode" holds the address of the factory, and a method call (to createAccount, in this sample
 * factory).
 * The factory's createAccount returns the target account address even if it is already installed.
 * This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.
 */
contract LedgerAccountFactory {
  LedgerAccount public immutable accountImplementation;

  constructor(IEntryPoint _entryPoint, address webAuthnVerifier) {
    accountImplementation = new LedgerAccount(
      _entryPoint,
      webAuthnVerifier,
      address(this)
    );
  }

  /**
   * create an account, and return its address.
   * returns the address even if the account is already deployed.
   * Note that during UserOperation execution, this method is called only if the account is not deployed.
   * This method returns an existing account address so that entryPoint.getSenderAddress() would work even after
   * account creation
   */
  function createAccount(
    string calldata username,
    string calldata domain,
    uint256 salt
  ) public returns (LedgerAccount) {
    address addr = getAddress(username, domain, salt);
    uint256 codeSize = addr.code.length;
    if (codeSize > 0) {
      return LedgerAccount(payable(addr));
    }
    LedgerAccount acc = LedgerAccount(
      payable(
        new ERC1967Proxy{ salt: bytes32(salt) }(
          address(accountImplementation),
          abi.encodeCall(LedgerAccount.initialize, (username, domain))
        )
      )
    );

    return acc;
  }

  /**
   * calculate the counterfactual address of this account as it would be returned by createAccount()
   */
  function getAddress(
    string calldata username,
    string calldata domain,
    uint256 salt
  ) public view returns (address) {
    return
      Create2.computeAddress(
        bytes32(salt),
        keccak256(
          abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(
              address(accountImplementation),
              abi.encodeCall(LedgerAccount.initialize, (username, domain))
            )
          )
        )
      );
  }
}
