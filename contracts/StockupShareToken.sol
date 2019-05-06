pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

/**
 * @title StockupShareToken
 * @dev ERC20 Token:
 * - has owner
 * - mintable (by owner)
 * - burnable (by owner)
 * - freezable (by owner)
 * - reissued (by owner)
 * - pausable (by owner)
 * Token represents shares of company on stockup platform.
 */
contract StockupShareToken is ERC20, Ownable, ERC20Detailed {
    uint8 public constant DECIMALS = 0;

    // Frozen accounts
    mapping (address => bool) private _frozen;

    // Pause state
    bool private _paused;

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
     * Event for reissue tokens logging
     * @param from whose tokens will be canceled and reissued
     * @param to address where tokens will be reissued
     * @param value number of reissued tokens
     */
    event Reissue(address indexed from, address indexed to, uint256 value);

    event Paused();
    event Unpaused();

    /**
     * @dev Throws if account was frozen.
     */
    modifier whenNotFrozen(address account) {
        require(!isFrozen(account));
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused);
        _;
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
        _paused = false;
    }

    /**
    * @return true if given account was frozen.
    */
    function isFrozen(address account) public view returns (bool) {
        return _frozen[account];
    }

    /**
     * @return true if the contract is paused, false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev called by the owner to pause, triggers stopped state
     */
    function pause() public onlyOwner whenNotPaused {
        _paused = true;
        emit Paused();
    }

    /**
     * @dev called by the owner to unpause, returns to normal state
     */
    function unpause() public onlyOwner whenPaused {
        _paused = false;
        emit Unpaused();
    }

    /**
     * @dev Function to mint tokens
     * @param to The address that will receive the minted tokens.
     * @param value The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address to, uint256 value) public whenNotPaused onlyOwner returns (bool) {
        _mint(to, value);
        return true;
    }

    /**
     * @dev Burns a specific amount of tokens from minter address.
     * @param value The amount of token to be burned.
     */
    function burn(uint256 value) public whenNotPaused onlyOwner {
        _burn(msg.sender, value);
    }

    /**
     * @dev Freeze given account.
     * @param account The address that will be frozen.
     */
    function freeze(address account) public whenNotPaused whenNotFrozen(account) onlyOwner {
        require(account != address(0));

        _frozen[account] = true;

        emit Freeze(account);
    }

    /**
     * @dev Unfreeze given account.
     * @param account The address that will be unfrozen.
     */
    function unfreeze(address account) public whenNotPaused onlyOwner {
        require(account != address(0));
        require(isFrozen(account));

        _frozen[account] = false;

        emit Unfreeze(account);
    }

    function reissue(address from, address to) public whenNotPaused onlyOwner returns (bool) {
        uint256 value = balanceOf(from);
        _transfer(from, to, value);

        emit Reissue(from, to, value);
        return true;
    }

    // Override ERC20 methods
    function transfer(address to, uint256 value) public whenNotPaused whenNotFrozen(msg.sender) returns (bool) {
        return super.transfer(to, value);
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    )
        public whenNotPaused whenNotFrozen(msg.sender) returns (bool)
    {
        require(!isFrozen(from));

        return super.transferFrom(from, to, value);
    }

    function approve(address spender, uint256 value) public whenNotPaused whenNotFrozen(msg.sender) returns (bool) {
        return super.approve(spender, value);
    }

    function increaseAllowance(
        address spender,
        uint addedValue
    )
        public whenNotPaused whenNotFrozen(msg.sender) returns (bool success)
    {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(
        address spender,
        uint subtractedValue
    )
        public whenNotPaused whenNotFrozen(msg.sender) returns (bool success)
    {
        return super.decreaseAllowance(spender, subtractedValue);
    }
}
