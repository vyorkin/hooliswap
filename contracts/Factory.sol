// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Exchange.sol";

contract Factory {
    mapping(address => address) public tokenToExchange;

    function createExchange(address tokenAddress) public returns (address) {
        require(tokenAddress != address(0), "invalid token address");
        require(
            tokenToExchange[tokenAddress] == address(0),
            "exchange already exists"
        );

        Exchange exchange = new Exchange(tokenAddress);
        tokenToExchange[tokenAddress] = address(exchange);

        return address(exchange);
    }

    function getExchange(address tokenAddress) public view returns (address) {
        return tokenToExchange[tokenAddress];
    }
}
