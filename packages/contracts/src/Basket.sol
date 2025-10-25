// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IBasket {
    struct TokenInfo {
        uint256 percentage;
        uint256 amount;
    }

    error ArraysLengthMismatch();
    error PercentagesMustSumToExactly100();
}

/**
 * @title Basket
 * @notice A basket of tokens with a given percentage and amount
 */
contract Basket is Ownable, IBasket {
    address[] public tokens;
    mapping(address token => TokenInfo info) public tokenInfo;

    constructor(
        address _owner,
        address[] memory _tokens,
        uint256[] memory _percentages,
        uint256[] memory _amounts
    ) Ownable(_owner) {
        if (
            _tokens.length != _percentages.length ||
            _tokens.length != _amounts.length
        ) {
            revert ArraysLengthMismatch();
        }

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _tokens.length; i++) {
            totalPercentage += _percentages[i];
            tokenInfo[_tokens[i]] = TokenInfo({
                percentage: _percentages[i],
                amount: _amounts[i]
            });
        }

        if (totalPercentage != 100) {
            revert PercentagesMustSumToExactly100();
        }
    }

    function getTokensCount() public view returns (uint256) {
        return tokens.length;
    }

    function getAllTokens() public view returns (address[] memory) {
        return tokens;
    }

    function getAllTokenInfo() public view returns (TokenInfo[] memory) {
        TokenInfo[] memory tokenInfos = new TokenInfo[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            tokenInfos[i] = tokenInfo[tokens[i]];
        }
        return tokenInfos;
    }
}
