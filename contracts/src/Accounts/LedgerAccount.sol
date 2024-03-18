// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { ECDSA } from "@openzeppelin/utils/cryptography/ECDSA.sol";
import { BaseAccount } from "@account-abstraction/core/BaseAccount.sol";
import { Initializable } from "@openzeppelin/proxy/utils/Initializable.sol";
import { IEntryPoint } from "@account-abstraction/interfaces/IEntryPoint.sol";
import { UUPSUpgradeable } from "@openzeppelin/proxy/utils/UUPSUpgradeable.sol";
import { MessageHashUtils } from "@openzeppelin/utils/cryptography/MessageHashUtils.sol";
import { PackedUserOperation } from "@account-abstraction/interfaces/PackedUserOperation.sol";
import { TokenCallbackHandler } from "@account-abstraction/samples/callback/TokenCallbackHandler.sol";

contract LedgerAccount is
  BaseAccount,
  TokenCallbackHandler,
  UUPSUpgradeable,
  Initializable
{
  IEntryPoint private immutable _entryPoint;
  address immutable webauthnVerifierAddr;
  address immutable factoryAddr;
  string username;
  string domain;

  modifier onlyOwner() {
    _onlyOwner();
    _;
  }

  modifier onlyFactory() {
    _onlyFactory();
    _;
  }

  event LedgerAccountInitialized(
    IEntryPoint entryPoint,
    address indexed factoryAddr,
    string indexed username,
    string indexed domain
  );

  constructor(
    IEntryPoint anEntryPoint,
    address _webauthnVerifierAddr,
    address _factoryAddr
  ) {
    webauthnVerifierAddr = _webauthnVerifierAddr;
    factoryAddr = _factoryAddr;
    _entryPoint = anEntryPoint;
    _disableInitializers();
  }

  receive() external payable {}

  function _onlyOwner() internal view {
    //directly through the account itself (which gets redirected through execute())
    require(msg.sender == address(this), "only owner");
  }

  function _onlyFactory() internal view {
    require(msg.sender == factoryAddr, "only factory");
  }

  function entryPoint() public view virtual override returns (IEntryPoint) {
    return _entryPoint;
  }

  /**
   * execute a transaction (called directly from owner, or by entryPoint)
   */
  function execute(address dest, uint256 value, bytes calldata func) external {
    _requireFromEntryPointOrOwner();
    _call(dest, value, func);
  }

  /**
   * execute a sequence of transactions
   * @dev to reduce gas consumption for trivial case (no value), use a zero-length array to mean zero value
   */
  function executeBatch(
    address[] calldata dest,
    uint256[] calldata value,
    bytes[] calldata func
  ) external {
    _requireFromEntryPointOrOwner();
    require(
      dest.length == func.length &&
        (value.length == 0 || value.length == func.length),
      "wrong array lengths"
    );
    if (value.length == 0) {
      for (uint256 i = 0; i < dest.length; i++) {
        _call(dest[i], 0, func[i]);
      }
    } else {
      for (uint256 i = 0; i < dest.length; i++) {
        _call(dest[i], value[i], func[i]);
      }
    }
  }

  function initialize(
    string calldata _username,
    string calldata _domain
  ) public virtual initializer {
    _initialize(_username, _domain);
  }

  function _initialize(
    string calldata _username,
    string calldata _domain
  ) internal virtual {
    username = _username;
    domain = _domain;

    emit LedgerAccountInitialized(_entryPoint, factoryAddr, username, domain);
  }

  // Require the function call went through EntryPoint or owner
  function _requireFromEntryPointOrOwner() internal view {
    require(
      msg.sender == address(entryPoint()) || msg.sender == address(this),
      "account: not Owner or EntryPoint"
    );
  }

  function _call(address target, uint256 value, bytes memory data) internal {
    (bool success, bytes memory result) = target.call{ value: value }(data);
    if (!success) {
      assembly {
        revert(add(result, 32), mload(result))
      }
    }
  }

  /// implement template method of BaseAccount
  function _validateSignature(
    PackedUserOperation calldata userOp,
    bytes32 userOpHash
  ) internal virtual override returns (uint256 validationData) {
    return 0;
  }

  /**
   * check current account deposit in the entryPoint
   */
  function getDeposit() public view returns (uint256) {
    return entryPoint().balanceOf(address(this));
  }

  /**
   * deposit more funds for this account in the entryPoint
   */
  function addDeposit() public payable {
    entryPoint().depositTo{ value: msg.value }(address(this));
  }

  /**
   * withdraw value from the account's deposit
   * @param withdrawAddress target to send to
   * @param amount to withdraw
   */
  function withdrawDepositTo(
    address payable withdrawAddress,
    uint256 amount
  ) public onlyOwner {
    entryPoint().withdrawTo(withdrawAddress, amount);
  }

  function _authorizeUpgrade(address newImplementation) internal view override {
    (newImplementation);
    _onlyOwner();
  }
}
