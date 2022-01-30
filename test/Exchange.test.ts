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
      expect(await exchange.getTknReserve()).to.equal(toUnit(200));
      // Exchange received 100 ETH
      expect(await getBalance(exchange.address)).to.equal(toWei(100));
    });
  });

  describe("getTknAmount", async () => {
    it("returns correct TKN amount", async () => {
      await token.approve(exchange.address, toUnit(200));
      // 200 TKN, 100 ETH
      await exchange.addLiquidity(toUnit(200), { value: toWei(100) });

      // (1 * 200) / (100 + 1) - fee
      // = 1.980198019801980198 - fee = 1.960590157441330824
      let tknOut = await exchange.getTknAmount(toWei(1));
      expect(fromUnit(tknOut.toString())).to.equal("1.960590157441330824");

      // slippage affects prices

      // (100 * 200) / (100 + 100) - fee
      // = 20000 / 200 - fee
      // = 100 - fee
      // = 99.497487437185929648
      tknOut = await exchange.getTknAmount(toWei(100));
      expect(fromUnit(tknOut.toString())).to.equal("99.497487437185929648");

      // (1000 * 200) / (100 + 1000) - fee
      // = 200000 / 1100 - fee
      // = 181.818181818181818181 - fee
      // = 181.651376146788990825
      tknOut = await exchange.getTknAmount(toWei(1000));
      expect(fromUnit(tknOut.toString())).to.equal("181.651376146788990825");
    });
  });

  describe("getEthAmount", async () => {
    it("returns correct ETH amount", async () => {
      await token.approve(exchange.address, toUnit(200));
      // 200 TKN, 100 ETH
      await exchange.addLiquidity(toUnit(200), { value: toWei(100) });

      // (2 * 100) / (200 + 2) - fee
      // = 0.990099009900990099 - fee
      // = 0.980295078720665412
      let ethOut = await exchange.getEthAmount(toUnit(2));
      expect(fromWei(ethOut.toString())).to.equal("0.980295078720665412");

      // (100 * 100) / (200 + 100) - fee
      // = 10000 / 300 - fee
      // = 33.333333333333333333 - fee
      // = 33.110367892976588628
      ethOut = await exchange.getEthAmount(toUnit(100));
      expect(fromWei(ethOut.toString())).to.equal("33.110367892976588628");

      // (2000 * 100) / (200 + 2000) - fee
      // = 200000 / 2200 - fee
      // = 90.90909090909090909 - fee
      // = 90.825688073394495412
      ethOut = await exchange.getEthAmount(toUnit(2000));
      expect(fromWei(ethOut.toString())).to.equal("90.825688073394495412");
    });
  });
});
