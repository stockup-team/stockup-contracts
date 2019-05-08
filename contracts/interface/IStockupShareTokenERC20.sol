pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

/**
 * @title Interface of StockupShareToken with ERC20 compatibility
 */
contract IStockupShareTokenERC20 is IERC20 {
    function mint(address to, uint256 value) public returns (bool);

    function burn(uint256 value) public;

    function freeze(address account) public;

    function unfreeze(address account) public;

    function reissue(address from, address to) public returns (bool);

    function pause() public;

    function unpause() public;

    function isFrozen(address account) public view returns (bool);

    event Freeze(address indexed account);

    event Unfreeze(address indexed account);

    event Reissue(address indexed from, address indexed to, uint256 value);
}
