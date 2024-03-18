// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { FCL_ecdsa } from "FCL/FCL_ecdsa.sol";
import { Base64 } from "@openzeppelin/utils/Base64.sol";

contract WebauthnVerifier256r1 {
  error InvalidAuthenticatorData();
  error InvalidUserFlag();
  error InvalidClientData();

  function digest(
    bytes1 authenticatorDataFlagMask, // @see https://www.w3.org/TR/webauthn-2/#sctn-authenticator-data -> flags
    bytes calldata authenticatorData, // @see https://www.w3.org/TR/webauthn-2/#sctn-attestation -> Authenticator Data Schema
    bytes calldata clientData, // @see https://www.w3.org/TR/webauthn-2/#dictionary-client-data -> unknown sized buffer of data containing challenge
    bytes32 clientChallenge, // limited to 32 bytes as it's intended to be used with keccaked challenge
    uint256 clientChallengeDataOffset // Offset of challenge in `clientData`
  ) public pure returns (bytes32) {
    unchecked {
      // AuthenticatorData cannot be under 37 bytes array
      // "The authenticator data structure is a byte array of 37 bytes or more, laid out as shown in Table."
      // @see https://www.w3.org/TR/webauthn-2/#sctn-authenticator-data
      if (authenticatorData.length < 37) {
        revert InvalidAuthenticatorData();
      }

      // Verify authenticatorDataFlagMask is the identical to the one contained in `authenticatorData`
      if (
        (authenticatorData[32] & authenticatorDataFlagMask) !=
        authenticatorDataFlagMask
      ) {
        revert InvalidAuthenticatorData();
      }

      // bit 0 => User Present
      bool userPresentFlag = authenticatorDataFlagMask & 0x01 == 0x01;
      // bit 2 => User Verified
      bool userVerifierFlag = (authenticatorDataFlagMask >> 0x2) & 0x01 == 0x01;
      // Revert if at least 1 flag is not true
      if (!userPresentFlag || !userVerifierFlag) {
        revert InvalidUserFlag();
      }

      // Base64URL encoding following W3C spec to match with the challenge contained in `clientData`
      // "This member contains the base64url encoding of the challenge provided by the Relying Party."
      // @see https://www.w3.org/TR/webauthn-2/#dictionary-client-data -> challenge, of type DOMString
      bytes memory challengeEncoded = bytes(
        Base64.encodeURL(abi.encodePacked(clientChallenge))
      );
      bytes32 hashedChallenged = keccak256(
        clientData[clientChallengeDataOffset:(clientChallengeDataOffset +
          challengeEncoded.length)]
      );

      if (keccak256(challengeEncoded) != hashedChallenged) {
        revert InvalidClientData();
      }

      // @see https://www.w3.org/TR/webauthn-2/#sctn-tpm-attestation -> signature procedure
      bytes32 clientDataHashed = sha256(clientData);
      return sha256(abi.encodePacked(authenticatorData, clientDataHashed));
    }
  }

  function verify(
    bytes1 authenticatorDataFlagMask, // @see https://www.w3.org/TR/webauthn-2/#sctn-authenticator-data -> flags
    bytes calldata authenticatorData, // @see https://www.w3.org/TR/webauthn-2/#sctn-attestation -> Authenticator Data Schema
    bytes calldata clientData, // @see https://www.w3.org/TR/webauthn-2/#dictionary-client-data -> unknown sized buffer of data containing challenge
    bytes32 clientChallenge,
    uint256 clientChallengeDataOffset, // Offset of challenge in `clientData`
    uint256 r, // r from ECDSA signature
    uint256 s, // s from ECDSA signature
    uint256 qx, // Pk x coordinate
    uint256 qy // Pk y coordinate
  ) external view returns (bool) {
    unchecked {
      bytes32 message = digest(
        authenticatorDataFlagMask,
        authenticatorData,
        clientData,
        clientChallenge,
        clientChallengeDataOffset
      );

      return FCL_ecdsa.ecdsa_verify(message, r, s, qx, qy);
    }
  }
}
