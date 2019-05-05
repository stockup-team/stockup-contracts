pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";

/**
 * @title StockupShareToken
 * @dev ERC20 Token:
 * - has owner
 * - mintable (by owner)
 * - burnable (by owner)
 * - pausable
 * Token represents shares of company on stockup platform.
 */
contract StockupShareToken is ERC20Detailed, ERC20Pausable, Ownable {
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
     * @dev Function to mint tokens
     * @param to The address that will receive the minted tokens.
     * @param value The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address to, uint256 value) external onlyOwner returns (bool) {
        _mint(to, value);
        return true;
    }

    /**
     * @dev Burns a specific amount of tokens from minter address.
     * @param value The amount of token to be burned.
     */
    function burn(uint256 value) external onlyOwner {
        _burn(msg.sender, value);
    }
}
