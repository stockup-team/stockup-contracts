pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title IssuerOwnerRoles
 * @dev The IssuerOwnerRoles contract has an issuer address, and provides
 * Owner and Issuer roles authorization control.
 */
contract IssuerOwnerRoles is Ownable {
    address private _issuer;

    event IssuerChanged(address indexed previousIssuer, address indexed newIssuer);

    /**
     * @dev Constructor sets the issuer role address.
     */
    constructor(address issuer) internal {
        require(issuer != address(0));

        _issuer = issuer;
        emit IssuerChanged(address(0), _issuer);
    }

    /**
     * @return the address of the issuer account.
     */
    function issuer() public view returns (address) {
        return _issuer;
    }

    /**
     * @dev Throws if called by any account other than the issuer.
     */
    modifier onlyIssuer() {
        require(isIssuer());
        _;
    }

    /**
     * @dev Throws if called by any account other than the issuer or the owner.
     */
    modifier onlyIssuerOrOwner() {
        require(isIssuer() || isOwner());
        _;
    }

    /**
     * @return true if `msg.sender` is the issuer account.
     */
    function isIssuer() public view returns (bool) {
        return msg.sender == _issuer;
    }

    /**
     * @dev Allows the owner to change issuer account.
     * @param newIssuer The address of new issuer account.
     */
    function changeIssuer(address newIssuer) public onlyOwner {
        require(newIssuer != address(0));

        emit IssuerChanged(_issuer, newIssuer);
        _issuer = newIssuer;
    }
}
