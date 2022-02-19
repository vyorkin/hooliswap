import { ethers } from "hardhat";
import {
  Exchange,
  Exchange__factory,
  Token,
  Token__factory,
} from "../typechain";
import { fromUnit, toUnit, toWei } from "../utils";

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
  console.log("reserve: %s TKN", fromUnit(tknReserve));

  await aaaToken.approve(aaaExchange.address, toUnit(2));

  const allowance = await aaaToken.allowance(
    wallet.address,
    aaaExchange.address
  );
  console.log("allowance: %s TKN", fromUnit(allowance));

  await aaaExchange.addLiquidity(toUnit(1), { value: toWei(0.5) });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
