import { ethers } from "hardhat";
import {
  Exchange,
  Exchange__factory,
  Token,
  Token__factory,
} from "../typechain";
import { fromUnit, fromWei } from "../utils";

// account1 balance: 0.12085861021542516 ETH, 999999.405490886175285066 AAA, 0.5 LP
// reserve: 0.851256281407035176 ETH, 0.594509113824714934 AAA
// account1 balance: 0.971993681621587624 ETH, 1000000.0 AAA, 0.0 LP
// reserve: 0.0 ETH, 0.0 AAA

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
  await printState();
  const account1Lp = await aaaExchange.balanceOf(wallet.address);
  const tx = await aaaExchange.removeLiquidity(account1Lp);
  await tx.wait(2);
  await printState();
}

async function printState() {
  const account1Wei = await wallet.getBalance();
  const account1Eth = fromWei(account1Wei);
  const account1Aaa = await aaaToken.balanceOf(wallet.address);
  const account1Lp = await aaaExchange.balanceOf(wallet.address);
  console.log(
    "account1 balance: %s ETH, %s AAA, %s LP",
    account1Eth,
    fromUnit(account1Aaa),
    fromUnit(account1Lp)
  );
  const tknReserve = await aaaExchange.getTknReserve();
  const ethReserve = await provider.getBalance(aaaExchange.address);
  console.log(
    "reserve: %s ETH, %s AAA",
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
