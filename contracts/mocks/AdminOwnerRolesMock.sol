pragma solidity ^0.5.2;

import "../access/AdminOwnerRoles.sol";

contract AdminOwnerRolesMock is AdminOwnerRoles {
    constructor() public {}

    function onlyAdminFunction() public view onlyAdmin returns(bool) {
        return true;
    }

    function onlyAdminOrOwnerFunction() public view onlyAdminOrOwner returns(bool) {
        return true;
    }
}
