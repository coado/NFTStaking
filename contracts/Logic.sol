// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./ERC721.sol";
import "./ERC20.sol";
import "hardhat/console.sol";

contract LogicContract is ERC20 {
    event NewNFTInStaking(address sender, uint tokenId);
    event UnstakeNFT(address sender, uint tokenId);

    address public NFTStakingContract;
    address public owner;

    bool public initialized = false;
    bool public blocked = false;
    
    uint public stakingPeriod = 365 days;
    uint public stakingRewardsPerNFT = 1000;

    // user address => token id => start staking time
    mapping (address => mapping(uint => uint)) public userStakingData;
    // user address => array of all stake user tokens 
    mapping (address => uint[]) public userStakingTokens;


    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner");
        _; 
    } 


    function init(address _address) public {
        require(!initialized, "Contract has been already initialized");

        NFTStakingContract = _address;
        owner = msg.sender;
        initialized = true;
    }

    function stakeNFT(uint _tokenId) external {
        // There is no necessity to check if token is already staked, because
        // even if is, it wouldn't be transfered to this contract
        require(_tokenId != 0, "Token id is equal to 0");
        require(!blocked, "Contract is blocked");

        userStakingData[msg.sender][_tokenId] = block.timestamp;
        userStakingTokens[msg.sender].push(_tokenId);

        IERC721 nftContract = IERC721(NFTStakingContract);

        nftContract.transferFrom(msg.sender, address(this), _tokenId);

        emit NewNFTInStaking(msg.sender, _tokenId);
    }  

    function unStakeNFT(uint _tokenId) external {
        require(userStakingData[msg.sender][_tokenId] != 0, "NFT is not staking");

        delete userStakingData[msg.sender][_tokenId];
        
        uint[] storage userTokens = userStakingTokens[msg.sender];
        uint arrLength = userTokens.length;

        if (arrLength == 1) {
            userTokens.pop();
        } else {
            for (uint i; i < arrLength; i++) {
                // order of elements inside the array doesn't matter
                if (userTokens[i] == _tokenId) {
                    userTokens[i] = userTokens[arrLength - 1];
                    userTokens.pop();
                }
            }
        }

        IERC721 nftContract = IERC721(NFTStakingContract);

        nftContract.transferFrom(address(this), msg.sender, _tokenId);

        if (!blocked) {
            uint endStakingTimestamp = userStakingData[msg.sender][_tokenId] + stakingPeriod;
            require(endStakingTimestamp < block.timestamp, "Your NFT is still in staking");
            mint(stakingRewardsPerNFT);
        }
            

        emit UnstakeNFT(msg.sender, _tokenId);

    }

     function mint(uint amount) private {
        balanceOf[msg.sender] += amount;
        totalSupply += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    function blockContract() public onlyOwner {
        require(!blocked, "Contract is not blocked");
        blocked = true;
    }

    function unBlockContract() public onlyOwner {
        require(blocked, "Contract is not blocked");
        blocked = false;
    }

}