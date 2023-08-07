const XHR = require('xhr2-cookies').XMLHttpRequest
XHR.prototype._onHttpRequestError = function (request, error) {
  if (this._request !== request) {
      return;
  }
  // A new line
  console.log(error, 'request')
  this._setError();
  request.abort();
  this._setReadyState(XHR.DONE);
  this._dispatchProgress('error');
  this._dispatchProgress('loadend');
};


const Web3 = require("web3");
const { ethers } = require("ethers");
const axios = require("axios");
const Token = require("../artifacts/contracts/dybot.sol/Dybot.json");

require("dotenv").config();

const MIN_PERCENT = 0.9;
const MIN_PRICE_DIFF = 5.0;//$
const ARBITRAGE_ASSET = "0x65aFADD39029741B3b8f0756952C74678c9cEC93";
const ARBITRAGE_AMOUNT = "10000000";

//new connection method
const g_web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://mainnet.infura.io/v3/c7ce107ef7ed4daa918f51ab1067159d`
  )
);

// const provider = new ethers.providers.JsonRpcProvider(`https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`);
const provider = new ethers.providers.InfuraProvider("goerli"); //mainnet
const address = "0xA6d5a39Fe2D4a70cFFd32c9F1D73f0dB5122Ea7D"; // Dybot contract address
const signer = new ethers.Wallet(
  "b73f762c5fa6f1238b98b5fd5066a68b6ac2289c6c629d8000890c2519502f13",
  provider
);
const contract = new ethers.Contract(address, Token.abi, provider);
const contractWithSigner = contract.connect(signer);

const tokenAddress = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
};
const pools = [
  {
    contract: "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
    abi: [
      {
        constant: true,
        inputs: [],
        name: "getReserves",
        outputs: [
          { internalType: "uint112", name: "_reserve0", type: "uint112" },
          { internalType: "uint112", name: "_reserve1", type: "uint112" },
          {
            internalType: "uint32",
            name: "_blockTimestampLast",
            type: "uint32",
          },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ],
    symbol: "UNISWAP_DAI_ETH",
    label: "UNISWAP_DAI_ETH",
  },
  {
    contract: "0xC3D03e4F041Fd4cD388c549Ee2A29a9E5075882f",
    abi: [
      {
        constant: true,
        inputs: [],
        name: "getReserves",
        outputs: [
          { internalType: "uint112", name: "_reserve0", type: "uint112" },
          { internalType: "uint112", name: "_reserve1", type: "uint112" },
          {
            internalType: "uint32",
            name: "_blockTimestampLast",
            type: "uint32",
          },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ],
    symbol: "SUSHI_DAI_ETH",
    label: "SUSHI_DAI_ETH",
  },
  {
    contract: "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4",
    abi: [
      {
        stateMutability: "view",
        type: "function",
        name: "balances",
        inputs: [{ name: "arg0", type: "uint256" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    symbol: "crvUSDTWBTCWETH",
    label: "WETH-USDT-PAIR",
  },
  {
    contract: "0x6CA298D2983aB03Aa1dA7679389D955A4eFEE15C",
    abi: [
      {
        constant: true,
        inputs: [{ name: "who", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ],
    symbol: "Pancake-WETH-USDT",
    label: "Pancake-WETH-USDT",
  },
  {
    contract: "0x8faf958E36c6970497386118030e6297fFf8d275",
    abi: [
      {
        constant: true,
        inputs: [{ name: "who", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ],
    symbol: "SHIBASWAP-ETH-DAI",
    label: "SHIBASWAP-ETH-DAI",
  },
  {
    contract:'0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
    abi:[ ],
    symbol:'RHINOFI-ETH-DAI',
    label:'RHINOFI-ETH-DAI',
    
  },
  {
    contract:'0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
    abi:[],
    symbol:'MATCHA-ETH-USDT',
    label:'MATCHA-ETH-USDT',
    url:'https://api.coingecko.com/api/v3/coins/ethereum'
  },
  {
    contract:'0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
    abi:[],
    symbol:'VERSE-ETH-USDT',
    label:"VERSE-ETH-USDT",
    url: "https://subgraph.api.bitcoin.com/subgraphs/name/verse/exchange"
  },
  {
    contract:'',
    abi:[],
    symbol:'INTERPORT-ETH-USDT',
    label:'INTERPORT-ETH-USDT',
    url:'https://app.interport.fi/1/1/ETH/USDT'
  },
  {
    contract:'',
    abi:[],
    symbol:'CLIPPER-ETH-USDT',
    label:'CLIPPER-ETH-USDT',
    url:'https://api.clipper.exchange/rfq/quote'
  },

  // {
  //   contract:'0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
  //   abi:[],
  //   symbol:'FLASHFLOW-ETH-USDT',
  //   label:'FLASHFLOW-ETH-USDT',
  //   url:'https://swap.litedex.io/#/swaphttps://app.flashflow.org/'
  // }, // api rate
  
  

];

async function getPriceOnPool(pool) {
  let price = 2023.0;
  let tx_usdt = null,
    tx_eth = null,
    tx = null,
    result = null;
  let bal_usdt = 1.0,
    bal_eth = 2000.0;
  const contract = new g_web3.eth.Contract(pool.abi, pool.contract);
  let contract0, contract1;
  let response = null;
  switch (pool.symbol) {
    case "UNISWAP_DAI_ETH":
      tx = contract.methods.getReserves();
      result = await tx.call();
      price = result._reserve0 / result._reserve1;

      break;
    case "SUSHI_DAI_ETH":
      tx = contract.methods.getReserves();
      result = await tx.call();
      price = result._reserve0 / result._reserve1;

      break;
    case "crvUSDTWBTCWETH":
      tx_usdt = contract.methods.balances(0); //usdt
      bal_usdt = await tx_usdt.call();

      tx_eth = contract.methods.balances(2); //weth
      bal_eth = await tx_eth.call();

      price = (bal_usdt / bal_eth / 0.995) * Math.pow(10, 12); //Web3.utils.toWei('1', 'Ether');

      break;
    case "Pancake-WETH-USDT":
      response = await axios.get(
        `https://coins.llama.fi/prices/current/ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7`
      );
      price =
        response.data.coins[
          "ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        ].price;

      break;
    case "SHIBASWAP-ETH-DAI":
      response = await axios.post(
        `https://api.thegraph.com/subgraphs/name/shibaswaparmy/exchange`,
        {
          query: "{ bundle(id: 1, ) { ethPrice } }" 
        }
      );
      price = response.data.data.bundle.ethPrice;

      break;
      case "RHINOFI-ETH-DAI":
        response = await axios.get(`https://api.rhino.fi/market-data/getUsdtPrices`);
        price = response.data.ETH;
  
        break;  
    case "MATCHA-ETH-USDT":
      response = await axios.get(`https://api.coingecko.com/api/v3/coins/ethereum`);
      price = response.data['market_data'].current_price.usd;

      break;  
    case 'CLIPPER-ETH-USDT':
      response = await axios.post(`https://api.clipper.exchange/rfq/quote`, {
        chain_id:1,
        input_amount:"1000000000000000000",
        input_asset_symbol:"ETH",
        output_asset_symbol:"USDT",
        time_in_seconds:60
      });
      price = response.data.output_amount / Math.pow(10, 6);

      break;
    
    case 'VERSE-ETH-USDT':
      response = await axios.post(`https://subgraph.api.bitcoin.com/subgraphs/name/verse/exchange`,
      {
        query:`
        {
            pairs(orderBy: reserveUSD, orderDirection: desc) {
                id
                token0Price
                token1Price
                name
                reserveUSD
                totalSupply
                token0 {
                    derivedETH
                    name
                    symbol
                    id
                    decimals
                }
                token1 {
                    derivedETH
                    name
                    symbol
                    id
                    decimals
                }
            }
        }`
      }
      );
      const pairs = response.data.data.pairs;
      price = pairs.filter(pair=>pair.name === "WETH-USDT")[0].token1Price;
      break;
    // case 'FLASHFLOW-ETH-USDT':
    //   response = await axios.get(`https://proxy.flashflow.org/v1/coingecko/coins/weth`);
    //   price = response.data.market_data.current_price.usd;
    // break; // API RATE 

    case 'INTERPORT-ETH-USDT':
      response = await axios.get(`https://ethapi.openocean.finance/v2/1/swap?inTokenAddress=0x0000000000000000000000000000000000000000&outTokenAddress=0xdac17f958d2ee523a2206206994597c13d831ec7&amount=1000000000000000000&gasPrice=41832532053&slippage=50&referrer=0x7b2E3FC7510D1A51b3bef735F985446589219354&account=0x7b2E3FC7510D1A51b3bef735F985446589219354`);
      price = response.data.outAmount / Math.pow(10, 6);
    break;

    
    default:
      console.log("please check pool again");
  }
 
  if( typeof price !== 'string') { price = price.toString()};
  price = price.substring(0, 7);
  // console.log('price of eth on ' + pool.symbol, price);
  return price;
}
async function getArbitrage() {
  const priceList = [];
  let arbitrage = 0;
  //Get ETH price from POOLs
  let data = {
    maxprice_symbol: "",
    maxprice: 0,
    minprice_symbol: "",
    minprice: 10000,
  };

  // pools.map(async (pool)=>{
  for (const pool of pools) {
    const price = await getPriceOnPool(pool);
    priceList.push({ symbol: price });
    // console.log(pool.symbol, price);
    if (price !== 2023.0 && price >= data.maxprice) {
      data = {
        ...data,
        maxprice_symbol: pool.symbol,
        maxprice: price,
      };
    }
    if (price < data.minprice) {
      data = {
        ...data,
        minprice_symbol: pool.symbol,
        minprice: price,
      };
    }
  }

  arbitrage = (data.maxprice - data.minprice).toFixed(2);
  // console.log("arbitrage", arbitrage);

  const result_str = priceList.map(pool=>pool.symbol).join('    ') + '  ' + arbitrage;
  console.log(result_str);

  return arbitrage;
}
async function startArbitrage(asset, amount) {
  try {
    await contractWithSigner.flashloan(asset, amount);
  } catch (e) {
    console.log(e.message);
  }
}

async function init() {
  const header_str = pools.map(pool=>pool.symbol).join('  ') + '  Arbitrage($)';
  console.log(header_str);
  // const arbitrage = await getArbitrage(); // for testing
  setInterval(async () => {
    try {
      const arbitrage = await getArbitrage();
      if (arbitrage > MIN_PRICE_DIFF) {
        // console.log('start arbitrage');
        await startArbitrage(ARBITRAGE_ASSET, ARBITRAGE_AMOUNT);
      } else {
        // console.log('Arbitrage impossible');
      }
    } catch (e) {
      console.log(e.message);
    }
  }, 10000);
}
async function main() { 
  console.log("Bot is working now");
  init();
}

main();
