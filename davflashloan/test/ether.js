const { ethers } = require("ethers");
const Token = require("../artifacts/contracts/dybot.sol/Dybot.json")
// const provider = new ethers.providers.JsonRpcProvider(`https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`);
const provider = new ethers.providers.InfuraProvider("goerli");
const address = "0xDFeF9E674cbFB71d1a1416a08323A90677734070"
const signer = new ethers.Wallet("9b7e354c9eb2afc77dbe484907c84014a9d90f63699233a37314dbafaf0f5f5d", provider);
const contract = new ethers.Contract(address, Token.abi, provider)
const contractWithSigner = contract.connect(signer);
const main = async () => {
  // const data = await contract.name()
  // console.log(data);
  await contractWithSigner.swap("0x2686eca13186766760a0347ee8eeb5a88710e11b", "10000000000000")
  // await contractWithSigner.lock()
  // console.log(await contract.lockWhiteList("0xfB11f69093Fe71B72B9650cb4e1775bD89f19EeC"));
}
main();
