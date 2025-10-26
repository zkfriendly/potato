// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {BasketFoundry} from "./BasketFoundry.sol";
import {Basket} from "./Basket.sol";

contract BasketFoundryTest is Test {
    BasketFoundry basketFoundry;

    address BTC_TOKEN = makeAddr("BTC");
    address ETH_TOKEN = makeAddr("ETH");

    bytes32 public constant BTC_PRICE_FEED_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    bytes32 public constant ETH_PRICE_FEED_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

    function setUp() public {
        basketFoundry = new BasketFoundry(address(new Basket()));

        // Fund the basket foundry with 1 ETH for testing
        vm.deal(address(basketFoundry), 1 ether);
    }

    function test_createBasket() public {
        address owner = makeAddr("owner");

        address[] memory tokens = new address[](2);
        tokens[0] = BTC_TOKEN;
        tokens[1] = ETH_TOKEN;

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 50;
        percentages[1] = 50;

        bytes32[] memory priceFeedIds = new bytes32[](2);
        priceFeedIds[0] = BTC_PRICE_FEED_ID;
        priceFeedIds[1] = ETH_PRICE_FEED_ID;

        address _basket = basketFoundry.createBasket(owner, tokens, percentages, priceFeedIds);

        assertEq(basketFoundry.getUserBaskets(owner)[0], _basket);
        assertEq(Basket(payable(_basket)).getTokensLength(), 2);

        (address[] memory _tokens, uint256[] memory _percentages) = Basket(payable(_basket)).getTokensInfo();

        assertEq(_tokens[0], BTC_TOKEN);
        assertEq(_tokens[1], ETH_TOKEN);
        assertEq(_percentages[0], 50);
        assertEq(_percentages[1], 50);

        // Verify the basket received 0.001 ETH
        assertEq(address(_basket).balance, 0.001 ether);
    }
}
