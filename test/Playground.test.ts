import { expect } from "chai";
import { ethers } from "hardhat";
import { toWei } from "../utils";

const getBalance = ethers.provider.getBalance;

describe("Playground", () => {
  describe("BigNumber", () => {
    it("tests equality", async () => {
      const { user } = await ethers.getNamedSigners();
      const balance = await getBalance(user.address);
      expect(balance).to.equal(toWei(10000));
    });
  });
});
