pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title AdminOwnerRoles
 * @dev The AdminOwnerRoles contract has an admin address, and provides
 * Owner and Admin roles authorization control.
 */
contract AdminOwnerRoles is Ownable {
    address private _admin;

    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);

    /**
     * @dev Constructor sets the admin role address.
     */
    constructor() internal {
        _admin = msg.sender;
        emit AdminChanged(address(0), _admin);
    }

    /**
     * @return the address of the admin account.
     */
    function admin() public view returns (address) {
        return _admin;
    }

    /**
     * @dev Throws if called by any account other than the admin.
     */
    modifier onlyAdmin() {
        require(isAdmin());
        _;
    }

    /**
     * @dev Throws if called by any account other than the admin or the owner.
     */
    modifier onlyAdminOrOwner() {
        require(isAdmin() || isOwner());
        _;
    }

    /**
     * @return true if `msg.sender` is the admin account.
     */
    function isAdmin() public view returns (bool) {
        return msg.sender == _admin;
    }

    /**
     * @dev Allows the owner to change admin account.
     * @param newAdmin The address of new admin account.
     */
    function changeAdmin(address newAdmin) public onlyOwner {
        require(newAdmin != address(0));

        emit AdminChanged(_admin, newAdmin);
        _admin = newAdmin;
    }
}
