pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title TokenManagerRoles
 */
contract TokenManagerRoles is Ownable {
    mapping (address => bool) private _admins;
    mapping (address => bool) private _managers;

    event AdminAdded(address indexed actor, address indexed account);
    event AdminRemoved(address indexed actor, address indexed account);
    event ManagerAdded(address indexed actor, address indexed account);
    event ManagerRemoved(address indexed actor, address indexed account);

    constructor(address admin) internal {
        require(admin != address(0));

        _admins[admin] = true;
        emit AdminAdded(address(0), admin);
    }

    modifier onlyAdmin() {
        require(isAdmin(msg.sender));
        _;
    }

    modifier onlyAdminOrManager() {
        require(isAdmin(msg.sender) || isManager(msg.sender));
        _;
    }

    modifier onlyAdminOrOwner() {
        require(isAdmin(msg.sender) || isOwner());
        _;
    }

    modifier onlyAdminOrManagerOrOwner() {
        require(isAdmin(msg.sender) || isManager(msg.sender) || isOwner());
        _;
    }

    function isAdmin(address account) public view returns (bool) {
        return _admins[account];
    }

    function isManager(address account) public view returns (bool) {
        return _managers[account];
    }

    function addAdmin(address account) public onlyAdmin {
        _admins[account] = true;
        emit AdminAdded(msg.sender, account);
    }

    function removeAdmin(address account) public onlyAdmin {
        require(account != msg.sender);

        _admins[account] = false;
        emit AdminRemoved(msg.sender, account);
    }

    function addManager(address account) public onlyAdmin {
        _managers[account] = true;
        emit ManagerAdded(msg.sender, account);
    }

    function removeManager(address account) public onlyAdmin {
        _managers[account] = false;
        emit ManagerRemoved(msg.sender, account);
    }
}
