// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Basket} from "./Basket.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @title BasketFoundry
 * @notice Allows anyone to create a basket for a given owner
 */
contract BasketFoundry {
    address public immutable implementation;
    mapping(address owner => address[] baskets) public userBaskets;

    error InsufficientBalance();

    constructor(address _implementation) {
        implementation = _implementation;
    }

    event BasketCreated(
        address indexed owner,
        address indexed basket,
        address[] tokens,
        uint256[] percentages,
        bytes32[] priceFeedIds
    );

    function createBasket(
        address _owner,
        address[] memory _tokens,
        uint256[] memory _percentages,
        bytes32[] memory _priceFeedIds
    ) external payable returns (address) {
        address basket = Clones.clone(implementation);
        Basket(payable(basket)).initialize(_owner, _tokens, _percentages, _priceFeedIds);
        userBaskets[_owner].push(basket);
        emit BasketCreated(_owner, basket, _tokens, _percentages, _priceFeedIds);

        // Transfer 0.01 ETH to the newly created basket
        uint256 fundingAmount = 0.01 ether;
        if (address(this).balance < fundingAmount) {
            revert InsufficientBalance();
        }
        (bool success, ) = basket.call{value: fundingAmount}("");
        require(success, "ETH transfer failed");

        return basket;
    }

    function getUserBaskets(address _owner) external view returns (address[] memory) {
        return userBaskets[_owner];
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
