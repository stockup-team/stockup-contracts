pragma solidity ^0.5.2;

import "./lifecycle/Pausable.sol";
import "./interface/IStockupInvestorsRegistry.sol";

contract StockupInvestorsRegistry is Pausable, IStockupInvestorsRegistry {
    mapping (address => bool) private _investors;

    constructor() public {

    }

    function isInvestor(address account) public view returns(bool) {
        return _investors[account];
    }

    function addInvestor(address account) public whenNotPaused onlyOwner {
        require(account != address(0));

        _investors[account] = true;
    }

    function removeInvestor(address account) public whenNotPaused onlyOwner {
        require(account != address(0));

        _investors[account] = false;
    }
}
