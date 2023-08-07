// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { FlashLoanSimpleReceiverBase } from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import { IPoolAddressesProvider } from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapV2Router {
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface ISushiSwapRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract Dybot is FlashLoanSimpleReceiverBase {
    address payable public owner;
    address constant WETH_ADDRESS = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6; // mainnet 0x71C7656EC7ab88b098defB751B7401B5f6d8976F
    address constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant SUSHISWAP_ROUTER_ADDRESS = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
    address constant AAVE_ADDRESS = 0xC911B590248d127aD18546B186cC6B324e99F02c;

    IUniswapV2Router private uniswapRouter;
    ISushiSwapRouter private sushiswapRouter;

    uint256 public totalProfit;

    constructor() FlashLoanSimpleReceiverBase(IPoolAddressesProvider(AAVE_ADDRESS)) {
        uniswapRouter = IUniswapV2Router(UNISWAP_ROUTER_ADDRESS);
        sushiswapRouter = ISushiSwapRouter(SUSHISWAP_ROUTER_ADDRESS);
        owner = payable(msg.sender);
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        IERC20(WETH_ADDRESS).approve(address(UNISWAP_ROUTER_ADDRESS), amount);

        address[] memory path = new address[](2);
        path[0] = WETH_ADDRESS;
        path[1] = asset;

        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amount,
            0,
            path,
            address(this),
            block.timestamp
        );
        uint256 amountOut = amounts[1];

        IERC20(asset).approve(address(SUSHISWAP_ROUTER_ADDRESS), amountOut);
        path[0] = asset;
        path[1] = WETH_ADDRESS;

        uint256[] memory amounts_1 = sushiswapRouter.swapExactTokensForTokens(
            amountOut,
            0,
            path,
            address(this),
            block.timestamp
        );
        uint256 amountOut_1 = amounts_1[1];

        if (amountOut_1 > amount) {
            uint256 profit = amountOut_1 - amount;
            totalProfit += profit;
            emit ProfitMade(profit);

            IERC20(asset).transfer(owner, profit);
        }

        uint256 amountOwed = amount + premium;
        IERC20(asset).approve(address(POOL), amountOwed);

        return true;
    }

    function flashloan(address _address, uint256 _amountLoan) external {
        bytes memory params = "";
        uint16 referralCode = 0;
        POOL.flashLoanSimple(address(this), _address, _amountLoan, params, referralCode);
    }

    function getBalance(address _tokenAddress) external view returns (uint256) {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    function withdraw(address _tokenAddress) external onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        token.transfer(owner, token.balanceOf(address(this)));
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }

    event ProfitMade(uint256 amount);
}
