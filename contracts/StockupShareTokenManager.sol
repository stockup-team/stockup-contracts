pragma solidity ^0.5.2;

import "./access/IssuerOwnerRoles.sol";
import "./lifecycle/Pausable.sol";

/**
 * @title StockupShareTokenManager
 * @dev Contract for managing a share-token.
 */
contract StockupShareTokenManager is IssuerOwnerRoles, Pausable {
    // Investors whitelist
    mapping (address => bool) private _whitelist;

    bool private _verified;

    event IssuerVerified();

    /**
    * @dev Constructor.
    * @param issuer The address of issuer account
    */
    constructor(
        address issuer
    )
        public IssuerOwnerRoles(issuer)
    {
        _verified = false;
    }

    /**
     * @return is the investor in the whitelist.
     */
    function isWhitelisted(address account) public view returns (bool) {
        return _whitelist[account];
    }

    function isIssuerVerified() public view returns (bool) {
        return _verified;
    }

    function verify() public onlyOwner {
        _verified = true;
        emit IssuerVerified();
    }

    /**
     * @dev Adds single address to whitelist.
     * @param account Address to be added to the whitelist
     */
    function addToWhitelist(address account) public onlyIssuerOrOwner {
        _whitelist[account] = true;
    }

    /**
     * @dev Removes single address from whitelist.
     * @param account Address to be removed to the whitelist
     */
    function removeFromWhitelist(address account) public onlyIssuerOrOwner {
        _whitelist[account] = false;
    }
}
