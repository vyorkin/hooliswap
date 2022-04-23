// import "@nomiclabs/hardhat-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { Token, Exchange } from "../typechain";
import { toWei, fromWei, toUnit, fromUnit } from "../utils";

const getBalance = ethers.provider.getBalance;

describe("Exchange", () => {
  let token: Token;
  let exchange: Exchange;

  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async () => {
    await deployments.fixture(["Token", "Exchange", "Factory"]);

    owner = await ethers.getNamedSigner("deployer");
    user = await ethers.getNamedSigner("user");

    token = await ethers.getContract("AAAToken", owner);
    exchange = await ethers.getContract("AAAExchange", owner);
  });

  it("is deployed", async () => {
    expect(await exchange.deployed()).to.equal(exchange);
    expect(await exchange.name()).to.equal("Hooliswap-V1");
    expect(await exchange.symbol()).to.equal("HOOLI-V1");
    expect(await exchange.totalSupply()).to.equal(toWei(0));
    expect(await exchange.factoryAddress()).to.equal(owner.address);
  });

  describe("addLiquidity", async () => {
    describe("empty reserves", async () => {
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

      it("mints LP tokens", async () => {
        await token.approve(exchange.address, toUnit(200));
        await exchange.addLiquidity(toUnit(200), { value: toWei(100) });

        expect(await getBalance(exchange.address)).to.equal(toWei(100));
        expect(await exchange.totalSupply()).to.eq(toWei(100));
      });

      it("allows zero amounts", async () => {
        await token.approve(exchange.address, 0);
        await exchange.addLiquidity(0, { value: 0 });

        expect(await getBalance(exchange.address)).to.equal(0);
        expect(await exchange.getTknReserve()).to.equal(0);
      });
    });

    describe("existing reserves", () => {
      beforeEach(async () => {
        await token.approve(exchange.address, toUnit(300));
        await exchange.addLiquidity(toUnit(200), { value: toWei(100) });
      });

      it("preserves exchange rate", async () => {
        // Should take only 100 of 200 TKN
        await exchange.addLiquidity(toUnit(200), { value: toWei(50) });

        expect(await getBalance(exchange.address)).to.equal(toWei(150));
        expect(await exchange.getTknReserve()).to.eq(toWei(300));
      });

      it("mints LP tokens", async () => {
        await exchange.addLiquidity(toUnit(200), { value: toWei(50) });

        expect(await exchange.balanceOf(owner.address)).to.eq(toWei(150));
        expect(await exchange.totalSupply()).to.eq(toWei(150));
      });

      it("fails when not enough tokens", async () => {
        await expect(
          exchange.addLiquidity(toUnit(50), { value: toWei(50) })
        ).to.be.revertedWith("insufficient token amount");
      });
    });
  });

  describe("removeLiquidity", async () => {
    beforeEach(async () => {
      await token.approve(exchange.address, toWei(300));
      await exchange.addLiquidity(toUnit(200), { value: toWei(100) });
    });

    it("removes some liquidity", async () => {
      const ethBefore = await getBalance(owner.address);
      const tknBefore = await token.balanceOf(owner.address);

      const lpAmount = 25;
      await exchange.removeLiquidity(toUnit(lpAmount));

      expect(await exchange.getTknReserve()).to.equal(toUnit(150));
      expect(await getBalance(exchange.address)).to.equal(toWei(75));

      const ethAfter = await getBalance(owner.address);
      const tknAfter = await token.balanceOf(owner.address);

      const ethDelta = fromWei(ethAfter.sub(ethBefore));
      expect(ethDelta).to.equal("24.9999220902971465"); // 25 - fee
      const tknDelta = fromUnit(tknAfter.sub(tknBefore));
      // (200 TKN, 100 ETH) => 25 LP = 50 TKN
      expect(tknDelta).to.equal((lpAmount * 2).toFixed(1).toString());
    });

    it("removes all liquidity", async () => {
      const ethBefore = await getBalance(owner.address);
      const tknBefore = await token.balanceOf(owner.address);

      const lpAmount = 100;
      await exchange.removeLiquidity(toUnit(lpAmount));

      expect(await exchange.getTknReserve()).to.equal(toUnit(0));
      expect(await getBalance(exchange.address)).to.equal(toWei(0));

      const ethAfter = await getBalance(owner.address);
      const tknAfter = await token.balanceOf(owner.address);

      const ethDelta = fromWei(ethAfter.sub(ethBefore));
      expect(ethDelta).to.equal("99.999937671209783"); // 100 - gas fee
      const tknDelta = fromUnit(tknAfter.sub(tknBefore));
      expect(tknDelta).to.equal((lpAmount * 2).toFixed(1).toString());
    });

    it("pays for provided liquidity", async () => {});

    it("burns LP-tokens", async () => {});

    it("doesn't allow invalid amount", async () => {});
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

  describe("transferEthToTkn", async () => {
    beforeEach(async () => {
      await token.approve(exchange.address, toUnit(2000));
      await exchange.addLiquidity(toUnit(2000), { value: toWei(1000) });
    });

    it("transfers at least min amount of tokens to recipent", async () => {
      const ethBefore = await getBalance(user.address);

      const amountMin = toUnit(1.97);
      await exchange
        .connect(user)
        .transferEthToTkn(amountMin, user.address, { value: toWei(1) });

      const ethAfter = await getBalance(user.address);
      const ethDelta = fromWei(ethAfter.sub(ethBefore));

      // The ratio is 1000 TKN / 2000 ETH = 1/2
      // We expect to get 2 TKN, so we spent only ~1 ETH
      expect(ethDelta).to.equal("-1.000075922451218032");

      const tknBalanceUser = await token.balanceOf(user.address);
      expect(fromUnit(tknBalanceUser)).to.equal("1.978041738678708079");

      const ethBalanceExchange = await getBalance(exchange.address);
      expect(fromWei(ethBalanceExchange)).to.equal("1001.0");

      const tknBalanceExchange = await token.balanceOf(exchange.address);
      expect(fromUnit(tknBalanceExchange)).to.equal("1998.021958261321291921");
    });
  });

  describe("swapEthToTkn", async () => {
    beforeEach(async () => {
      await token.approve(exchange.address, toUnit(2000));
      await exchange.addLiquidity(toUnit(2000), { value: toWei(1000) });
    });

    it("transfers at least min amount of tokens", async () => {});

    it("affects exchange rate", async () => {});

    it("fails when output amount is less than min amount", async () => {});

    it("allows zero swaps", async () => {});
  });

  describe("swapTknToEth", async () => {
    it("transfers at least min amount of tokens", async () => {});

    it("affects exchange rate", async () => {});

    it("fails when output amount is less than min amount", async () => {});

    it("allows zero swaps", async () => {});
  });

  describe("swapTknToTkn", async () => {
    it("swaps token for token", async () => {});
  });
});
