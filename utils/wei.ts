import { BigNumberish } from "ethers";
import { ethers } from "hardhat";

export const toUnit = (value: BigNumberish, decimals: BigNumberish = 18) =>
  ethers.utils.parseUnits(value.toString(), decimals);

export const fromUnit = (value: BigNumberish, decimals: BigNumberish = 18) =>
  ethers.utils.formatUnits(
    typeof value === "string" ? value : value.toString(),
    decimals
  );

export const toWei = (value: BigNumberish) =>
  ethers.utils.parseEther(value.toString());

export const fromWei = (value: BigNumberish) =>
  ethers.utils.formatEther(
    typeof value === "string" ? value : value.toString()
  );
