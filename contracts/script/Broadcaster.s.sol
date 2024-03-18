// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";

abstract contract BroadcasterScript is Script {
    modifier broadcast() {
        uint256 privateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        privateKey != 0 ? vm.startBroadcast(privateKey) : vm.startBroadcast();

        _;

        vm.stopBroadcast();
    }
}
