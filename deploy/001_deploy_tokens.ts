import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { toUnit } from "../utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const token = (name: string, desc: string) => ({
    from: deployer,
    args: [name, desc, toUnit(1000000)],
    log: true,
  });

  await deploy("Token", token("AAA", "AAA Token"));
  await deploy("Token", token("BBB", "BBB Token"));
  await deploy("Token", token("CCC", "CCC Token"));
};

export default func;
func.tags = ["Token"];
