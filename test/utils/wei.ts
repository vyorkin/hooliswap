import { BigNumberish } from "ethers";
import { ethers } from "hardhat";

export const toUnit = (value: number | string, decimals: BigNumberish = 18) =>
  ethers.utils.parseUnits(value.toString(), decimals);

export const fromUnit = (value: number | string, decimals: BigNumberish = 18) =>
  ethers.utils.formatUnits(
    typeof value === "string" ? value : value.toString(),
    decimals
  );

export const toWei = (value: number | string) =>
  ethers.utils.parseEther(value.toString());

export const fromWei = (value: number | string) =>
  ethers.utils.formatEther(
    typeof value === "string" ? value : value.toString()
  );
