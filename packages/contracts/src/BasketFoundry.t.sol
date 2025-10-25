// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {BasketFoundry} from "./BasketFoundry.sol";
import {Basket} from "./Basket.sol";

contract BasketFoundryTest is Test {
    BasketFoundry basketFoundry;

    function setUp() public {
        basketFoundry = new BasketFoundry();
    }

    function test_createBasket() public {
        address owner = address(0x1);

        address[] memory tokens = new address[](2);
        tokens[0] = address(0x1);
        tokens[1] = address(0x2);

        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 50;
        percentages[1] = 50;

        address _basket = basketFoundry.createBasket(
            owner,
            tokens,
            percentages
        );

        assertEq(basketFoundry.getUserBaskets(owner)[0], _basket);
        assertEq(Basket(_basket).getTokensLength(), 2);

        (address[] memory _tokens, uint256[] memory _percentages) = Basket(
            _basket
        ).getTokensInfo();

        assertEq(_tokens[0], address(0x1));
        assertEq(_tokens[1], address(0x2));
        assertEq(_percentages[0], 50);
        assertEq(_percentages[1], 50);
    }
}
