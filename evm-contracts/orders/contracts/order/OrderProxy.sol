// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "hardhat/console.sol";

contract OrderProxy is ERC1967Proxy  {
    error OwnableUnauthorizedAccount(address account);

    constructor(address _logic, bytes memory data, address sender)
    payable ERC1967Proxy(_logic, data) {
        ERC1967Utils.changeAdmin(sender);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() internal view virtual {
        if (this.owner() != msg.sender) {
            revert OwnableUnauthorizedAccount(msg.sender);
        }
    }

    function upgradeTo(address implementation) external onlyOwner {
        ERC1967Utils.upgradeToAndCall(implementation, bytes(""));
    }

    receive() external payable {
        address implementation = ERC1967Utils.getImplementation();
        (bool success,) = address(implementation).call{value: msg.value}("");
        require(success, "Ether transfer to implementation failed");
    }

    function getImplementation() external view returns(address) {
        address logic = ERC1967Utils.getImplementation();
        return  logic;
    }

    function owner() external view returns(address) {
        address admin = ERC1967Utils.getAdmin();
        return admin;
    }
}
