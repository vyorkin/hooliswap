// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange {
    address public tokenAddress;

    constructor(address token) {
        require(token != address(0), "invalid token address");

        tokenAddress = token;
    }

    function addLiquidity(uint256 tokenAmount) public payable {
        IERC20 token = IERC20(tokenAddress);
        token.transferFrom(msg.sender, address(this), tokenAmount);
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

    function swapEthToTkn(uint256 minOutputAmount) public payable {
        uint256 tknReserve = getReserve();
        // We need to subtract msg.value from contract’s balance because
        // by the time the function is called the ethers sent have
        // already been added to its balance
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 outputAmount = getAmount(msg.value, ethReserve, tknReserve);

        require(outputAmount >= minOutputAmount, "insufficient output amount");

        IERC20(tokenAddress).transfer(msg.sender, outputAmount);
    }

    function swapTknToEth(uint256 inputAmount, uint256 minOutputAmount) public {
        uint256 tknReserve = getReserve();
        uint256 ethReserve = address(this).balance;
        uint256 outputAmount = getAmount(inputAmount, tknReserve, ethReserve);

        require(outputAmount >= minOutputAmount, "insufficient output amount");

        IERC20(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            inputAmount
        );
        payable(msg.sender).transfer(outputAmount);
    }
}
