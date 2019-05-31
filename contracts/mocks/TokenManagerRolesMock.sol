pragma solidity ^0.5.2;

import "../access/TokenManagerRoles.sol";

contract TokenManagerRolesMock is TokenManagerRoles {
    constructor(address admin) public TokenManagerRoles(admin) {}

    function onlyAdminFunction() public view onlyAdmin returns(bool) {
        return true;
    }

    function onlyAdminOrManagerFunction() public view onlyAdminOrManager returns(bool) {
        return true;
    }

    function onlyAdminOrOwnerFunction() public view onlyAdminOrOwner returns(bool) {
        return true;
    }

    function onlyAdminOrManagerOrOwnerFunction() public view onlyAdminOrManagerOrOwner returns(bool) {
        return true;
    }
}
