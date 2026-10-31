// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract HelloWorld {
    string public message = "Hello, Solidity";

    function setMessage(string calldata newMessage) external {
        message = newMessage;
    }
}
