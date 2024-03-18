// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { ECDSA } from "@openzeppelin/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/utils/cryptography/MessageHashUtils.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";

library EOASignerLib {
  event EOASignerAdded(address indexed addr);

  bytes32 private constant SLOT_START = keccak256("Ledger.Signers.EOA");

  struct EOASigner {
    address addr;
  }

  struct PackedUserOpAndHash {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    bytes32 accountGasLimits;
    uint256 preVerificationGas;
    bytes32 gasFees;
    bytes paymasterAndData;
    bytes32 userOpHash;
  }

  function _getDomainSeparator() private view returns (bytes32) {
    return
      keccak256(
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
  }

  function _getPackedUserOpAndHashTypeHash() private pure returns (bytes32) {
    return
      keccak256(
        "PackedUserOperationAndHash(address sender,uint256 nonce,bytes initCode,bytes callData,bytes32 accountGasLimits,uint256 preVerificationGas,bytes32 gasFees,bytes paymasterAndData,bytes32 userOpHash)"
      );
  }

  function _getSigner(
    address addr
  ) private pure returns (EOASigner storage signer) {
    bytes32 slot = keccak256(abi.encodePacked(SLOT_START, addr));
    assembly {
      signer.slot := slot
    }
  }

  function getSigner(
    address addr
  ) internal view returns (EOASigner storage signer) {
    signer = _getSigner(addr);
    require(signer.addr != address(0), "Signer can't be the burn address");
  }

  function setSigner(address addr) internal returns (EOASigner storage) {
    require(addr != address(0), "Signer's address can't be the burn address");

    EOASigner storage signer = _getSigner(addr);
    signer.addr = addr;

    emit EOASignerAdded(addr);

    return signer;
  }

  function validateEIP191Signature(
    bytes memory signature,
    bytes32 userOpHash,
    bool dryRun
  ) internal view returns (uint256 validationData) {
    bytes32 digest = MessageHashUtils.toEthSignedMessageHash(userOpHash);
    address ecrecoverAddr = ECDSA.recover(digest, signature);

    EOASigner storage signer = _getSigner(ecrecoverAddr);
    bool signatureVerified = signer.addr == ecrecoverAddr;

    if (dryRun || signer.addr == address(0) || !signatureVerified) {
      return 1;
    }
    return 0;
  }

  function validateEIP712Signature(
    bytes memory signature,
    PackedUserOperation memory userOp,
    bytes32 userOpHash,
    bool dryRun
  ) internal view returns (uint256 validationData) {
    bytes32 digest = MessageHashUtils.toTypedDataHash(
      _getDomainSeparator(),
      keccak256(
        abi.encode(
          _getPackedUserOpAndHashTypeHash(),
          userOp.sender,
          userOp.nonce,
          keccak256(userOp.initCode), // Based on EIP712 spec, all bytes and string types should be hashed
          keccak256(userOp.callData), // Based on EIP712 spec, all bytes and string types should be hashed
          userOp.accountGasLimits,
          userOp.preVerificationGas,
          userOp.gasFees,
          keccak256(userOp.paymasterAndData), // Based on EIP712 spec, all bytes and string types should be hashed
          userOpHash
        )
      )
    );

    address ecrecoverAddr = ECDSA.recover(digest, signature);
    EOASigner storage signer = _getSigner(ecrecoverAddr);
    bool signatureVerified = signer.addr == ecrecoverAddr;

    if (dryRun || signer.addr == address(0) || !signatureVerified) {
      return 1;
    }
    return 0;
  }
}
