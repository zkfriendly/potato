// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Basket
 * @notice A basket of tokens with a given percentage and amount
 */
contract Basket is Ownable {
    address[] public tokens;
    mapping(address token => uint256 percentage) public tokenPercentage;

    error ArraysLengthMismatch();
    error PercentagesMustSumToExactly100();

    constructor(
        address _owner,
        address[] memory _tokens,
        uint256[] memory _percentages
    ) Ownable(_owner) {
        if (_tokens.length != _percentages.length) {
            revert ArraysLengthMismatch();
        }
        tokens = _tokens;
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _tokens.length; i++) {
            totalPercentage += _percentages[i];
            tokenPercentage[_tokens[i]] = _percentages[i];
        }

        if (totalPercentage != 100) {
            revert PercentagesMustSumToExactly100();
        }
    }

    function getTokensLength() public view returns (uint256) {
        return tokens.length;
    }

    function getTokens() public view returns (address[] memory) {
        return tokens;
    }

    function getTokensInfo()
        public
        view
        returns (address[] memory _tokens, uint256[] memory _percentages)
    {
        _tokens = new address[](tokens.length);
        _percentages = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            _tokens[i] = tokens[i];
            _percentages[i] = tokenPercentage[tokens[i]];
        }
    }
}
