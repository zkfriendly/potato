// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {ENS} from "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import {BasketFoundry} from "./BasketFoundry.sol";

interface IResolver {
    /// @dev Approve a delegate to be able to updated records on a node.
    function approve(bytes32 node, address delegate, bool approved) external;
    /// @dev Set the address for a node.
    function setAddr(bytes32 node, address addr) external;
    /// @dev Get the address for a node.
    function addr(bytes32 node) external view returns (address);
}

/**
 * @title PotatoFinanceEntrypoint
 * @notice It includes hardcoded basket assets, weights and price feed ids.
 * @dev this is the main entrypoint to setup an account with corresponding ENS domain.
 */
contract PotatoFinanceEntrypoint {
    address public constant RESOLVER = 0x8948458626811dd0c23EB25Cc74291247077cC51;
    address public constant REGISTRY = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e; // ENS registry contract address
    bytes32 public constant ROOT_NODE = 0x9bdf10551b7657ee394e12e39ddaea10678aa956390bd4259f23f309a9aec72c; // namehash(pyusd.eth).
    bytes32 public constant BB_NODE = 0xadf72035e25005d63d90e79517a435cb45f0df4f8d94e8f019917ebc1713bf36; // namehash(bb.pyusd.eth).
    bytes32 public constant CC_NODE = 0xffeb03935f6d775b6763946a48527f1e4b15504ed848ce137f59c07a4d964df9; // namehash(cc.pyusd.eth).

    address public constant BTC_TOKEN = 0xE7dC4769C8EaE12954A3b2Dd3089dB7265aE3473;
    address public constant ETH_TOKEN = 0xF38abcb54c1589C90db6D6E5ec08de22cD5146FE;
    address public PYUSD_TOKEN = 0x87fa0A06121eA340078F5e5661e70fbF7bdBf809;

    bytes32 public constant BTC_PRICE_FEED_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    bytes32 public constant ETH_PRICE_FEED_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 public constant PYUSD_PRICE_FEED_ID = 0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692;

    BasketFoundry public basketFoundry;

    mapping(address owner => string nickname) public ownerNickname;
    mapping(string nickname => address owner) public nicknameOwner;

    constructor(address _basketFoundry) {
        basketFoundry = BasketFoundry(_basketFoundry);
    }

    /**
     * @notice grant access to the ENS registry to the entrypoint
     * @dev this is to allow the entrypoint to set the subnodes and resolvers under bb.pyusd.eth and cc.pyusd.eth
     */
    function init() external {
        ENS ens = ENS(REGISTRY);
        bytes32 bbLabel = keccak256(abi.encodePacked("bb"));
        bytes32 ccLabel = keccak256(abi.encodePacked("cc"));
        ens.setSubnodeOwner(ROOT_NODE, bbLabel, address(this));
        ens.setSubnodeOwner(ROOT_NODE, ccLabel, address(this));
        ens.setApprovalForAll(address(this), true);
    }

    function setup(address _owner, string memory _nickname) external {
        if (keccak256(abi.encodePacked(ownerNickname[_owner])) != keccak256(abi.encodePacked(""))) {
            // revert OwnerAlreadySetup(); don't revert for demo
        }
        ownerNickname[_owner] = _nickname;
        nicknameOwner[_nickname] = _owner;
        (address bbBasket, address ccBasket) = createBBandCCBaskets(_owner);
        ENS ens = ENS(REGISTRY);
        bytes32 label = keccak256(abi.encodePacked(_nickname));
        ens.setSubnodeOwner(BB_NODE, label, address(this));
        ens.setSubnodeOwner(CC_NODE, label, address(this));
        bytes32 bbLabelNode = keccak256(abi.encodePacked(BB_NODE, label));
        bytes32 ccLabelNode = keccak256(abi.encodePacked(CC_NODE, label));
        ens.setResolver(bbLabelNode, RESOLVER);
        ens.setResolver(ccLabelNode, RESOLVER);
        IResolver(RESOLVER).setAddr(bbLabelNode, bbBasket);
        IResolver(RESOLVER).setAddr(ccLabelNode, ccBasket);
    }

    function createBBandCCBaskets(address _owner) internal returns (address bbBasket, address ccBasket) {
        (address[] memory _bbTokens, uint256[] memory _bbPercentages, bytes32[] memory _bbPriceFeedIds) = getBBBasket();
        (address[] memory _ccTokens, uint256[] memory _ccPercentages, bytes32[] memory _ccPriceFeedIds) = getCCBasket();
        bbBasket = basketFoundry.createBasket(_owner, _bbTokens, _bbPercentages, _bbPriceFeedIds);
        ccBasket = basketFoundry.createBasket(_owner, _ccTokens, _ccPercentages, _ccPriceFeedIds);
    }

    /**
     * @notice CC basket is 50% BTC and 50% ETH
     */
    function getCCBasket()
        internal
        view
        returns (address[] memory _tokens, uint256[] memory _percentages, bytes32[] memory _priceFeedIds)
    {
        _tokens = new address[](3);
        _tokens[0] = BTC_TOKEN;
        _tokens[1] = ETH_TOKEN;
        _tokens[2] = PYUSD_TOKEN;

        _percentages = new uint256[](3);
        _percentages[0] = 50;
        _percentages[1] = 50;
        _percentages[2] = 0; // This is included so that user can deposit PYUSD and automatically convert it to BTC or ETH

        _priceFeedIds = new bytes32[](3);
        _priceFeedIds[0] = BTC_PRICE_FEED_ID;
        _priceFeedIds[1] = ETH_PRICE_FEED_ID;
        _priceFeedIds[2] = PYUSD_PRICE_FEED_ID;

        return (_tokens, _percentages, _priceFeedIds);
    }

    /**
     * @notice BBB basket is 40% BTC, 40% ETH and 20% PYUSD
     */
    function getBBBasket()
        internal
        view
        returns (address[] memory _tokens, uint256[] memory _percentages, bytes32[] memory _priceFeedIds)
    {
        _tokens = new address[](3);
        _tokens[0] = BTC_TOKEN;
        _tokens[1] = ETH_TOKEN;
        _tokens[2] = PYUSD_TOKEN;

        _percentages = new uint256[](3);
        _percentages[0] = 40;
        _percentages[1] = 40;
        _percentages[2] = 20;

        _priceFeedIds = new bytes32[](3);
        _priceFeedIds[0] = BTC_PRICE_FEED_ID;
        _priceFeedIds[1] = ETH_PRICE_FEED_ID;
        _priceFeedIds[2] = PYUSD_PRICE_FEED_ID;

        return (_tokens, _percentages, _priceFeedIds);
    }
}
