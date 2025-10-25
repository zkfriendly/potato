// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Basket} from "./Basket.sol";

contract BasketTest is Test {
    Basket basket;

    function setUp() public {
        address[] memory tokens = new address[](2);
        tokens[0] = makeAddr("BTC");
        tokens[1] = makeAddr("ETH");

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 50;
        percentages[1] = 50;

        bytes32[] memory priceFeedIds = new bytes32[](2);
        priceFeedIds[0] = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
        priceFeedIds[1] = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

        basket = new Basket(makeAddr("owner"), tokens, percentages, priceFeedIds);
    }

    function test_getTokensLength() public view {
        uint256 tokensLength = basket.getTokensLength();
        assertEq(tokensLength, 2);
    }

    function test_getTokens() public {
        address[] memory tokens = basket.getTokens();
        assertEq(tokens[0], makeAddr("BTC"));
        assertEq(tokens[1], makeAddr("ETH"));
    }

    function test_getTokensInfo() public {
        (address[] memory _tokens, uint256[] memory _percentages) = basket
            .getTokensInfo();
        assertEq(_tokens[0], makeAddr("BTC"));
        assertEq(_tokens[1], makeAddr("ETH"));
        assertEq(_percentages[0], 50);
        assertEq(_percentages[1], 50);
    }
}
