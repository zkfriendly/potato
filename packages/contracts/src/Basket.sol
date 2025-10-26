// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IPyth} from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import {PythStructs} from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import {MockERC20} from "./mock/erc20.sol";

/**
 * @title Basket
 * @notice A basket of tokens with a given percentage and amount
 */
contract Basket is OwnableUpgradeable {
    address public constant PYTH_ADDRESS = 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21;

    address[] public tokens;
    mapping(address token => uint256 percentage) public tokenPercentage;
    mapping(address token => bytes32 priceFeedId) public tokenPriceFeedId;

    error ArraysLengthMismatch();
    error PercentagesMustSumToExactly100();
    error PriceFeedIdNotFound();
    error PriceNotFound();
    error TotalValueIsZero();

    event Rebalanced();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _owner,
        address[] memory _tokens,
        uint256[] memory _percentages,
        bytes32[] memory _priceFeedIds
    ) public initializer {
        __Ownable_init(_owner);
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

    function getTokensInfo() public view returns (address[] memory _tokens, uint256[] memory _percentages) {
        _tokens = new address[](tokens.length);
        _percentages = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            _tokens[i] = tokens[i];
            _percentages[i] = tokenPercentage[tokens[i]];
        }
    }

    /**
     * @notice Rebalance the basket to the target percentages
     * @param priceUpdates The price updates for the tokens
     * @dev this is a mock rebalancing logic for prototype purposes
     */
    function rebalanceBasket(bytes[] calldata priceUpdates) public payable {
        (int64 totalValue, int64[] memory tokenValues) = getBasketValue(priceUpdates);
        for (uint256 i = 0; i < tokens.length; i++) {
            int256 targetValueInt = (int256(totalValue) * int256(tokenPercentage[tokens[i]])) / 100;
            uint256 targetBalanceInUSD = targetValueInt <= 0 ? 0 : uint256(targetValueInt);
            uint256 targetBalance = tokenValues[i] == 0
                ? 0
                : (targetBalanceInUSD * 10 ** 18) / uint256(int256(tokenValues[i]));
            MockERC20(tokens[i]).setBalance(address(this), targetBalance);
        }
        emit Rebalanced();
    }

    function getTokenPrice(address _token) public returns (int64) {
        bytes32 priceFeedId = tokenPriceFeedId[_token];
        if (priceFeedId == bytes32(0)) {
            revert PriceFeedIdNotFound();
        }

        PythStructs.Price memory price = IPyth(PYTH_ADDRESS).getPriceNoOlderThan(priceFeedId, 60);

        if (price.price == 0) {
            revert PriceNotFound();
        }
        int32 expo = price.expo;
        int256 priceInt = int256(price.price);

        // Adjust price to 18 decimals (wei)
        if (expo > -18) {
            // Multiply by 10 ** (expoDiff)
            uint256 expoDiff = uint256(int256(expo) + 18);
            return int64(priceInt * int256(10 ** expoDiff));
        } else if (expo < -18) {
            // Divide by 10 ** (-expoDiff)
            uint256 expoDiff = uint256(int256(-expo) - 18);
            return int64(priceInt / int256(10 ** expoDiff));
        } else {
            // Already at 18 decimals
            return int64(priceInt);
        }
    }

    function getBasketValue(
        bytes[] calldata priceUpdates
    ) public returns (int64 totalValue, int64[] memory tokenValues) {
        updatePriceFeeds(priceUpdates);
        tokenValues = new int64[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            tokenValues[i] = getTokenPrice(tokens[i]);
            totalValue += tokenValues[i];
        }
    }

    function updatePriceFeeds(bytes[] calldata priceUpdates) public {
        IPyth pyth = IPyth(PYTH_ADDRESS);
        uint256 fee = pyth.getUpdateFee(priceUpdates);
        pyth.updatePriceFeeds{value: fee}(priceUpdates);
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
