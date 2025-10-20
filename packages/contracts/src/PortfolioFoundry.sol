// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Portfolio } from "./Portfolio.sol";


contract PortfolioFoundry {
    address public owner;
    mapping(address => address) public userPortfolios;

    constructor(address _owner) {
        owner = _owner;
    }

    event PortfolioCreated(address indexed portfolio);

    function createPortfolio(address _portfolioOwner) external returns (address) {
        require(userPortfolios[_portfolioOwner] == address(0), "User already has a portfolio");

        Portfolio portfolio = new Portfolio(_portfolioOwner);
        userPortfolios[_portfolioOwner] = address(portfolio);
        emit PortfolioCreated(address(portfolio));

        return address(portfolio);
    }
}