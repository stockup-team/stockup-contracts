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
    uint8 public constant DECIMALS = 0;

    /**
     * @dev Constructor.
     * @param name Name of share-token
     * @param symbol Symbol of share-token
     */
    constructor (
        string memory name,
        string memory symbol
    )
        public
        ERC20Detailed(name, symbol, DECIMALS)
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
