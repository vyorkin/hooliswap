import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "solidity-coverage";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

import "./tasks/accounts";
import "./tasks/balance";
import "./tasks/block-number";

import dotenv from "dotenv";

dotenv.config();

const {
  ETHERSCAN_API_KEY,
  ALCHEMY_RINKEBY_API_URL,
  ALCHEMY_ROPSTEN_API_URL,
  ACCOUNT1_PRIVATE_KEY,
} = process.env;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {},
    rinkeby: {
      url: ALCHEMY_RINKEBY_API_URL,
      accounts: [`0x${ACCOUNT1_PRIVATE_KEY}`],
      gasMultiplier: 2,
      verify: {
        etherscan: {
          apiKey: ETHERSCAN_API_KEY!,
          apiUrl: "https://api-rinkeby.etherscan.io/",
        },
      },
    },
    ropsten: {
      url: ALCHEMY_ROPSTEN_API_URL,
      accounts: [`0x${ACCOUNT1_PRIVATE_KEY}`],
    },
  },
  namedAccounts: {
    deployer: 0,
    user: 1,
  },
  mocha: {
    timeout: 200000,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY!,
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY!,
    },
  },
  typechain: {
    outDir: "typechain",
  },
};

module.exports = config;
