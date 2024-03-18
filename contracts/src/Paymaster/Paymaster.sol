// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { ECDSA } from "@openzeppelin/utils/cryptography/ECDSA.sol";
import { BasePaymaster } from "@account-abstraction/core/BasePaymaster.sol";
import { _packValidationData } from "@account-abstraction/core/Helpers.sol";
import { IEntryPoint } from "@account-abstraction/interfaces/IEntryPoint.sol";
import { MessageHashUtils } from "@openzeppelin/utils/cryptography/MessageHashUtils.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";
import { GasLessPackedUserOperation, GasLessPackedUserOperationLib } from "../Libraries/GasLessPackedUserOperation.sol";

struct PaymasterAndData {
  address paymasterAddress;
  bytes32 gasLessPackedUserOperationHash;
  uint48 validAfter;
  uint48 validUntil;
  uint256 chainId;
  bytes signature;
}

contract Paymaster is BasePaymaster {
  using GasLessPackedUserOperationLib for GasLessPackedUserOperation;

  event UserOperationSponsored(
    address indexed sender,
    uint256 actualGasCost,
    uint256 actualUserOpFeePerGas
  );

  constructor(
    IEntryPoint _entryPoint,
    address _owner
  ) BasePaymaster(_entryPoint) {
    _transferOwnership(_owner);
  }

  function parsePaymasterAndData(
    bytes calldata paymasterAndData
  ) internal pure returns (PaymasterAndData memory) {
    address paymasterAddress = address(bytes20(paymasterAndData[:20]));
    // bytes32 packedPaymasterGasLimits = bytes32(paymasterAndData[20:52]); // -> Unused

    (
      bytes32 gasLessPackedUserOperationHash,
      uint48 validAfter,
      uint48 validUntil,
      uint256 chainId,
      bytes memory signature
    ) = abi.decode(
        paymasterAndData[52:],
        (bytes32, uint48, uint48, uint256, bytes)
      );

    return
      PaymasterAndData(
        paymasterAddress,
        gasLessPackedUserOperationHash,
        validAfter,
        validUntil,
        chainId,
        signature
      );
  }

  /**
   * Verify our external signer signed this request and decode paymasterData
   * paymasterData contains the following:
   * token address length 20
   * signature length 64 or 65
   */
  function _validatePaymasterUserOp(
    PackedUserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 maxCost
  )
    internal
    virtual
    override
    returns (bytes memory context, uint256 validationData)
  {
    PaymasterAndData memory paymasterAndData = parsePaymasterAndData(
      userOp.paymasterAndData
    );
    require(paymasterAndData.chainId == block.chainid, "incorrect chainId");
    require(
      paymasterAndData.signature.length == 65,
      "CP01: invalid signature length in paymasterAndData"
    );

    bytes32 GasLessPackedUserOperationHash = GasLessPackedUserOperationLib
      .fromUserOp(userOp)
      .hash();
    address recoveredAddress = ECDSA.recover(
      MessageHashUtils.toEthSignedMessageHash(GasLessPackedUserOperationHash),
      paymasterAndData.signature
    );

    if (owner() != recoveredAddress) {
      return (
        "",
        _packValidationData(
          true,
          uint48(block.timestamp),
          uint48(block.timestamp)
        )
      );
    }

    bytes memory _context = abi.encode(userOp, paymasterAndData);
    return (
      _context,
      _packValidationData(
        false,
        paymasterAndData.validUntil,
        paymasterAndData.validAfter
      )
    );
  }

  /**
   * Perform the post-operation to charge the sender for the gas.
   */
  function _postOp(
    PostOpMode mode,
    bytes calldata context,
    uint256 actualGasCost,
    uint256 actualUserOpFeePerGas
  ) internal override {
    if (mode == PostOpMode.opSucceeded) {
      (PackedUserOperation memory userOp, ) = abi.decode(
        context,
        (PackedUserOperation, PaymasterAndData)
      );
      emit UserOperationSponsored(
        userOp.sender,
        actualGasCost,
        actualUserOpFeePerGas
      );
    }
  }
}
