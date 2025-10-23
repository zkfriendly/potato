// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Portfolio } from "./Portfolio.sol";

import "@openzeppelin/contracts/access/Ownable.sol";


contract PortfolioFoundry is Ownable {
    mapping(address => address) public userPortfolios;

    constructor(address _owner) Ownable(_owner) {}

    event PortfolioCreated(address indexed portfolioOwner, address indexed portfolio);

    function createPortfolio(address _portfolioOwner) external onlyOwner returns (address) {
        require(userPortfolios[_portfolioOwner] == address(0), "User already has a portfolio");

        Portfolio portfolio = new Portfolio(_portfolioOwner);
        userPortfolios[_portfolioOwner] = address(portfolio);
        emit PortfolioCreated(_portfolioOwner, address(portfolio));

        return address(portfolio);
    }
}