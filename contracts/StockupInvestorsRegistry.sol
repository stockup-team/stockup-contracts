pragma solidity ^0.5.2;

import "./interface/IStockupInvestorsRegistry.sol";
import "./lifecycle/Pausable.sol";
import "./access/AdminOwnerRoles.sol";

/**
 * @title StockupInvestorsRegistry
 * @dev Registry of joined investors to stockup platform.
 */
contract StockupInvestorsRegistry is IStockupInvestorsRegistry, Pausable, AdminOwnerRoles {
    // Investors accounts
    mapping (address => bool) private _investors;

    /**
     * Event for add investor logging
     * @param account The address of new investors account.
     */
    event InvestorAdded(address indexed account);

    /**
     * Event for remove investor logging
     * @param account The address of investors account was removed.
     */
    event InvestorRemoved(address indexed account);

    /**
     * @dev Constructor
     */
    constructor() public {

    }

    /**
     * @dev Check investor registration status
     * @param account The address of new investors account.
     * @return true if account registered as investor.
     */
    function isInvestor(address account) public view returns(bool) {
        return _investors[account];
    }

    /**
    * @dev Add new investor to Registry
    * @param account The address of investors account.
    */
    function addInvestor(address account) external whenNotPaused onlyAdminOrOwner {
        require(account != address(0));
        require(!isInvestor(account));

        _investors[account] = true;
        emit InvestorAdded(account);
    }

    /**
    * @dev Remove investor from Registry
    * @param account The address of investors account.
    */
    function removeInvestor(address account) external whenNotPaused onlyOwner {
        require(account != address(0));
        require(isInvestor(account));

        _investors[account] = false;
        emit InvestorRemoved(account);
    }
}
