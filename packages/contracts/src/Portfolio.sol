// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

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

    event BasketCreated(uint indexed basketIndex);

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

        emit BasketCreated(baskets.length - 1);
    }

    function getBasketsCount() public view returns (uint256) {
        return baskets.length;
    }

    function getBasket(uint _index) public view returns (
            address[] memory tokens,
            uint[] memory percentages,
            uint[] memory amounts
        )
    {
        require(_index < baskets.length, "Basket index out of bounds");

        Basket storage basket = baskets[_index];
        tokens = basket.tokens;
        percentages = new uint[](tokens.length);
        amounts = new uint[](tokens.length);

        for (uint i = 0; i < tokens.length; i++) {
            TokenInfo storage info = basket.tokenInfos[tokens[i]];
            percentages[i] = info.percentage;
            amounts[i] = info.amount;
        }
    }

    function getBasketTokens(uint256 _basketIndex) public view returns (address[] memory) {
        return baskets[_basketIndex].tokens;
    }

    function getTokenInfo(
        uint256 _basketIndex,
        address _token
    ) public view returns (TokenInfo memory) {
        return baskets[_basketIndex].tokenInfos[_token];
    }
}
