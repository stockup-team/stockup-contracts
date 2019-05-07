pragma solidity ^0.5.2;

import "../access/IssuerOwnerRoles.sol";

contract IssuerOwnerRolesMock is IssuerOwnerRoles {
    constructor(address issuer) public IssuerOwnerRoles(issuer) {}

    function onlyIssuerFunction() public view onlyIssuer returns(bool) {
        return true;
    }

    function onlyIssuerOrOwnerFunction() public view onlyIssuerOrOwner returns(bool) {
        return true;
    }
}
