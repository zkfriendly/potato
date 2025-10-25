// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Portfolio} from "./Portfolio.sol";

/**
 * @title PortfolioFoundry
 * @notice Allows anyone to create a portfolio for a given owner
 */
contract PortfolioFoundry {
    mapping(address owner => address portfolio) public userPortfolio;

    error PortfolioAlreadyExists();

    event PortfolioCreated(address indexed owner, address indexed portfolio);

    /**
     * @dev Reverts if a portfolio already exists for the given owner
     */
    function createPortfolio(address _owner) external returns (address) {
        if (userPortfolio[_owner] != address(0)) {
            revert PortfolioAlreadyExists();
        }

        address portfolio = address(new Portfolio(_owner));
        userPortfolio[_owner] = portfolio;
        emit PortfolioCreated(_owner, portfolio);

        return portfolio;
    }
}
