// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Vm } from "forge-std/Vm.sol";
import { Test } from "forge-std/Test.sol";
import { Math } from "@openzeppelin/utils/math/Math.sol";
import { IPaymaster } from "@account-abstraction/interfaces/IPaymaster.sol";
import { _packValidationData } from "@account-abstraction/core/Helpers.sol";
import { MessageHashUtils } from "@openzeppelin/utils/cryptography/MessageHashUtils.sol";
import { EntryPointSimulations } from "@account-abstraction/core/EntryPointSimulations.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";
import { GasLessPackedUserOperationLib, GasLessPackedUserOperation } from "../src/Libraries/GasLessPackedUserOperation.sol";
import { LedgerAccountFactory } from "../src/Accounts/LedgerAccountFactory.sol";
import { Paymaster, PaymasterAndData } from "../src/Paymaster/Paymaster.sol";

contract ExposedPaymaster is Paymaster {
  constructor(
    EntryPointSimulations entrypoint,
    address owner
  ) Paymaster(entrypoint, owner) {}

  function exposed_parsePaymasterAndData(
    bytes calldata paymasterData
  ) external pure returns (PaymasterAndData memory) {
    return parsePaymasterAndData(paymasterData);
  }
}

contract PaymasterTest is Test {
  using GasLessPackedUserOperationLib for GasLessPackedUserOperation;

  event UserOperationSponsored(
    address indexed sender,
    uint256 actualGasCost,
    uint256 actualUserOpFeePerGas
  );

  EntryPointSimulations entrypoint;
  Vm.Wallet wallet;
  ExposedPaymaster pm;

  function setUp() public {
    entrypoint = new EntryPointSimulations();
    wallet = vm.createWallet("paymaster");
    pm = new ExposedPaymaster(entrypoint, wallet.addr);
  }

  function test_Should_Parse_PaymasterData_Correctly(
    address paymasterAddress,
    bytes32 gasLessPackedUserOperationHash,
    uint128 paymasterVerificationGasLimit,
    uint128 paymasterPostOpGasLimit,
    uint48 validAfter,
    uint48 validUntil,
    uint256 chainId,
    bytes memory signature
  ) public {
    bytes32 packedGasLimits = bytes32(
      abi.encodePacked(paymasterVerificationGasLimit, paymasterPostOpGasLimit)
    );
    bytes memory encodedData = abi.encodePacked(
      paymasterAddress,
      packedGasLimits,
      abi.encode(
        gasLessPackedUserOperationHash,
        validAfter,
        validUntil,
        chainId,
        signature
      )
    );
    PaymasterAndData memory parsedPaymasterAndData = pm
      .exposed_parsePaymasterAndData(encodedData);

    assertEq(parsedPaymasterAndData.paymasterAddress, paymasterAddress);
    assertEq(
      parsedPaymasterAndData.gasLessPackedUserOperationHash,
      gasLessPackedUserOperationHash
    );
    assertEq(parsedPaymasterAndData.validAfter, validAfter);
    assertEq(parsedPaymasterAndData.validUntil, validUntil);
    assertEq(parsedPaymasterAndData.chainId, chainId);
    assertEq(parsedPaymasterAndData.signature, signature);
  }

  // This shouldn't be necessary as block.chainId is technically available since 0.8...
  function getChainId() private view returns (uint256 chainId) {
    assembly {
      chainId := chainid()
    }
  }

  function test_Should_Validate_Paymaster_UserOp(
    PackedUserOperation memory packedUserOp,
    uint256 maxCost,
    uint128 paymasterVerificationGasLimit,
    uint128 paymasterPostOpGasLimit,
    uint48 validAfter,
    uint48 validUntil,
    uint64 chainId
  ) public {
    vm.pauseGasMetering();
    bound(validAfter, block.timestamp - 1, block.timestamp);
    bound(validUntil, block.timestamp + 1, block.timestamp + 100);
    vm.assume(chainId >= 1 && chainId < (2 ^ 64) - 1);

    {
      vm.chainId(chainId);
      bytes32 gasLessPackedUserOperationHash;
      {
        GasLessPackedUserOperation
          memory gasLessUserOp = GasLessPackedUserOperationLib.fromUserOp(
            packedUserOp
          );
        gasLessPackedUserOperationHash = gasLessUserOp.hash();
      }

      bytes memory signature;
      {
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
          gasLessPackedUserOperationHash
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wallet, digest);
        signature = abi.encodePacked(r, s, v);
      }

      bytes32 packedGasLimits = bytes32(
        abi.encodePacked(paymasterVerificationGasLimit, paymasterPostOpGasLimit)
      );
      bytes memory paymasterAndData = abi.encodePacked(
        address(pm),
        packedGasLimits,
        abi.encode(
          gasLessPackedUserOperationHash,
          validAfter,
          validUntil,
          chainId,
          signature
        )
      );
      packedUserOp.paymasterAndData = paymasterAndData;
    }

    bytes32 userOpHash = entrypoint.getUserOpHash(packedUserOp);

    vm.prank(address(entrypoint));
    vm.resumeGasMetering();
    (bytes memory context, uint256 validationData) = pm.validatePaymasterUserOp(
      packedUserOp,
      userOpHash,
      maxCost
    );
    vm.pauseGasMetering();

    PaymasterAndData memory structPaymasterAndData = pm
      .exposed_parsePaymasterAndData(packedUserOp.paymasterAndData);
    bytes memory expectedContext = abi.encode(
      packedUserOp,
      structPaymasterAndData
    );

    assertEq(keccak256(context), keccak256(expectedContext));
    assertEq(
      _packValidationData(
        false,
        structPaymasterAndData.validUntil,
        structPaymasterAndData.validAfter
      ),
      validationData
    );
    vm.resumeGasMetering();
  }

  function test_Should_Not_Validate_Paymaster_UserOp(
    string memory wrongWalletLabel,
    PackedUserOperation memory packedUserOp,
    uint128 paymasterVerificationGasLimit,
    uint128 paymasterPostOpGasLimit,
    uint256 maxCost,
    uint48 validAfter,
    uint48 validUntil,
    uint64 chainId
  ) public {
    bound(validAfter, block.number - 1, block.number);
    bound(validUntil, block.number + 1, block.number + 100);
    vm.assume(chainId >= 1 && chainId < (2 ^ 64) - 1);

    {
      vm.chainId(chainId);
      bytes32 gasLessPackedUserOperationHash;
      {
        GasLessPackedUserOperation
          memory gasLessUserOp = GasLessPackedUserOperationLib.fromUserOp(
            packedUserOp
          );
        gasLessPackedUserOperationHash = gasLessUserOp.hash();
      }

      bytes memory signature;
      {
        Vm.Wallet memory wrongWallet = vm.createWallet(wrongWalletLabel);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
          gasLessPackedUserOperationHash
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongWallet, digest);
        signature = abi.encodePacked(r, s, v);
      }

      bytes32 packedGasLimits = bytes32(
        abi.encodePacked(paymasterVerificationGasLimit, paymasterPostOpGasLimit)
      );
      bytes memory paymasterAndData = abi.encodePacked(
        address(pm),
        packedGasLimits,
        abi.encode(
          gasLessPackedUserOperationHash,
          validAfter,
          validUntil,
          chainId,
          signature
        )
      );
      packedUserOp.paymasterAndData = paymasterAndData;
    }

    bytes32 userOpHash = entrypoint.getUserOpHash(packedUserOp);
    vm.prank(address(entrypoint));
    (bytes memory context, uint256 validationData) = pm.validatePaymasterUserOp(
      packedUserOp,
      userOpHash,
      maxCost
    );

    bytes memory expectedContext = hex"";
    assertEq(keccak256(context), keccak256(expectedContext));
    assertEq(
      _packValidationData(
        true,
        uint48(block.timestamp),
        uint48(block.timestamp)
      ),
      validationData
    );
  }

  function test_Should_Fire_Event_On_Sponsoring_Successful(
    PackedUserOperation calldata packedUserOp,
    PaymasterAndData calldata paymasterAndData,
    uint256 actualGasCost,
    uint256 actualUserOpFeePerGas
  ) public {
    vm.pauseGasMetering();
    vm.prank(address(entrypoint));
    bytes memory context = abi.encode(packedUserOp, paymasterAndData);

    vm.resumeGasMetering();
    vm.expectEmit(true, false, false, false);
    emit UserOperationSponsored(
      packedUserOp.sender,
      actualGasCost,
      actualUserOpFeePerGas
    );

    pm.postOp(
      IPaymaster.PostOpMode.opSucceeded,
      context,
      actualGasCost,
      actualUserOpFeePerGas
    );
  }
}
