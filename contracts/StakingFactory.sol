// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "hardhat/console.sol";

contract StakingFactory {
    event AddedNewContract(address indexed NFTContract, address indexed proxyContract);

    address public immutable owner;
    address public stakingContract; 

    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner");
        _; 
    } 

    // NFT contract address => created minimal proxy staking contract
    mapping (address => address) public stakingContracts;

    constructor(address _stakingContract) {
        owner = msg.sender;
        stakingContract = _stakingContract;
    }

    //                                          NFT contract address
    function createNewNFTStakingContract(address _contractAddress) external onlyOwner {
        require(stakingContracts[_contractAddress] == address(0), "Contract for provided address has been already created");
        require(_contractAddress != address(0), "Provided address is address 0");

        address newAddress = _clone(stakingContract);
        stakingContracts[_contractAddress] = newAddress;

        (bool success,) = newAddress.call(abi.encodeWithSignature("init(address)", _contractAddress));
        require(success);

        emit AddedNewContract(_contractAddress, newAddress);
    }

    function blockNFTStakingContract(address _contractAddress) external onlyOwner {
        require(stakingContracts[_contractAddress] != address(0), "There is no contract for provided NFT");
        require(_contractAddress != address(0), "Provided address is address 0");

        address proxyContract = stakingContracts[_contractAddress];

        bytes memory data = _checkBlockedContract(proxyContract);
        bool blocked = abi.decode(data, (bool));

        // checking if contract is not blocked already
        require(!blocked, "Contract is currently blocked");

        (bool success,) = proxyContract.call(abi.encodeWithSignature("blockContract()"));

        require(success);
    }

    function unBlockNFTStakingContract(address _contractAddress) external onlyOwner {
        require(stakingContracts[_contractAddress] != address(0), "There is no contract for provided NFT");
        require(_contractAddress != address(0), "Provided address is address 0");

        address proxyContract = stakingContracts[_contractAddress];

        bytes memory data = _checkBlockedContract(proxyContract);
        bool blocked = abi.decode(data, (bool));

        // checking if contract is blocked
        require(blocked, "Contract is currently unblocked");

        (bool success,) = proxyContract.call(abi.encodeWithSignature("unBlockContract()"));

        require(success);
    }


    function _checkBlockedContract(address _proxyContract) private returns (bytes memory) {
        (bool success, bytes memory data) = _proxyContract.call(abi.encodeWithSignature("blocked()"));
        require(success);
        return data;
    } 


    function _clone(address _target) private returns (address result) {
        // convert address to 20 bytes
        bytes20 targetBytes = bytes20(_target);

        // actual code //
        // 3d602d80600a3d3981f3363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3

        // creation code //
        // copy runtime code into memory and return it
        // 3d602d80600a3d3981f3

        // runtime code //
        // code to delegatecall to address
        // 363d3d373d3d3d363d73 address 5af43d82803e903d91602b57fd5bf3

        assembly {
            let clone := mload(0x40)
            // store 32 bytes to memory starting at "clone"
            mstore(
                clone,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )

            mstore(add(clone, 0x14), targetBytes)
            mstore(
                add(clone, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
            result := create(0, clone, 0x37)
        }
    }
}