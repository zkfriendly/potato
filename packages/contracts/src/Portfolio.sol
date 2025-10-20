// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract Portfolio is Ownable {
    struct Basket {
        address[] tokens;
        mapping(address => TokenInfo) tokenInfos;
    }

    struct TokenInfo {
        uint percentage;
        uint amount;
    }

    uint private balance;
    Basket[] private baskets;

    constructor(address _owner) Ownable(_owner) {}

    function createBasket(
        address[] memory _tokens,
        uint[] memory _percentages,
        uint[] memory _amounts
    ) public onlyOwner {
        require(
            _tokens.length == _percentages.length &&
                _tokens.length == _amounts.length,
            "Arrays length mismatch"
        );

        // Validate that percentages sum to exactly 100
        uint totalPercentage = 0;
        for (uint i = 0; i < _percentages.length; i++) {
            totalPercentage += _percentages[i];
        }
        require(totalPercentage == 100, "Percentages must sum to exactly 100");

        Basket storage newBasket = baskets.push();
        newBasket.tokens = _tokens;

        for (uint i = 0; i < _tokens.length; i++) {
            newBasket.tokenInfos[_tokens[i]] = TokenInfo({
                percentage: _percentages[i],
                amount: _amounts[i]
            });
        }
    }

    function getAllBaskets() internal view returns (Basket[] storage) {
        return baskets;
    }
}
