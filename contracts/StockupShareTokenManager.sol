pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "./access/IssuerOwnerRoles.sol";
import "./lifecycle/Pausable.sol";
import "./interface/IStockupInvestorsRegistry.sol";
import "./interface/IStockupShareTokenERC20.sol";

/**
 * @title StockupShareTokenManager
 * @dev Contract for managing a share-token with tokensale functions.
 */
contract StockupShareTokenManager is IssuerOwnerRoles, Pausable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for IStockupShareTokenERC20;

    // Investors whitelist
    mapping (address => bool) private _whitelist;

    // Issuer verification state
    bool private _verified;

    // The token being sold
    IStockupShareTokenERC20 private _token;

    // Address of accepted token's contract
    IERC20 private _acceptedToken;

    // How many token units a buyer gets per unit of accepted token
    uint256 private _rate;

    // Investors registry contract
    IStockupInvestorsRegistry _investorsRegistry;

    /**
     * Event issuer verification logging
     */
    event IssuerVerified();

    /**
     * Event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value accepted tokens units paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokensPurchased(
        address indexed purchaser,
        address indexed beneficiary,
        uint256 value,
        uint256 amount
    );

    /**
     * Event for add investor to whitelist logging
     * @param account who was added to whitelist
     */
    event WhitelistAdded(address indexed account);

    /**
     * Event for remove investor from whitelist logging
     * @param account who was removed from whitelist
     */
    event WhitelistRemoved(address indexed account);

    /**
    * @dev Constructor.
    * @param token Address of the token being sold
    * @param acceptedToken Address of the token being exchanged to token
    * @param investorsRegistry Address of investor registry contract
    * @param issuer The address of issuer account
    * @param rate Number of token units a buyer gets per accepted token's unit
    */
    constructor(
        IStockupShareTokenERC20 token,
        IERC20 acceptedToken,
        IStockupInvestorsRegistry investorsRegistry,
        address issuer,
        uint256 rate
    )
        public IssuerOwnerRoles(issuer)
    {
        require(address(token) != address(0));
        require(address(acceptedToken) != address(0));
        require(address(acceptedToken) != address(token));
        require(address(investorsRegistry) != address(0));
        require(rate > 0);

        _token = token;
        _acceptedToken = acceptedToken;
        _rate = rate;
        _investorsRegistry = investorsRegistry;

        _verified = false;
    }

    /**
     * @dev Fallback function. Reverts on sending ether.
     */
    function () external {
        revert();
    }

    /**
     * @return the token being sold.
     */
    function token() public view returns (IStockupShareTokenERC20) {
        return _token;
    }

    /**
     * @return accepted token's contract.
     */
    function acceptedToken() public view returns (IERC20) {
        return _acceptedToken;
    }

    /**
     * @return investors registry contract.
     */
    function investorsRegistry() public view returns (IStockupInvestorsRegistry) {
        return _investorsRegistry;
    }

    /**
     * @return the number of token units a buyer gets per accepted token's unit.
     */
    function rate() public view returns (uint256) {
        return _rate;
    }

    /**
     * @return is the investor in the whitelist.
     */
    function isWhitelisted(address account) public view returns (bool) {
        return _whitelist[account];
    }

    function isIssuerVerified() public view returns (bool) {
        return _verified;
    }

    modifier whenIssuerVerified() {
        require(_verified);
        _;
    }

    function verify() public onlyOwner {
        _verified = true;
        emit IssuerVerified();
    }

    /**
     * @dev Adds single address to whitelist.
     * @param account Address to be added to the whitelist
     */
    function addToWhitelist(address account) public onlyIssuerOrOwner {
        require(_investorsRegistry.isInvestor(account));

        _whitelist[account] = true;
        emit WhitelistAdded(account);
    }

    /**
     * @dev Removes single address from whitelist.
     * @param account Address to be removed to the whitelist
     */
    function removeFromWhitelist(address account) public onlyIssuerOrOwner {
        _whitelist[account] = false;
        emit WhitelistRemoved(account);
    }

    // Purchase functions

    /**
     * @dev Buy tokens.
     * @param amount Amount of tokens will be buy
     */
    function buyTokens(uint256 amount) external {
        buyTokensToBeneficiary(msg.sender, amount);
    }

    function buyTokensToBeneficiary(address beneficiary, uint256 amount) public whenIssuerVerified nonReentrant {
        _preValidatePurchase(beneficiary, amount);

        // How many tokens will be buy
        uint256 tokens = amount;

        // Calculate value of accepted tokens
        uint256 value = _fromToken(tokens);

        // Transfer accepted tokens from sender to this contract
        _acceptedToken.safeTransferFrom(msg.sender, address(this), value);

        // Process purchase
        _token.safeTransfer(beneficiary, tokens);
        emit TokensPurchased(msg.sender, beneficiary, value, tokens);
    }

    function transferTokensToBeneficiary(address beneficiary, uint256 amount) public onlyIssuer whenIssuerVerified {
        _preValidatePurchase(beneficiary, amount);

        _token.safeTransfer(beneficiary, amount);
        // emit TokensPurchased(msg.sender, beneficiary, value, tokens); // TODO: another event? Add note text
    }

    // Validate beneficiary and amount, freeze account for unverified investor
    function _preValidatePurchase(address beneficiary, uint256 amount) internal {
        require(beneficiary != address(0));
        require(_investorsRegistry.isInvestor(beneficiary));
        require(amount > 0);

        if(!isWhitelisted(beneficiary)) {
            if(!_token.isFrozen(beneficiary)) {
                _token.freeze(beneficiary);
            }
        }
    }

    function withdraw(address to, uint256 value) public onlyIssuer whenIssuerVerified {
        require(to != address(0));
        require(value > 0);

        _acceptedToken.safeTransfer(to, value);
    }


    // Manage token functions

    function mintTokens(uint256 value) public onlyIssuer whenIssuerVerified {
        require(value > 0);

        require(_token.mint(address(this), value));
    }

    function burnTokens(uint256 value) public onlyIssuer whenIssuerVerified {
        require(value > 0);

        _token.burn(value);
    }

    function freezeTokens(address account) public onlyIssuer whenIssuerVerified {
        require(_investorsRegistry.isInvestor(account));

        _token.freeze(account);
    }

    function unfreezeTokens(address account) public onlyIssuer whenIssuerVerified {
        require(_investorsRegistry.isInvestor(account));

        _token.unfreeze(account);
    }

    function reissueTokens(address from, address to) public onlyIssuer whenIssuerVerified {
        require(_token.reissue(from, to));
    }

    function pauseToken() public onlyIssuer whenIssuerVerified {
        _token.pause();
    }

    function unpauseToken() public onlyIssuer whenIssuerVerified {
        _token.unpause();
    }

    // Internal helpers functions

    /**
     * @dev Converts accepted tokens to tokens for sale.
     * @param value Value of accepted tokens will be convert
     */
    function _toToken(uint256 value) internal view returns (uint256) {
        return _rate > 1 ? value.mul(_rate) : value;
    }

    /**
     * @dev Converts tokens for sale to accepted tokens.
     * @param amount Value of tokens for sale will be convert
     */
    function _fromToken(uint256 amount) internal view returns (uint256) {
        return _rate > 1 ? amount.div(_rate) : amount;
    }
}
