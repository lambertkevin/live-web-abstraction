// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { BytesLib } from "@solidity-bytes-utils/BytesLib.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";
import { Webauthn256r1SignerLib } from "./WebauthnSigner.sol";
import { EOASignerLib } from "./EOASigner.sol";

library LedgerAccountSignatureLib {
  error InvalidSignatureScheme();

  enum SignatureDryRun {
    OFF,
    ON
  }

  // Cannot exceed 16 entries (4 bits)
  enum SignatureMessageType {
    WEBAUTHN,
    EIP191,
    EIP712
  }

  // Cannot exceed 8 entries (3 bits)
  enum SignatureCurveType {
    P256_R1_VERIFY,
    P256_K1_ECRECOVER
  }

  struct SignatureProperties {
    SignatureDryRun dryRun;
    SignatureMessageType messageType;
    SignatureCurveType curveType;
  }

  function getSignatureProperties(
    bytes memory signature
  ) public pure returns (SignatureProperties memory) {
    bytes1 signatureFlag = bytes1(signature);

    SignatureDryRun dryRun = SignatureDryRun(
      uint8((signatureFlag >> 7) & 0x01)
    );
    SignatureMessageType messageType = SignatureMessageType(
      uint8((signatureFlag >> 3) & 0x0f)
    );
    SignatureCurveType curveType = SignatureCurveType(
      uint8(signatureFlag & 0x07)
    );

    return SignatureProperties(dryRun, messageType, curveType);
  }

  function validateSignature(
    PackedUserOperation memory userOp,
    bytes32 userOpHash,
    address verifier
  ) internal view returns (uint256 validationData) {
    SignatureProperties memory signatureProps = getSignatureProperties(
      userOp.signature
    );
    bytes memory signature = BytesLib.slice(
      userOp.signature,
      1,
      userOp.signature.length - 1
    );

    if (
      signatureProps.messageType == SignatureMessageType.WEBAUTHN &&
      signatureProps.curveType == SignatureCurveType.P256_R1_VERIFY
    ) {
      return
        Webauthn256r1SignerLib.validateSignature(
          verifier,
          signature,
          userOpHash,
          signatureProps.dryRun == SignatureDryRun.ON
        );
    }

    if (
      signatureProps.messageType == SignatureMessageType.EIP191 &&
      signatureProps.curveType == SignatureCurveType.P256_K1_ECRECOVER
    ) {
      return
        EOASignerLib.validateEIP191Signature(
          signature,
          userOpHash,
          signatureProps.dryRun == SignatureDryRun.ON
        );
    }

    if (
      signatureProps.messageType == SignatureMessageType.EIP712 &&
      signatureProps.curveType == SignatureCurveType.P256_K1_ECRECOVER
    ) {
      return
        EOASignerLib.validateEIP712Signature(
          signature,
          userOp,
          userOpHash,
          signatureProps.dryRun == SignatureDryRun.ON
        );
    }

    revert InvalidSignatureScheme();
  }

  function addNewSigner(
    bytes memory addSignerPayload,
    function() _callback
  ) internal {
    SignatureProperties memory signatureProps = getSignatureProperties(
      addSignerPayload
    );
    bytes memory signerElements = BytesLib.slice(
      addSignerPayload,
      1,
      addSignerPayload.length - 1
    );

    if (signatureProps.messageType == SignatureMessageType.WEBAUTHN) {
      (bytes32 credIdHash, uint256 qX, uint256 qY) = abi.decode(
        signerElements,
        (bytes32, uint256, uint256)
      );
      Webauthn256r1SignerLib.setSigner(credIdHash, qX, qY);
      _callback();
    }

    if (
      signatureProps.messageType == SignatureMessageType.EIP191 ||
      signatureProps.messageType == SignatureMessageType.EIP712
    ) {
      EOASignerLib.setSigner(address(bytes20(signerElements)));
      _callback();
    }
  }
}
