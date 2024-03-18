// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Vm } from "forge-std/Vm.sol";
import { Test } from "forge-std/Test.sol";
import { WebauthnVerifier256r1 } from "../src/Webauthn/WebauthnVerifier256r1.sol";
import { MessageHashUtils } from "@openzeppelin/utils/cryptography/MessageHashUtils.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";
import { LedgerAccountSignatureLib } from "../src/Libraries/LedgerAccountSignature.sol";
import { Webauthn256r1SignerLib } from "../src/Libraries/WebauthnSigner.sol";
import { EOASignerLib } from "../src/Libraries/EOASigner.sol";

contract SignatureTest is Test {
  event Callback();

  WebauthnVerifier256r1 verifier;
  function setUp() public {
    verifier = new WebauthnVerifier256r1();
  }

  function test_Should_Decode_Signature_Correctly(
    uint8 dryRun,
    uint8 messageType,
    uint8 curveType
  ) public {
    dryRun = uint8(bound(dryRun, 0, 1));
    messageType = uint8(bound(messageType, 0, 2));
    curveType = uint8(bound(curveType, 0, 1));

    bytes1 signature = (((bytes1(dryRun) << 4) |
      (bytes1(messageType) & 0x0f)) << 3) | (bytes1(curveType) & 0x07);
    LedgerAccountSignatureLib.SignatureProperties
      memory props = LedgerAccountSignatureLib.getSignatureProperties(
        abi.encodePacked(signature)
      );

    assertEq(uint8(props.dryRun), dryRun);
    assertEq(uint8(props.messageType), messageType);
    assertEq(uint8(props.curveType), curveType);
  }

  function test_Should_Validate_EIP191_Signature(
    string memory walletLabel,
    PackedUserOperation calldata _userOp,
    bytes32 userOpHash
  ) public {
    bytes32 digest = MessageHashUtils.toEthSignedMessageHash(userOpHash);
    Vm.Wallet memory wallet = vm.createWallet(walletLabel);
    vm.assume(wallet.addr != address(0));

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wallet, digest);
    bytes memory signature = abi.encodePacked(r, s, v);

    EOASignerLib.setSigner(wallet.addr);
    PackedUserOperation memory userOp = PackedUserOperation(
      _userOp.sender,
      _userOp.nonce,
      _userOp.initCode,
      _userOp.callData,
      _userOp.accountGasLimits,
      _userOp.preVerificationGas,
      _userOp.gasFees,
      _userOp.paymasterAndData,
      abi.encodePacked(bytes1(0x09), signature)
    );

    assertEq(
      LedgerAccountSignatureLib.validateSignature(
        userOp,
        userOpHash,
        address(verifier)
      ),
      0
    );
  }

  function test_Should_Not_Validate_EIP191_Signature_Dry_Run(
    string memory walletLabel,
    PackedUserOperation calldata _userOp,
    bytes32 userOpHash
  ) public {
    bytes32 digest = MessageHashUtils.toEthSignedMessageHash(userOpHash);
    Vm.Wallet memory wallet = vm.createWallet(walletLabel);
    vm.assume(wallet.addr != address(0));

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wallet, digest);
    bytes memory signature = abi.encodePacked(r, s, v);

    EOASignerLib.setSigner(wallet.addr);
    PackedUserOperation memory userOp = PackedUserOperation(
      _userOp.sender,
      _userOp.nonce,
      _userOp.initCode,
      _userOp.callData,
      _userOp.accountGasLimits,
      _userOp.preVerificationGas,
      _userOp.gasFees,
      _userOp.paymasterAndData,
      abi.encodePacked(bytes1(0x89), signature)
    );

    assertEq(
      LedgerAccountSignatureLib.validateSignature(
        userOp,
        userOpHash,
        address(verifier)
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
      abi.encodePacked(bytes1(0x11), signature)
    );

    EOASignerLib.setSigner(wallet.addr);
    assertEq(
      LedgerAccountSignatureLib.validateSignature(
        signedUserOp,
        userOpHash,
        address(verifier)
      ),
      0
    );
  }

  function test_Should_Not_Validate_EIP712_Signature_Dry_Run(
    string memory walletLabel,
    PackedUserOperation calldata userOp,
    bytes32 userOpHash
  ) public {
    bytes32 DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
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
          EOASignerLib.PackedUserOpAndHash(
            userOp.sender,
            userOp.nonce,
            userOp.initCode,
            userOp.callData,
            userOp.accountGasLimits,
            userOp.preVerificationGas,
            userOp.gasFees,
            userOp.paymasterAndData,
            userOpHash
          )
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
      abi.encodePacked(bytes1(0x91), signature)
    );

    EOASignerLib.setSigner(wallet.addr);
    assertEq(
      LedgerAccountSignatureLib.validateSignature(
        signedUserOp,
        userOpHash,
        address(verifier)
      ),
      1
    );
  }

  function test_Should_Validate_Webauthn_Signature(
    PackedUserOperation memory userOp
  ) public {
    bytes
      memory sig = hex"004500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001e05eeb467d2e01a93c278665262fcec5d8fd9181052a81f6f94bfdd01aaf037fcf00000000000000000000000000000000000000000000000000000000000000270efbec632baf85ff5228c8c2bbe849cd01a35a96fd7ece0888f5b70d871df17401e6d9b85bf7cbe2267a8cb2a347f5901fc59788dafcc6a06350e40c730af2d6f4a19843f202d80062b74cf76360f2b78a4ec203640632fb1f048064d1a0a78000000000000000000000000000000000000000000000000000000000000000a449960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97634500000000adce000235bcc60a648b0b25f1f0550300203150fed76d9f9e802162236fd45540f7765b22d9702ff17a4584a9368cfcd88ca501020326200121582057959ef891d217cdddedcc776880298057c933067bb4730e7508f6606d1018dc225820864b17cc21b46029f589e9a7a69c44987231211c9a9882df241d9279a4d5e9150000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000897b2274797065223a22776562617574686e2e637265617465222c226368616c6c656e6765223a2258757447665334427154776e686d556d4c383746325032526751557167666235535f335147713844663838222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a31323334222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000000000000000";

    userOp.signature = sig;

    Webauthn256r1SignerLib.setSigner(
      0xf4a19843f202d80062b74cf76360f2b78a4ec203640632fb1f048064d1a0a780,
      0x57959ef891d217cdddedcc776880298057c933067bb4730e7508f6606d1018dc,
      0x864b17cc21b46029f589e9a7a69c44987231211c9a9882df241d9279a4d5e915
    );

    assertEq(
      LedgerAccountSignatureLib.validateSignature(
        userOp,
        keccak256("bite"),
        address(verifier)
      ),
      0
    );
  }

  function test_Should_Not_Validate_Webauthn_Signature_Dry_Run(
    PackedUserOperation memory userOp
  ) public {
    bytes
      memory sig = hex"804500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001e05eeb467d2e01a93c278665262fcec5d8fd9181052a81f6f94bfdd01aaf037fcf00000000000000000000000000000000000000000000000000000000000000270efbec632baf85ff5228c8c2bbe849cd01a35a96fd7ece0888f5b70d871df17401e6d9b85bf7cbe2267a8cb2a347f5901fc59788dafcc6a06350e40c730af2d6f4a19843f202d80062b74cf76360f2b78a4ec203640632fb1f048064d1a0a78000000000000000000000000000000000000000000000000000000000000000a449960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97634500000000adce000235bcc60a648b0b25f1f0550300203150fed76d9f9e802162236fd45540f7765b22d9702ff17a4584a9368cfcd88ca501020326200121582057959ef891d217cdddedcc776880298057c933067bb4730e7508f6606d1018dc225820864b17cc21b46029f589e9a7a69c44987231211c9a9882df241d9279a4d5e9150000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000897b2274797065223a22776562617574686e2e637265617465222c226368616c6c656e6765223a2258757447665334427154776e686d556d4c383746325032526751557167666235535f335147713844663838222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a31323334222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000000000000000";

    userOp.signature = sig;

    Webauthn256r1SignerLib.setSigner(
      0xf4a19843f202d80062b74cf76360f2b78a4ec203640632fb1f048064d1a0a780,
      0x57959ef891d217cdddedcc776880298057c933067bb4730e7508f6606d1018dc,
      0x864b17cc21b46029f589e9a7a69c44987231211c9a9882df241d9279a4d5e915
    );

    assertEq(
      LedgerAccountSignatureLib.validateSignature(
        userOp,
        keccak256("bite"),
        address(verifier)
      ),
      1
    );
  }

  function assertSignerAdded() private {
    emit Callback();
  }

  function test_Should_Set_New_Webauthn_Signer(
    PackedUserOperation memory userOp
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
    bytes memory newSignerPayload = abi.encodePacked(
      bytes1(0x00),
      signerElements
    );

    vm.expectEmit();
    emit Callback();

    LedgerAccountSignatureLib.addNewSigner(newSignerPayload, assertSignerAdded);
    userOp
      .signature = hex"004500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001e05eeb467d2e01a93c278665262fcec5d8fd9181052a81f6f94bfdd01aaf037fcf00000000000000000000000000000000000000000000000000000000000000270efbec632baf85ff5228c8c2bbe849cd01a35a96fd7ece0888f5b70d871df17401e6d9b85bf7cbe2267a8cb2a347f5901fc59788dafcc6a06350e40c730af2d6f4a19843f202d80062b74cf76360f2b78a4ec203640632fb1f048064d1a0a78000000000000000000000000000000000000000000000000000000000000000a449960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97634500000000adce000235bcc60a648b0b25f1f0550300203150fed76d9f9e802162236fd45540f7765b22d9702ff17a4584a9368cfcd88ca501020326200121582057959ef891d217cdddedcc776880298057c933067bb4730e7508f6606d1018dc225820864b17cc21b46029f589e9a7a69c44987231211c9a9882df241d9279a4d5e9150000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000897b2274797065223a22776562617574686e2e637265617465222c226368616c6c656e6765223a2258757447665334427154776e686d556d4c383746325032526751557167666235535f335147713844663838222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a31323334222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000000000000000";

    assertEq(
      LedgerAccountSignatureLib.validateSignature(
        userOp,
        keccak256("bite"),
        address(verifier)
      ),
      0
    );
  }

  function test_Should_Set_New_EOA_Signer(
    PackedUserOperation memory userOp,
    bytes32 userOpHash,
    string memory walletLabel
  ) public {
    Vm.Wallet memory wallet = vm.createWallet(walletLabel);
    bytes memory newSignerPayload = abi.encodePacked(bytes1(0x09), wallet.addr);

    vm.expectEmit();
    emit Callback();

    LedgerAccountSignatureLib.addNewSigner(newSignerPayload, assertSignerAdded);

    bytes32 digest = MessageHashUtils.toEthSignedMessageHash(userOpHash);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wallet, digest);
    bytes memory signature = abi.encodePacked(r, s, v);
    userOp.signature = abi.encodePacked(bytes1(0x09), signature);

    assertEq(
      LedgerAccountSignatureLib.validateSignature(
        userOp,
        userOpHash,
        address(verifier)
      ),
      0
    );
  }
}
