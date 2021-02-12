pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Based on OpenZeppelin Whitelist & RBCA contracts
 * @dev The AccessControl contract provides different access for addresses, and provides basic authorization control functions.
 */
contract AccessControlled is AccessControl, Ownable {

  bytes32 public constant ROLE_NOT_REAL = keccak256('ROLE_NOT_REAL');
  bytes32 public constant ROLE_MINTER = keccak256('ROLE_MINTER');

  modifier onlyIfNotReal() {
    _onlyIfNotReal();
    _;
  }

  modifier onlyIfMinter() {
    _onlyIfMinter();
    _;
  }

  function _onlyIfNotReal()  internal view {
    require(_msgSender() == owner() || hasRole(ROLE_NOT_REAL, _msgSender()));
  }

  function _onlyIfMinter() internal view {
    require(_msgSender() == owner() || hasRole(ROLE_NOT_REAL, _msgSender()) || hasRole(ROLE_MINTER, _msgSender()));
  }


  ////////////////////////////////////
  // Whitelist/RBCA Derived Methods //
  ////////////////////////////////////

  function addAddressToAccessControl(address _operator, bytes32 _role)
  public
  onlyIfNotReal
  {
    grantRole(_role, _operator);
  }

  function removeAddressFromAccessControl(address _operator, bytes32 _role)
  public
  onlyIfNotReal
  {
    revokeRole(_role, _operator);
  }

}
