pragma solidity ^0.5.2;

/**
 * @title Interface of StockupShareToken with ERC20 compatibility
 */
interface IStockupInvestorsRegistry {
    function isInvestor(address account) external view returns(bool);

    function addInvestor(address account) external;

    function removeInvestor(address account) external;
}
