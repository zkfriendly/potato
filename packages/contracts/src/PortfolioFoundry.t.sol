// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { PortfolioFoundry } from "./PortfolioFoundry.sol";

contract PortfolioFoundryTest {
    PortfolioFoundry portfolioFoundry;

    function setUp() public {
        portfolioFoundry = new PortfolioFoundry(address(this));
    }

    function test_InitialValue() public view {
        require(
            portfolioFoundry.owner() == address(this),
            "Owner should be set correctly"
        );
    }

    function test_CreatePortfolio() public {
        address portfolioOwner = address(0x1);
        address portfolio = portfolioFoundry.createPortfolio(portfolioOwner);
        require(portfolio != address(0), "Portfolio should be created");
        require(portfolioFoundry.userPortfolios(portfolioOwner) == portfolio, "Portfolio should be assigned to user");
    }
}