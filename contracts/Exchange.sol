// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// 1% LP fee
uint256 constant lpFee = 1;

interface IExchange {
    function transferEthToTkn(uint256 min, address recipient) external payable;

    function swapEthToTkn(uint256) external payable;
}

interface IFactory {
    function getExchange(address tokenAddress) external returns (address);
}

contract Exchange is ERC20 {
    address public tokenAddress;
    address public factoryAddress;

    constructor(address token) ERC20("Hooliswap-V1", "HOOLI-V1") {
        require(token != address(0), "invalid token address");

        tokenAddress = token;
        factoryAddress = msg.sender;
    }

    function addLiquidity(uint256 tknAmount) public payable returns (uint256) {
        // The amount of LP tokens is proportional to
        // the share of added liquidity (in ETH)

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

            require(tknAmount >= tknAmountActual, "insufficient token amount");

            IERC20 token = IERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), tknAmountActual);

            console.log("added %d TKN", tknAmountActual);

            // lp_minted = lp_total_supply * (eth_deposited / eth_reserve)
            uint256 liquidity = (totalSupply() * msg.value) / ethReserve;

            _mint(msg.sender, liquidity);

            console.log("minted %d HOOLI-V1", liquidity);

            return liquidity;
        }
    }

    function removeLiquidity(uint256 lpAmount)
        public
        returns (uint256, uint256)
    {
        require(lpAmount > 0, "invalid amount");

        // LP tokens exchanged back for liquidity + accumulates fees

        uint256 ethAmount = (address(this).balance * lpAmount) / totalSupply();
        uint256 tknAmount = (getTknReserve() * lpAmount) / totalSupply();

        _burn(msg.sender, lpAmount);

        payable(msg.sender).transfer(ethAmount);
        IERC20(tokenAddress).transfer(msg.sender, tknAmount);

        return (ethAmount, tknAmount);
    }

    function getTknReserve() public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // (x + ??x) * (y ??? ??y) = x * y
    // ??x - amount of tokens we're trading for ??y
    // ??y = (y * ??x) / (x + ??x)
    // x  - inputReserve
    // y  - outputReserve
    // ??x - inputAmount
    // ??y - outputAmount

    function getAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) private pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        // we take 1% fee

        // ??x' = ??x * ((100 - fee) / 100)
        // ??y  = (y * ??x') / (x * 100 + ??x')

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

    function transferEthToTkn(uint256 outputAmountMin, address recipient)
        public
        payable
    {
        uint256 tknReserve = getTknReserve();
        // We need to subtract msg.value from contract???s balance because
        // by the time the function is called the ethers sent have
        // already been added to its balance
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 outputAmount = getAmount(msg.value, ethReserve, tknReserve);

        require(outputAmount >= outputAmountMin, "insufficient output amount");

        IERC20(tokenAddress).transfer(recipient, outputAmount);
    }

    function swapEthToTkn(uint256 outputAmountMin) public payable {
        transferEthToTkn(outputAmountMin, msg.sender);
    }

    function swapTknToEth(uint256 inputAmount, uint256 outputAmountMin) public {
        uint256 tknReserve = getTknReserve();
        uint256 ethReserve = address(this).balance;
        uint256 outputAmount = getAmount(inputAmount, tknReserve, ethReserve);

        require(outputAmount >= outputAmountMin, "insufficient output amount");

        IERC20(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            inputAmount
        );
        payable(msg.sender).transfer(outputAmount);
    }

    function swapTknToTkn(
        uint256 inputAmount,
        uint256 outputAmountMin,
        address token
    ) public {
        address exchange = IFactory(factoryAddress).getExchange(token);
        require(
            exchange != address(this) && exchange != address(0),
            "invalid exchange address"
        );

        uint256 tknReserve = getTknReserve();
        uint256 ethReserve = address(this).balance;
        uint256 ethOutput = getAmount(inputAmount, tknReserve, ethReserve);

        IERC20(token).transferFrom(msg.sender, address(this), inputAmount);
        IExchange(exchange).transferEthToTkn{value: ethOutput}(
            outputAmountMin,
            msg.sender
        );
    }
}
