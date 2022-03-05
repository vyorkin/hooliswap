import { ethers } from "hardhat";
import { Token, Token__factory } from "../typechain";
import { toUnit, toWei } from "../utils";

const { ALCHEMY_ROPSTEN_API_KEY, ACCOUNT1_PRIVATE_KEY } = process.env;
const { AAA_TOKEN } = process.env;

const provider = new ethers.providers.AlchemyProvider(
  "ropsten",
  ALCHEMY_ROPSTEN_API_KEY
);
const signer = new ethers.Wallet(ACCOUNT1_PRIVATE_KEY!, provider);
const aaaToken: Token = Token__factory.connect(AAA_TOKEN!, signer);

async function main() {
  const account1Wei = await signer.getBalance();
  const account1Eth = ethers.utils.formatEther(account1Wei);
  const account1Tkn = await aaaToken.balanceOf(signer.address);

  console.log("account1 balance: %s ETH, %s TKN", account1Eth, account1Tkn);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
