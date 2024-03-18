// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { WebauthnVerifier256r1 } from "../Webauthn/WebauthnVerifier256r1.sol";

library Webauthn256r1SignerLib {
  event WebauthnSignerAdded(bytes32 credIdHash);

  bytes32 private constant SLOT_START =
    keccak256("Ledger.Signers.Webauthn256r1");

  struct Webauthn256r1Signer {
    bytes32 credIdHash;
    uint256 qX;
    uint256 qY;
  }

  function _getSigner(
    bytes32 credIdHash
  ) private pure returns (Webauthn256r1Signer storage signer) {
    bytes32 slot = keccak256(abi.encodePacked(SLOT_START, credIdHash));
    assembly {
      signer.slot := slot
    }
  }

  function getSigner(
    bytes32 credIdHash
  ) internal view returns (Webauthn256r1Signer storage signer) {
    signer = _getSigner(credIdHash);
    require(signer.credIdHash != bytes32(0), "Signer credIdHash is null");
    require(signer.qX != 0, "Signer Pk X is 0");
    require(signer.qY != 0, "Signer Pk Y is 0");
  }

  function setSigner(
    bytes32 credIdHash,
    uint256 qX,
    uint256 qY
  ) internal returns (Webauthn256r1Signer storage) {
    require(credIdHash != bytes32(0), "credIdHash can't be null");
    require(qX != 0, "Pk X can't 0");
    require(qY != 0, "Pk Y can't 0");

    Webauthn256r1Signer storage signer = _getSigner(credIdHash);
    signer.credIdHash = credIdHash;
    signer.qX = qX;
    signer.qY = qY;

    emit WebauthnSignerAdded(credIdHash);

    return signer;
  }

  function parseSignature(
    bytes memory signature
  )
    internal
    pure
    returns (
      bytes1 authenticatorDataFlagMask,
      bytes memory authenticatorData,
      bytes memory clientData,
      bytes32 clientChallenge,
      uint256 clientChallengeOffset,
      uint256 r,
      uint256 s,
      bytes32 credIdHash
    )
  {
    return
      abi.decode(
        signature,
        (bytes1, bytes, bytes, bytes32, uint256, uint256, uint256, bytes32)
      );
  }

  function validateSignature(
    address webauthnVerifier256r1Addr,
    bytes memory signature,
    bytes32 userOpHash,
    bool dryRun
  ) internal view returns (uint256 validationData) {
    {
      (
        bytes1 authenticatorDataFlagMask,
        bytes memory authenticatorData,
        bytes memory clientData,
        bytes32 clientChallenge,
        uint256 clientChallengeOffset,
        uint256 r,
        uint256 s,
        bytes32 credIdHash
      ) = parseSignature(signature);

      require(
        clientChallenge == (dryRun ? clientChallenge : userOpHash),
        "challenge & userOpHash mismatch"
      );

      Webauthn256r1Signer memory signer = _getSigner(
        !dryRun
          ? credIdHash
          : bytes32(
            0x1f26a4e36d4e35588e2908f58c70399d9ef332ed1767b77f786b18b078f4ee08
          )
      );
      if (dryRun) {
        signer = Webauthn256r1Signer(
          0x1f26a4e36d4e35588e2908f58c70399d9ef332ed1767b77f786b18b078f4ee08,
          0x46bfdfbddbc22d475a21be7fb6fb597a9e7aca90a4e76ba93a19b26985c87a15,
          0xa0e41b38419d2837cf8ea557f91b638c01c12a70230724ef06825f2393a76a70
        );
      }

      bool signatureVerified = WebauthnVerifier256r1(webauthnVerifier256r1Addr)
        .verify(
          authenticatorDataFlagMask,
          authenticatorData,
          clientData,
          clientChallenge,
          clientChallengeOffset,
          r,
          s,
          signer.qX,
          signer.qY
        );

      if (
        dryRun ||
        signer.credIdHash == bytes32(0) ||
        signer.qX == 0 ||
        signer.qY == 0 ||
        !signatureVerified
      ) {
        return 1;
      }
      return 0;
    }
  }
}
