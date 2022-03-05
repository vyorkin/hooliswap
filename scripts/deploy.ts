import { ethers } from "hardhat";
import { toUnit } from "../utils";

async function main() {
  const [signer1] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("Token", signer1);
  const aaa = await Token.deploy("AAA Token", "AAA", toUnit(1000000));
  const bbb = await Token.deploy("BBB Token", "BBB", toUnit(1000000));
  const ccc = await Token.deploy("CCC Token", "CCC", toUnit(1000000));
  await Promise.all([aaa.deployed(), bbb.deployed(), ccc.deployed()]);

  console.log('AAA_TOKEN = "%s"', aaa.address);
  console.log('BBB_TOKEN = "%s"', bbb.address);
  console.log('CCC_TOKEN = "%s"', ccc.address);

  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.deployed();

  console.log('FACTORY = "%s"', factory.address);

  const Exchange = await ethers.getContractFactory("Exchange");
  const aaaExchange = await Exchange.deploy(aaa.address);
  const bbbExchange = await Exchange.deploy(aaa.address);
  await Promise.all([aaaExchange.deployed(), bbbExchange.deployed()]);

  console.log('AAA_EXCHANGE = "%s"', aaaExchange.address);
  console.log('BBB_EXCHANGE = "%s"', bbbExchange.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
