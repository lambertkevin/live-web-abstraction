// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";

struct GasLessPackedUserOperation {
  address sender;
  uint256 nonce;
  bytes32 initCodeHash;
  bytes32 callDataHash;
  bytes32 gasFees;
}

library GasLessPackedUserOperationLib {
  function getSender(
    GasLessPackedUserOperation memory userOp
  ) internal pure returns (address) {
    address data;
    //read sender from userOp, which is first userOp member (saves 800 gas...)
    assembly {
      data := calldataload(userOp)
    }
    return address(uint160(data));
  }

  function pack(
    GasLessPackedUserOperation memory gasLessUserOp
  ) internal pure returns (bytes memory packed) {
    return
      abi.encode(
        gasLessUserOp.sender,
        gasLessUserOp.nonce,
        gasLessUserOp.initCodeHash,
        gasLessUserOp.callDataHash,
        gasLessUserOp.gasFees
      );
  }

  function hash(
    GasLessPackedUserOperation memory gasLessUserOp
  ) internal pure returns (bytes32) {
    return keccak256(pack(gasLessUserOp));
  }

  function fromUserOp(
    PackedUserOperation memory packedUserOp
  ) internal pure returns (GasLessPackedUserOperation memory) {
    return
      GasLessPackedUserOperation({
        sender: packedUserOp.sender,
        nonce: packedUserOp.nonce,
        initCodeHash: keccak256(packedUserOp.initCode),
        callDataHash: keccak256(packedUserOp.callData),
        gasFees: packedUserOp.gasFees
      });
  }
}
