// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Basket} from "./Basket.sol";

/**
 * @title BasketFoundry
 * @notice Allows anyone to create a basket for a given owner
 */
contract BasketFoundry {
    mapping(address owner => address[] baskets) public userBaskets;

    event BasketCreated(
        address indexed owner,
        address indexed basket,
        address[] tokens,
        uint256[] percentages,
        uint256[] amounts
    );

    function createBasket(
        address _owner,
        address[] memory _tokens,
        uint256[] memory _percentages,
        uint256[] memory _amounts
    ) external returns (address) {
        address basket = address(
            new Basket(_owner, _tokens, _percentages, _amounts)
        );
        userBaskets[_owner].push(basket);
        emit BasketCreated(_owner, basket, _tokens, _percentages, _amounts);

        return basket;
    }

    function getUserBaskets(address _owner) external view returns (address[] memory) {
        return userBaskets[_owner];
    }
}
