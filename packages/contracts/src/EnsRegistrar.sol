// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.28;
// import { ENS } from "@ensdomains/ens-contracts/contracts/registry/ENS.sol";

// interface IResolver {
//     /// @dev Approve a delegate to be able to updated records on a node.
//     function approve(bytes32 node, address delegate, bool approved) external;
//     /// @dev Set the address for a node.
//     function setAddr(bytes32 node, address addr) external;
//     /// @dev Get the address for a node.
//     function addr(bytes32 node) external view returns (address);
// }

// /**
//  * @title Entrypoint
//  * @notice The entrypoint for the Potato Finance protocol
//  */
// contract Entrypoint {
//     address public immutable REGISTRY; // ENS registry contract address
//     bytes32 public immutable ROOT_NODE; // e.g. namehash(pyusd.eth).

//     constructor(address _registry, bytes32 _rootNode) {
//         REGISTRY = _registry;
//         ROOT_NODE = _rootNode;
//     }
// }