pragma solidity ^0.5.2;

/**
 * @title Interface of StockupShareToken with ERC20 compatibility
 */
interface IStockupShareTokenERC20 {
    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function mint(address to, uint256 value) external returns (bool);

    function burn(uint256 value) external;

    function freeze(address account) external;

    function unfreeze(address account) external;

    function reissue(address from, address to) external;

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    function isFrozen(address account) external view returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);

    event Freeze(address indexed account);

    event Unfreeze(address indexed account);

    event Reissue(address indexed from, address indexed to, uint256 value);
}
