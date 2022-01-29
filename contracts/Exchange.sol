// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange {
    address public tokenAddress;

    constructor(address _token) {
        require(_token != address(0), "invalid token address");

        tokenAddress = _token;
    }

    function addLiquidity(uint256 _tokenAmount) public payable {
        IERC20 token = IERC20(tokenAddress);
        token.transferFrom(msg.sender, address(this), _tokenAmount);
    }

    function getReserve() public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // (x + Δx) * (y − Δy) = x * y
    // Δx - amount of tokens we're trading for Δy
    // Δy = (y * Δx) / (x + Δx)
    // x  - inputReserve
    // y  - outputReserve
    // Δx - inputAmount
    // Δy - outputAmount

    function getAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) private pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
        return (inputAmount * outputReserve) / (inputReserve + inputAmount);
    }

    function getTknAmount(uint256 inputAmount) public view returns (uint256) {
        require(inputAmount > 0, "inputAmount is too small");
        uint256 tknReserve = getReserve();
        return getAmount(inputAmount, address(this).balance, tknReserve);
    }

    function getEthAmount(uint256 inputAmount) public view returns (uint256) {
        require(inputAmount > 0, "inputAmount is too small");
        uint256 tknReserve = getReserve();
        return getAmount(inputAmount, tknReserve, address(this).balance);
    }

    function getPrice(uint256 inputReserve, uint256 outputReserve)
        public
        pure
        returns (uint256)
    {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
        return (inputReserve * 1000) / outputReserve;
    }
}
