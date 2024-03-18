// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Vm } from "forge-std/Vm.sol";
import { Test } from "forge-std/Test.sol";
import { console2 } from "forge-std/console2.sol";
import { MessageHashUtils } from "@openzeppelin/utils/cryptography/MessageHashUtils.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";
import { EOASignerLib } from "../src/Libraries/EOASigner.sol";

contract EOATest is Test {
  event EOASignerAdded(address indexed addr);

  function test_Should_Revert_Setting_Zero_Signer() public {
    vm.expectRevert();
    EOASignerLib.setSigner(address(0));
  }

  function test_Should_Find_Signer(address addr) public {
    vm.assume(addr != address(0));

    vm.expectEmit(true, false, false, false);
    emit EOASignerAdded(addr);

    EOASignerLib.setSigner(addr);

    EOASignerLib.EOASigner memory signer = EOASignerLib.getSigner(addr);

    assertEq(signer.addr, addr);
  }

  function test_Should_Not_Find_Signer(address addr) public {
    vm.expectRevert();
    EOASignerLib.getSigner(addr);
  }

  function test_Should_Validate_EIP191_Signature(
    string memory walletLabel,
    bytes32 userOpHash
  ) public {
    bytes32 digest = MessageHashUtils.toEthSignedMessageHash(userOpHash);
    Vm.Wallet memory wallet = vm.createWallet(walletLabel);
    vm.assume(wallet.addr != address(0));

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wallet, digest);
    bytes memory signature = abi.encodePacked(r, s, v);

    EOASignerLib.setSigner(wallet.addr);
    assertEq(
      EOASignerLib.validateEIP191Signature(signature, userOpHash, false),
      0
    );
  }

  function test_Should_Not_Validate_EIP191_Signature(
    string memory walletLabel,
    bytes32 userOpHash
  ) public {
    Vm.Wallet memory wallet = vm.createWallet(walletLabel);
    vm.assume(wallet.addr != address(0));

    bytes32 digest = MessageHashUtils.toEthSignedMessageHash(userOpHash);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wallet, digest);

    assertEq(
      EOASignerLib.validateEIP191Signature(
        abi.encodePacked(r, s, v),
        userOpHash,
        false
      ),
      1
    );
  }

  function test_Should_Not_Validate_EIP712_Signature(
    string memory walletLabel,
    PackedUserOperation calldata userOp,
    bytes32 userOpHash
  ) public {
    bytes32 DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256("Ledger Smart Contract Account"),
        keccak256("1"),
        block.chainid,
        address(this)
      )
    );
    bytes32 PACKED_USEROP_AND_HASH_TYPE = keccak256(
      "PackedUserOperationAndHash(address sender,uint256 nonce,bytes initCode,bytes callData,bytes32 accountGasLimits,uint256 preVerificationGas,bytes32 gasFees,bytes paymasterAndData,bytes32 userOpHash)"
    );
    bytes32 digest = MessageHashUtils.toTypedDataHash(
      DOMAIN_SEPARATOR,
      keccak256(
        abi.encode(
          PACKED_USEROP_AND_HASH_TYPE,
          userOp.sender,
          userOp.nonce,
          keccak256(userOp.initCode),
          keccak256(userOp.callData),
          userOp.accountGasLimits,
          userOp.preVerificationGas,
          userOp.gasFees,
          keccak256(userOp.paymasterAndData),
          userOpHash
        )
      )
    );

    Vm.Wallet memory wallet = vm.createWallet(walletLabel);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wallet, digest);
    bytes memory signature = abi.encodePacked(r, s, v);

    PackedUserOperation memory signedUserOp = PackedUserOperation(
      userOp.sender,
      userOp.nonce,
      userOp.initCode,
      userOp.callData,
      userOp.accountGasLimits,
      userOp.preVerificationGas,
      userOp.gasFees,
      userOp.paymasterAndData,
      signature
    );

    assertEq(
      EOASignerLib.validateEIP712Signature(
        signature,
        signedUserOp,
        userOpHash,
        false
      ),
      1
    );
  }

  function test_Should_Validate_EIP712_Signature(
    string memory walletLabel,
    PackedUserOperation calldata userOp,
    bytes32 userOpHash
  ) public {
    bytes32 DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256("Ledger Smart Contract Account"),
        keccak256("1"),
        block.chainid,
        address(this)
      )
    );
    bytes32 PACKED_USEROP_AND_HASH_TYPE = keccak256(
      "PackedUserOperationAndHash(address sender,uint256 nonce,bytes initCode,bytes callData,bytes32 accountGasLimits,uint256 preVerificationGas,bytes32 gasFees,bytes paymasterAndData,bytes32 userOpHash)"
    );
    bytes32 digest = MessageHashUtils.toTypedDataHash(
      DOMAIN_SEPARATOR,
      keccak256(
        abi.encode(
          PACKED_USEROP_AND_HASH_TYPE,
          userOp.sender,
          userOp.nonce,
          keccak256(userOp.initCode),
          keccak256(userOp.callData),
          userOp.accountGasLimits,
          userOp.preVerificationGas,
          userOp.gasFees,
          keccak256(userOp.paymasterAndData),
          userOpHash
        )
      )
    );

    Vm.Wallet memory wallet = vm.createWallet(walletLabel);
    vm.assume(wallet.addr != address(0));

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wallet, digest);
    bytes memory signature = abi.encodePacked(r, s, v);

    PackedUserOperation memory signedUserOp = PackedUserOperation(
      userOp.sender,
      userOp.nonce,
      userOp.initCode,
      userOp.callData,
      userOp.accountGasLimits,
      userOp.preVerificationGas,
      userOp.gasFees,
      userOp.paymasterAndData,
      signature
    );

    EOASignerLib.setSigner(wallet.addr);
    assertEq(
      EOASignerLib.validateEIP712Signature(
        signature,
        signedUserOp,
        userOpHash,
        false
      ),
      0
    );
  }
}
