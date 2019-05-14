pragma solidity ^0.5.2;

import "../lifecycle/Pausable.sol";

contract PausableMock is Pausable {
    constructor() public {}

    function whenPausedFunction() public view whenPaused returns(bool) {
        return true;
    }

    function whenNotPausedFunction() public view whenNotPaused returns(bool) {
        return true;
    }
}
