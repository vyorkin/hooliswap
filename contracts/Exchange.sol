// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// 1% LP fee
uint256 constant lpFee = 1;

contract Exchange is ERC20 {
    address public tokenAddress;

    constructor(address token) ERC20("Hooliswap-V1", "HOOLI-V1") {
        require(token != address(0), "invalid token address");

        tokenAddress = token;
    }

    function addLiquidity(uint256 tknAmount) public payable returns (uint256) {
        // LP_minted = LP_total_supply * (ETH_deposited / ETH_reserve)

        if (getTknReserve() == 0) {
            // If this is a new exchange (no liquidity) allow
            // an arbitrary liquidity proportion
            IERC20 token = IERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), tknAmount);

            uint256 liquidity = address(this).balance;
            _mint(msg.sender, liquidity);

            return liquidity;
        } else {
            // Otherwise enforce the established reserves proportion
            uint256 ethReserve = address(this).balance - msg.value;
            uint256 tknReserve = getTknReserve();
            // 10 TKN_r, 2 ETH_r
            // (5 TKN, 1 ETH): 1 ETH * 10 TKN_r / 2 ETH_r = 5 TKN (OK)
            // (2 TKN, 4 ETH): 4 ETH * 10 TKN_r / 2 ETH_r = 20 TKN (FAIL)
            uint256 tknAmountActual = (msg.value * tknReserve) / ethReserve;

            IERC20 token = IERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), tknAmountActual);

            uint256 liquidity = (totalSupply() * msg.value) / ethReserve;
            _mint(msg.sender, liquidity);

            return liquidity;
        }
    }

    function getTknReserve() public view returns (uint256) {
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

        // we take 1% fee

        // Δx' = Δx * ((100 - fee) / 100)
        // Δy  = (y * Δx') / (x * 100 + Δx')

        uint256 inputAmountWithFee = inputAmount * (100 - lpFee);
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = inputReserve * 100 + inputAmountWithFee;

        return numerator / denominator;
    }

    function getTknAmount(uint256 inputAmount) public view returns (uint256) {
        require(inputAmount > 0, "inputAmount is too small");
        uint256 tknReserve = getTknReserve();
        return getAmount(inputAmount, address(this).balance, tknReserve);
    }

    function getEthAmount(uint256 inputAmount) public view returns (uint256) {
        require(inputAmount > 0, "inputAmount is too small");
        uint256 tknReserve = getTknReserve();
        return getAmount(inputAmount, tknReserve, address(this).balance);
    }

    function swapEthToTkn(uint256 minOutputAmount) public payable {
        uint256 tknReserve = getTknReserve();
        // We need to subtract msg.value from contract’s balance because
        // by the time the function is called the ethers sent have
        // already been added to its balance
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 outputAmount = getAmount(msg.value, ethReserve, tknReserve);

        require(outputAmount >= minOutputAmount, "insufficient output amount");

        IERC20(tokenAddress).transfer(msg.sender, outputAmount);
    }

    function swapTknToEth(uint256 inputAmount, uint256 minOutputAmount) public {
        uint256 tknReserve = getTknReserve();
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
