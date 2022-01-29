import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "@nomiclabs/hardhat-waffle";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { Token, Exchange } from "../typechain";
import { toWei, fromWei, toUnit, fromUnit } from "./utils";

const getBalance = ethers.provider.getBalance;

describe("Exchange", () => {
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  let token: Token;
  let exchange: Exchange;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("Token");
    token = await tokenFactory.deploy("Token", "TKN", toUnit(1000000));
    await token.deployed();

    const exchangeFactory = await ethers.getContractFactory("Exchange");
    exchange = await exchangeFactory.deploy(token.address);
    await exchange.deployed();
  });

  it("is deployed", async () => {
    expect(await exchange.deployed()).to.equal(exchange);
  });

  describe("addLiquidity", async () => {
    it("adds liquidity", async () => {
      // Approve spending of 200 TKN
      await token.approve(exchange.address, toUnit(200));
      // Deposit 200 TKN and 100 ETH
      await exchange.addLiquidity(toUnit(200), { value: toWei(100) });
      // Exchange received 200 TKN
      expect(await exchange.getReserve()).to.equal(toUnit(200));
      // Exchange received 100 ETH
      expect(await getBalance(exchange.address)).to.equal(toWei(100));
    });
  });

  describe("getPrice", async () => {
    it("returns correct prices", async () => {
      await token.approve(exchange.address, toUnit(2000));
      await exchange.addLiquidity(toUnit(2000), { value: toWei(1000) });

      const etherReserve = await getBalance(exchange.address);
      const tokenReserve = await exchange.getReserve();

      // getPrice: (in * 1000) / out

      // 1000000 / 2000 = 500
      const ethPerTkn = await exchange.getPrice(etherReserve, tokenReserve);
      // 2000000 / 1000 = 2000
      const tknPerEth = await exchange.getPrice(tokenReserve, etherReserve);

      expect(ethPerTkn.toString()).to.eq("500");
      expect(tknPerEth.toString()).to.eq("2000");
    });
  });

  describe("getTknAmount", async () => {
    it("returns correct TKN amount", async () => {
      await token.approve(exchange.address, toUnit(200));
      // 200 TKN, 100 ETH
      await exchange.addLiquidity(toUnit(200), { value: toWei(100) });

      // (1 * 200) / (100 + 1) = 1.980198019801980198
      let tknOut = await exchange.getTknAmount(toWei(1));
      expect(fromUnit(tknOut.toString())).to.equal("1.980198019801980198");

      // slippage affects prices

      // (100 * 200) / (100 + 100) = 20000 / 200 = 100.0
      tknOut = await exchange.getTknAmount(toWei(100));
      expect(fromUnit(tknOut.toString())).to.equal("100.0");

      // (1000 * 200) / (100 + 1000) = 200000 / 1100 = 181.818181818181818181
      tknOut = await exchange.getTknAmount(toWei(1000));
      expect(fromUnit(tknOut.toString())).to.equal("181.818181818181818181");
    });
  });

  describe("getEthAmount", async () => {
    it("returns correct ETH amount", async () => {
      await token.approve(exchange.address, toUnit(200));
      // 200 TKN, 100 ETH
      await exchange.addLiquidity(toUnit(200), { value: toWei(100) });

      // (2 * 100) / (200 + 2) = 0.990099009900990099
      let ethOut = await exchange.getEthAmount(toUnit(2));
      expect(fromWei(ethOut.toString())).to.equal("0.990099009900990099");

      // (100 * 100) / (200 + 100) = 10000 / 300 = 33.333333333333333333
      ethOut = await exchange.getEthAmount(toUnit(100));
      expect(fromWei(ethOut.toString())).to.equal("33.333333333333333333");

      // (2000 * 100) / (200 + 2000) = 200000 / 2200 = 90.90909090909090909
      ethOut = await exchange.getEthAmount(toUnit(2000));
      expect(fromWei(ethOut.toString())).to.equal("90.90909090909090909");
    });
  });
});
