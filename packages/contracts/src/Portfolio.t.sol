// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Portfolio} from "./Portfolio.sol";

contract PortfolioTest {
    Portfolio portfolio;

    function setUp() public {
        portfolio = new Portfolio(address(this));
    }

    function test_InitialValue() public view {
        require(
            portfolio.owner() == address(this),
            "Owner should be set correctly"
        );
    }

    function test_CreateBasket() public {
        address[] memory tokens = new address[](2);
        tokens[0] = address(0x1);
        tokens[1] = address(0x2);

        uint[] memory percentages = new uint[](2);
        percentages[0] = 50;
        percentages[1] = 50;

        uint[] memory amounts = new uint[](2);
        amounts[0] = 100;
        amounts[1] = 200;

        portfolio.createBasket(tokens, percentages, amounts);
        // Add assertions to verify basket creation
    }

    function test_CreateBasket_InvalidPercentages() public {
        address[] memory tokens = new address[](2);
        tokens[0] = address(0x1);
        tokens[1] = address(0x2);

        uint[] memory percentages = new uint[](2);
        percentages[0] = 60;
        percentages[1] = 50; // Total = 110, should fail

        uint[] memory amounts = new uint[](2);
        amounts[0] = 100;
        amounts[1] = 200;

        // This should revert with "Percentages must sum to exactly 100"
        try portfolio.createBasket(tokens, percentages, amounts) {
            require(false, "Should have reverted");
        } catch Error(string memory reason) {
            require(
                keccak256(bytes(reason)) ==
                    keccak256(bytes("Percentages must sum to exactly 100")),
                "Wrong error message"
            );
        }
    }

    function test_CreateBasket_Under100Percentages() public {
        address[] memory tokens = new address[](2);
        tokens[0] = address(0x1);
        tokens[1] = address(0x2);

        uint[] memory percentages = new uint[](2);
        percentages[0] = 30;
        percentages[1] = 40; // Total = 70, should fail

        uint[] memory amounts = new uint[](2);
        amounts[0] = 100;
        amounts[1] = 200;

        // This should revert with "Percentages must sum to exactly 100"
        try portfolio.createBasket(tokens, percentages, amounts) {
            require(false, "Should have reverted");
        } catch Error(string memory reason) {
            require(
                keccak256(bytes(reason)) ==
                    keccak256(bytes("Percentages must sum to exactly 100")),
                "Wrong error message"
            );
        }
    }
}
