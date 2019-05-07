pragma solidity ^0.5.2;

import "./access/IssuerOwnerRoles.sol";

/**
 * @title StockupShareTokenManager
 * @dev Contract for managing a share-token.
 */
contract StockupShareTokenManager is IssuerOwnerRoles {
    // Investors whitelist
    mapping (address => bool) private _whitelist;

    /**
    * @dev Constructor.
    * @param issuer The address of issuer account
    */
    constructor(
        address issuer
    )
        public IssuerOwnerRoles(issuer)
    {

    }

    /**
     * @return is the investor in the whitelist.
     */
    function isWhitelisted(address account) public view returns (bool) {
        return _whitelist[account];
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
