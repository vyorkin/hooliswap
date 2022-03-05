import { ethers } from "hardhat";
import {
  Exchange,
  Exchange__factory,
  Token,
  Token__factory,
} from "../typechain";
import { fromUnit, fromWei, toUnit, toWei } from "../utils";

const { ALCHEMY_ROPSTEN_API_KEY, ACCOUNT1_PRIVATE_KEY } = process.env;
const { AAA_TOKEN, AAA_EXCHANGE } = process.env;

const provider = new ethers.providers.AlchemyProvider(
  "ropsten",
  ALCHEMY_ROPSTEN_API_KEY
);
const wallet = new ethers.Wallet(ACCOUNT1_PRIVATE_KEY!, provider);
const aaaToken: Token = Token__factory.connect(AAA_TOKEN!, wallet);
const aaaExchange: Exchange = Exchange__factory.connect(AAA_EXCHANGE!, wallet);

async function main() {
  await printState();
  const tx = await aaaExchange.swapTknToEth(toUnit(1), toWei(0.2));
  await tx.wait(2);
  await printState();
}

async function printState() {
  const account1Wei = await wallet.getBalance();
  const account1Eth = fromWei(account1Wei);
  const account1Tkn = await aaaToken.balanceOf(wallet.address);
  console.log(
    "account1 balance: %s ETH, %s TKN",
    account1Eth,
    fromUnit(account1Tkn)
  );
  const tknReserve = await aaaExchange.getTknReserve();
  const ethReserve = await ethers.provider.getBalance(aaaExchange.address);
  console.log(
    "reserve: %s ETH, %s TKN",
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
