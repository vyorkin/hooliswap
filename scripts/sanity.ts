import { ethers } from "hardhat";
import {
  Exchange,
  Exchange__factory,
  Token,
  Token__factory,
} from "../typechain";
import { fromUnit, fromWei } from "../utils";

const { ALCHEMY_RINKEBY_API_KEY, ACCOUNT1_PRIVATE_KEY } = process.env;
const { AAA_TOKEN, AAA_EXCHANGE } = process.env;

const provider = new ethers.providers.AlchemyProvider(
  "rinkeby",
  ALCHEMY_RINKEBY_API_KEY
);
const wallet = new ethers.Wallet(ACCOUNT1_PRIVATE_KEY!, provider);
const aaaToken: Token = Token__factory.connect(AAA_TOKEN!, wallet);
const aaaExchange: Exchange = Exchange__factory.connect(AAA_EXCHANGE!, wallet);

async function main() {
  const account1Wei = await wallet.getBalance();
  const account1Eth = ethers.utils.formatEther(account1Wei);
  const account1Tkn = await aaaToken.balanceOf(wallet.address);

  console.log("account1 balance: %s ETH, %s TKN", account1Eth, account1Tkn);

  const tknReserve = await aaaExchange.getTknReserve();
  const ethReserve = await provider.getBalance(aaaExchange.address);

  console.log(
    "aaa exchange reserve: %s ETH, %s TKN",
    fromWei(ethReserve),
    fromUnit(tknReserve)
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
