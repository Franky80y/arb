const { ethers } = require("ethers");
const Token = require("../artifacts/contracts/dybot.sol/Dybot.json");
require("dotenv").config();

// const provider = new ethers.providers.JsonRpcProvider(`https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`);
const provider = new ethers.providers.InfuraProvider("goerli");
const address = "0xB1eEB79bA0176Fd480443dDaB10fc53Ee2C95673"
const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(address, Token.abi, provider)
const contractWithSigner = contract.connect(signer);
const main = async () => {
  // const data = await contract.name()
  // console.log(data);
  const result = await contractWithSigner.getBalance("0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6");
  console.log('result of test', result);

  // await contractWithSigner.getBalance("0x2686eca13186766760A0347Ee8Eeb5a88710E11b");
  
  // await contractWithSigner.lock()
  // console.log(await contract.lockWhiteList("0xfB11f69093Fe71B72B9650cb4e1775bD89f19EeC"));
}
main();
