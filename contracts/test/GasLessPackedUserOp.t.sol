// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";
import { GasLessPackedUserOperationLib, GasLessPackedUserOperation } from "../src/Libraries/GasLessPackedUserOperation.sol";

contract GasLessPackedUserOpTest is Test {
  using GasLessPackedUserOperationLib for GasLessPackedUserOperation;

  function test_Should_Convert_PackedUserOp_To_GasLessUserOp(
    PackedUserOperation memory packedUserOp
  ) public {
    GasLessPackedUserOperation
      memory gasLessUserOpManual = GasLessPackedUserOperation({
        sender: packedUserOp.sender,
        nonce: packedUserOp.nonce,
        initCodeHash: keccak256(packedUserOp.initCode),
        callDataHash: keccak256(packedUserOp.callData),
        gasFees: packedUserOp.gasFees
      });

    assertEq(
      gasLessUserOpManual.hash(),
      GasLessPackedUserOperationLib.fromUserOp(packedUserOp).hash()
    );
  }

  function test_Should_Pack_PackedUserOp_Correctly(
    PackedUserOperation memory packedUserOp
  ) public {
    GasLessPackedUserOperation
      memory gasLessUserOpManual = GasLessPackedUserOperationLib.fromUserOp(
        packedUserOp
      );

    assertEq(
      gasLessUserOpManual.pack(),
      abi.encode(
        gasLessUserOpManual.sender,
        gasLessUserOpManual.nonce,
        gasLessUserOpManual.initCodeHash,
        gasLessUserOpManual.callDataHash,
        gasLessUserOpManual.gasFees
      )
    );
  }
}
