import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "@nomiclabs/hardhat-waffle";
import { expect } from "chai";
import { ethers } from "hardhat";

const getBalance = ethers.provider.getBalance;
const initialBalance = ethers.constants.WeiPerEther.mul(10000);

describe("Playground", () => {
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
  });

  describe("BigNumber", () => {
    it("tests equality", async () => {
      const balance = await getBalance(user.address);
      expect(balance).to.equal("9998999940912990518509");
    });
  });
});
