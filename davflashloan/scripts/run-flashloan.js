const Web3 = require("web3");
const abis = require("../abis/index.js");
require("dotenv").config();

const WETH_CONTRACT_ADDRESS="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDT_CONTRACT_ADDRESS="0xdAC17F958D2ee523a2206206994597C13D831ec7";
const DAI_CONTRACT_ADDRESS="0x6B175474E89094C44Da98b954EedeAC495271d0F";

const POOL_PANCAKE_ETH_USDT="0x6CA298D2983aB03Aa1dA7679389D955A4eFEE15C";


const g_network = process.env.ETHEREUM_NETWORK;
const g_web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://${g_network}.infura.io/v3/${process.env.INFURA_API_KEY}`
  )
);
const tokenPairs = [
  { "WBTC-USDC": "" },
  { "WBTC-DAI": "" },
  { "WBTC-USDT": "" },
  { "ETH-USDC": "" },
  { "ETH-DAI": "" },
  { "ETH-USDT": "" },
  { "LINK-USDC": "" },
  { "LINK-DAI": "" },
  { "LINK-USDT": "" },
];
async function testFlashloan() {
  console.log("Flashloan Testing is working now");
  try {
    const signer = g_web3.eth.accounts.privateKeyToAccount(
      process.env.SIGNER_PRIVATE_KEY
    );
    g_web3.eth.accounts.wallet.add(signer);

    const contract_address = "0x88288E4Ff8E4621Fc4Ef7bCfE817537465f857AE";
    const contract = new g_web3.eth.Contract(
      JSON.parse(abis.flash_abi),
      contract_address
    );
    // Issuing a transaction that calls the `echo` method
    const tx = contract.methods.flashloan(
      "0x2686eca13186766760A0347Ee8Eeb5a88710E11b",
      "1000000"
    );
    //const tx = contract.methods.balanceOf("0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11");
    const result = await tx.call();
    console.log("result of test", result);
    return result;
  } catch (error) {
    console.log(error.message);
  }
}

async function getCurveFiPrice () {
  try {
    const signer = g_web3.eth.accounts.privateKeyToAccount(
      process.env.SIGNER_PRIVATE_KEY
    );
    g_web3.eth.accounts.wallet.add(signer);

    const contract_weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const contract_usdt = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const address = "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46";
    const contract = new g_web3.eth.Contract(
      JSON.parse(abis.common_abi),
      contract_weth
    );
    // Issuing a transaction that calls the `echo` method
    const price = await contract.methods.balanceOf(address).call();

    const contract_1 = new g_web3.eth.Contract(
      JSON.parse(abis.common_abi),
      contract_usdt
    );
    // Issuing a transaction that calls the `echo` method
    const price_usdt = await contract_1.methods.balanceOf(address).call();

    
    console.log("result of test", price, price_usdt);
    return price_usdt / price;

  } catch (error) {
    console.log(error.message);
  }
}
async function PoolBalanceOf(pool_address, asset_address) {
  // 0x6CA298D2983aB03Aa1dA7679389D955A4eFEE15C
  const contract = new g_web3.eth.Contract(
    JSON.parse(abis.common_abi),
    asset_address
  );
  // Issuing a transaction that calls the `echo` method
  const price = await contract.methods.balanceOf(pool_address).call();
  return price;
}
async function main() {
  console.log("Testing is working now");
  // await testFlashloan();

  // const price = await test1inchswap();
  const price = await getCurveFiPrice();
  console.log("price", price);
  const eth_pancake = await PoolBalanceOf(POOL_PANCAKE_ETH_USDT, WETH_CONTRACT_ADDRESS);
  const usdt_pancake = await PoolBalanceOf(POOL_PANCAKE_ETH_USDT, USDT_CONTRACT_ADDRESS);
  const pancake_eth =  usdt_pancake / eth_pancake;
  console.log('pancake price of eth', pancake_eth);
}

main();
