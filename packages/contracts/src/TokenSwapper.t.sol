// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { TokenSwapper } from "../src/TokenSwapper.sol";
    
contract TokenSwapperTest is Test {
    TokenSwapper swapper;
    address public constant SWAP_ROUTER = 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E;

    function setUp() public {
        swapper = new TokenSwapper(SWAP_ROUTER);
    }

    function test_swapExactInputSingle() public {
        address tokenIn = makeAddr("WETH");
        address tokenOut = makeAddr("USDC");
        uint24 fee = 3000;
        uint256 amountIn = 1 ether;
        uint256 amountOutMinimum = 0;
        uint256 deadline = block.timestamp + 1 hours;
    }

    function test_swapExactOutputSingle() public {
        address tokenIn = makeAddr("WETH");
        address tokenOut = makeAddr("USDC");
        uint24 fee = 3000;
        uint256 amountOut = 1 ether;
        uint256 amountInMaximum = 1 ether;
        uint256 deadline = block.timestamp + 1 hours;
    }

}
