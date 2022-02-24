import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, Address } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const exchange = (token_addr: Address) => ({
    contract: "Exchange",
    from: deployer,
    args: [token_addr],
    log: true,
  });

  const AAA = await deployments.get("AAAToken");
  const BBB = await deployments.get("BBBToken");
  const CCC = await deployments.get("CCCToken");

  await deploy("AAAExchange", exchange(AAA.address));
  await deploy("BBBExchange", exchange(BBB.address));
  await deploy("CCCExchange", exchange(CCC.address));
};

export default func;
func.tags = ["Exchange"];
func.dependencies = ["Token"];
