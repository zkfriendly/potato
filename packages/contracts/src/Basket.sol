// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

address constant SEPOLIA_PYTH_ADDRESS = 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21;

/**
 * @title Basket
 * @notice A basket of tokens with a given percentage and amount
 */
contract Basket is Ownable {
    IPyth public pyth;
    address[] public tokens;
    mapping(address token => uint256 percentage) public tokenPercentage;
    mapping(address token => bytes32 priceFeedId) public tokenPriceFeedId;

    error ArraysLengthMismatch();
    error PercentagesMustSumToExactly100();
    error PriceFeedIdNotFound();
    error PriceNotFound();
    error TotalValueIsZero();

    constructor(
        address _owner,
        address[] memory _tokens,
        uint256[] memory _percentages,
        bytes32[] memory _priceFeedIds
    ) Ownable(_owner) {
        pyth = IPyth(SEPOLIA_PYTH_ADDRESS);
        if (_tokens.length != _percentages.length || _tokens.length != _priceFeedIds.length) {
            revert ArraysLengthMismatch();
        }
        tokens = _tokens;
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _tokens.length; i++) {
            totalPercentage += _percentages[i];
            tokenPercentage[_tokens[i]] = _percentages[i];
            tokenPriceFeedId[_tokens[i]] = _priceFeedIds[i];
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

    function getTokenPrice(address _token, bytes[] calldata priceUpdate) public payable returns (int64) {
        bytes32 priceFeedId = tokenPriceFeedId[_token];
        if (priceFeedId == bytes32(0)) {
            revert PriceFeedIdNotFound();
        }

        uint256 fee = pyth.getUpdateFee(priceUpdate);
        pyth.updatePriceFeeds{ value: fee }(priceUpdate);
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceFeedId, 60);

        if (price.price == 0) {
            revert PriceNotFound();
        }
        return price.price;
    }

    function getBasketValue(bytes[][] calldata priceUpdates) public returns (int64 totalValue) {
        if (priceUpdates.length != tokens.length) {
            revert ArraysLengthMismatch();
        }

        for (uint256 i = 0; i < tokens.length; i++) {
            totalValue += getTokenPrice(tokens[i], priceUpdates[i]);
        }
    }

    function rebalanceBasket(bytes[][] calldata priceUpdates) public payable {
        // TODO: Implement rebalancing logic
    }
}
