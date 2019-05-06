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

    // Frozen accounts
    mapping (address => bool) private _frozen;

    /**
     * Event for account freeze logging
     * @param account that was frozen
     */
    event Freeze(address indexed account);

    /**
     * Event for account unfreeze logging
     * @param account that was unfrozen
     */
    event Unfreeze(address indexed account);

    /**
     * @dev Throws if account was frozen.
     */
    modifier whenNotFrozen(address account) {
        require(!isFrozen(account));
        _;
    }

    /**
    * @return true if given account was frozen.
    */
    function isFrozen(address account) public view returns (bool) {
        return _frozen[account];
    }

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
    function mint(address to, uint256 value) public onlyOwner returns (bool) {
        _mint(to, value);
        return true;
    }

    /**
     * @dev Burns a specific amount of tokens from minter address.
     * @param value The amount of token to be burned.
     */
    function burn(uint256 value) public onlyOwner {
        _burn(msg.sender, value);
    }

    /**
     * @dev Freeze given account.
     * @param account The address that will be frozen.
     */
    function freeze(address account) public whenNotFrozen(account) onlyOwner {
        require(account != address(0));

        _frozen[account] = true;

        emit Freeze(account);
    }

    /**
     * @dev Unfreeze given account.
     * @param account The address that will be unfrozen.
     */
    function unfreeze(address account) public onlyOwner {
        require(account != address(0));
        require(isFrozen(account));

        _frozen[account] = false;

        emit Unfreeze(account);
    }

    // Override ERC20 methods
    function transfer(address to, uint256 value) public whenNotFrozen(msg.sender) returns (bool) {
        return super.transfer(to, value);
    }

    function transferFrom(address from, address to, uint256 value) public whenNotFrozen(msg.sender) returns (bool) {
        require(!isFrozen(from));

        return super.transferFrom(from, to, value);
    }

    function approve(address spender, uint256 value) public whenNotFrozen(msg.sender) returns (bool) {
        return super.approve(spender, value);
    }

    function increaseAllowance(
        address spender,
        uint addedValue
    )
        public whenNotFrozen(msg.sender) returns (bool success)
    {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(
        address spender,
        uint subtractedValue
    )
        public whenNotFrozen(msg.sender) returns (bool success)
    {
        return super.decreaseAllowance(spender, subtractedValue);
    }
}
