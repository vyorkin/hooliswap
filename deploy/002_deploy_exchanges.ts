import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const exchange = (token_addr: string) => ({
    from: deployer,
    args: [token_addr],
    log: true,
  });

  await deploy("Exchange", exchange(aaa.address));
  await deploy("Exchange", exchange(bbb.address));
};

export default func;
func.tags = ["Exchange"];
func.dependencies = ["Token"];
