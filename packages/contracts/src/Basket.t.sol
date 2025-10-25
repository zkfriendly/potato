// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Basket} from "./Basket.sol";
import {IPyth} from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import {PythStructs} from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract BasketTest is Test {
    Basket basket;

    address BTC_TOKEN = makeAddr("BTC");
    address ETH_TOKEN = makeAddr("ETH");

    bytes32 public constant BTC_PRICE_FEED_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    bytes32 public constant ETH_PRICE_FEED_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

    mapping(address token => bytes32 priceFeedId) public prices;

    function setUp() public {
        address[] memory tokens = new address[](2);
        tokens[0] = BTC_TOKEN;
        tokens[1] = ETH_TOKEN;

        bytes32[] memory priceFeedIds = new bytes32[](2);
        priceFeedIds[0] = BTC_PRICE_FEED_ID;
        priceFeedIds[1] = ETH_PRICE_FEED_ID;

        prices[BTC_TOKEN] = BTC_PRICE_FEED_ID;
        prices[ETH_TOKEN] = ETH_PRICE_FEED_ID;

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 50;
        percentages[1] = 50;

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

    function test_getTokenPrice() public {
        bytes[] memory priceUpdates = getPriceUpdates();
        mockGetTokenPrice(BTC_TOKEN, 0.001 ether, priceUpdates);
        int64 price = basket.getTokenPrice{ value: 0.001 ether }(BTC_TOKEN, priceUpdates);
        assertEq(price, 0.001 ether);
    }

    function test_getBasketValue() public {
        bytes[][] memory priceUpdates = new bytes[][](2);
        priceUpdates[0] = getPriceUpdates();
        priceUpdates[1] = getPriceUpdates();
        mockGetTokenPrice(BTC_TOKEN, 0.001 ether, priceUpdates[0]);
        mockGetTokenPrice(ETH_TOKEN, 0.002 ether, priceUpdates[1]);
        int64 value = basket.getBasketValue(priceUpdates);
        assertEq(value, 0.003 ether);
    }

    function getPriceUpdates() public view returns (bytes[] memory) {
        bytes[] memory priceUpdates = new bytes[](1);
        priceUpdates[0] = hex"0000000000000000000000000000000000000000000000000000000000000000";
        return priceUpdates;
    }

    function mockGetTokenPrice(address _token, int64 _price, bytes[] memory _priceUpdates) public {
        vm.mockCall(
            address(IPyth(basket.PYTH_ADDRESS())),
            abi.encodeWithSelector(IPyth.getUpdateFee.selector, _priceUpdates),
            abi.encode(0.001 ether)
        );
        vm.mockCall(
            address(IPyth(basket.PYTH_ADDRESS())),
            abi.encodeWithSelector(IPyth.updatePriceFeeds.selector, _priceUpdates),
            abi.encode(true)
        );
        vm.mockCall(
            address(IPyth(basket.PYTH_ADDRESS())),
            abi.encodeWithSelector(IPyth.getPriceNoOlderThan.selector, prices[_token], 60),
            abi.encode(PythStructs.Price(_price, 0.1 ether, 18, block.timestamp))
        );
    }
}
