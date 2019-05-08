pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "./access/IssuerOwnerRoles.sol";
import "./lifecycle/Pausable.sol";
import "./interface/IStockupInvestorsRegistry.sol";
import "./interface/IStockupShareTokenERC20.sol";

/**
 * @title StockupShareTokenManager
 * @dev Contract for managing a share-token.
 */
contract StockupShareTokenManager is IssuerOwnerRoles, Pausable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Investors whitelist
    mapping (address => bool) private _whitelist;

    bool private _verified;

    // The token being sold
    IStockupShareTokenERC20 private _token;

    // Address of accepted token's contract
    IERC20 private _acceptedToken;

    // Address where funds are collected
    address private _issuerWallet;

    // How many token units a buyer gets per unit of accepted token
    uint256 private _rate;

    IStockupInvestorsRegistry _investorsRegistry;


    event IssuerVerified();

    /**
    * @dev Constructor.
    * @param token Address of the token being sold
    * @param acceptedToken Address of the token being exchanged to token
    * @param investorsRegistry Address of investor registry contract
    * @param issuer The address of issuer account
    * @param issuerWallet Address where collected funds will be forwarded to
    * @param rate Number of token units a buyer gets per accepted token's unit
    */
    constructor(
        IStockupShareTokenERC20 token,
        IERC20 acceptedToken,
        IStockupInvestorsRegistry investorsRegistry,
        address issuer,
        address issuerWallet,
        uint256 rate
    )
        public IssuerOwnerRoles(issuer)
    {
        require(address(token) != address(0));
        require(address(acceptedToken) != address(0));
        require(address(acceptedToken) != address(token));
        require(address(investorsRegistry) != address(0));
        require(issuerWallet != address(0));
        require(rate > 0);

        _token = token;
        _acceptedToken = acceptedToken;
        _issuerWallet = issuerWallet;
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
     * @return the address where funds are collected.
     */
    function issuerWallet() public view returns (address) {
        return _issuerWallet;
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
        _whitelist[account] = true;
    }

    /**
     * @dev Removes single address from whitelist.
     * @param account Address to be removed to the whitelist
     */
    function removeFromWhitelist(address account) public onlyIssuerOrOwner {
        _whitelist[account] = false;
    }

    /**
     * @dev Set new issuer wallet address.
     * @param newIssuerWallet New address where collected funds will be forwarded to
     */
    function changeIssuerWallet(address newIssuerWallet) onlyIssuer public {
        require(newIssuerWallet != address(0));

        _issuerWallet = newIssuerWallet;
    }

    /**
     * @dev Buy tokens.
     * @param amount Amount of tokens will be buy
     */
    function buyTokens(uint256 amount) external {
        buyTokensToBeneficiary(amount, msg.sender);
    }

    /**
     * @dev Buy tokens for a given beneficiary.
     * @param amount Amount of tokens will be buy
     * @param beneficiary Recipient of the token purchase
     */
    function buyTokensToBeneficiary(uint256 amount, address beneficiary) public whenIssuerVerified nonReentrant {
        require(_investorsRegistry.isInvestor(beneficiary));

        if(!isWhitelisted(beneficiary)) {
            if(!_token.isFrozen(beneficiary)) {
                _token.freeze(beneficiary);
            }
        }

        // TODO: transferFrom stable tokens
        // TODO: transfer tokens, excess, calculate available tokens (with frozen tokens for unverified investors)
    }

    function mint(uint256 value) public onlyIssuer {
        require(value > 0);

        _token.mint(address(this), value);
    }

    function burn(uint256 value) public onlyIssuer {
        require(value > 0);

        _token.burn(value);
    }

    function transferTokensToBeneficiary(uint256 value, address beneficiary) public onlyIssuer whenIssuerVerified {
        require(_investorsRegistry.isInvestor(beneficiary));

        // require(isWhitelisted(beneficiary));
    }

    function freeze(address account) public onlyIssuer whenIssuerVerified {
        require(_investorsRegistry.isInvestor(account));

        _token.freeze(account);
    }

    function unfreeze(address account) public onlyIssuer whenIssuerVerified {
        require(_investorsRegistry.isInvestor(account));

        _token.unfreeze(account);
    }


}
