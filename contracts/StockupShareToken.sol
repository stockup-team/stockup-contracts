pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";

/**
 * @title StockupShareToken
 * @dev ERC20 Token, mintable, pausable, burnable (self tokens by owner).
 * Token represents shares of company.
 */
contract StockupShareToken is ERC20Detailed, ERC20Mintable, ERC20Pausable {
    /**
     * @dev Constructor.
     * @param name Name of share-token
     * @param symbol Symbol of share-token
     * @param decimals Token decimals
     */
    constructor (
        string memory name,
        string memory symbol,
        uint8 decimals
    )
        public
        ERC20Detailed(name, symbol, decimals)
    {

    }

    /**
     * @dev Burns a specific amount of tokens from minter address.
     * @param value The amount of token to be burned.
     */
    function burn(uint256 value) external onlyMinter {
        _burn(msg.sender, value);
    }
}
