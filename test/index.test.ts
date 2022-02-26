import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect, should, assert } from "chai";
import { ethers } from "hardhat";
import { LogicContract, LogicContract__factory, NFT, NFT__factory, StakingFactory, StakingFactory__factory } from "../typechain";
import { _abi } from '../typechain/factories/LogicContract__factory';

describe("Main Functionality", function () {
  let owner: SignerWithAddress, 
      acc1: SignerWithAddress, 
      acc2: SignerWithAddress, 
      logicContract: LogicContract,
      stakingFactoryContract: StakingFactory,
      nftContract1: NFT,
      nftContract2: NFT,
      stakingContractAddress1: string,
      stakingContractAddress2: string,
      stakingContract1: LogicContract,
      stakingContract2: LogicContract,
      tokenId: number

  before(async () => {
    [owner, acc1, acc2] = await ethers.getSigners();
    logicContract = await new LogicContract__factory(owner).deploy();
    stakingFactoryContract = await new StakingFactory__factory(owner).deploy(logicContract.address)
    nftContract1 = await new NFT__factory(owner).deploy()
    nftContract2 = await new NFT__factory(owner).deploy()

    await stakingFactoryContract.createNewNFTStakingContract(nftContract1.address)
    await stakingFactoryContract.createNewNFTStakingContract(nftContract2.address)

    stakingContractAddress1 = await stakingFactoryContract.stakingContracts(nftContract1.address)
    stakingContractAddress2 = await stakingFactoryContract.stakingContracts(nftContract2.address)

    // connecting with proxy contracts 
    stakingContract1 = new ethers.Contract(stakingContractAddress1, _abi, owner) as LogicContract
    stakingContract2 = new ethers.Contract(stakingContractAddress2, _abi, owner) as LogicContract

    tokenId = 1
  })

  describe("Initial Tests", () => {
    
    it("Deploying Contracts / checking initial values", async () => {
      expect(await stakingFactoryContract.owner()).to.eq(owner.address)
      expect(await stakingFactoryContract.stakingContract()).to.eq(logicContract.address)
    });

    it("Creating new proxy staking Contracts", async () => {
      
      // Checking if other address than owner is eligible to create new proxy contract
      await expect(stakingFactoryContract.connect(acc1).createNewNFTStakingContract(nftContract1.address)).to.be.reverted

      // checking if proxy contract has been initlialized
      expect(await stakingContract1.initialized()).to.eq(true)
      expect(await stakingContract2.initialized()).to.eq(true)

      const nftContractAddress1 = await stakingContract1.NFTStakingContract()
      const nftContractAddress2 = await stakingContract2.NFTStakingContract()

      expect(nftContractAddress1).to.eq(nftContract1.address)
      expect(nftContractAddress2).to.eq(nftContract2.address)
      expect(nftContractAddress1).to.not.eq(nftContractAddress2)  
    })
  })

  describe("Staking NFT", () => {

    it("StakeNFT function", async () => {
      await nftContract1.mint(acc1.address, tokenId)
      await nftContract1.connect(acc1).approve(stakingContract1.address, tokenId)

      // calling with tokenId: 0
      await expect(stakingContract1.connect(acc1).stakeNFT(0)).to.be.reverted
      // calling with tokenId that user doesn't approve / have
      await expect(stakingContract1.connect(acc1).stakeNFT(10)).to.be.reverted

      await stakingContract1.connect(acc1).stakeNFT(tokenId)

      // trying to stake the same token twice
      await expect(stakingContract1.connect(acc1).stakeNFT(tokenId)).to.be.reverted

      // checking timestamp for bad tokenId
      let timestamp = await stakingContract1.connect(acc1).userStakingData(acc1.address, 2);
                 
      assert.equal(Object.values(timestamp)[0], '0x00', 'block.timestamp should be equal to 0')      

      // checking timestamp for existing tokenId
      timestamp = await stakingContract1.connect(acc1).userStakingData(acc1.address, tokenId);

      assert.notEqual(Object.values(timestamp)[0], '0x00', 'block.timestamp shouldnt be equal to 0')      

      const userTokens = await stakingContract1.userStakingTokens(acc1.address, 0)
      assert.equal(Object.values(userTokens)[0], '0x01', `TokenId should be equal to ${tokenId}`)

      // checking user tokenIds in other contract / function should be reverted
      await expect(stakingContract2.userStakingTokens(acc1.address, 0)).to.be.reverted
      
      
    })

    it("UnstakeNFT function with high stake period time", async () => {
      await expect(stakingContract1.connect(acc1).unStakeNFT(tokenId)).to.be.reverted
    })

    xit("UnstakeNFT function", async () => {
      // bad tokenId
      await expect(stakingContract1.connect(acc1).unStakeNFT(10)).to.be.reverted
      // token doesnt belong to provided address
      await expect(stakingContract1.connect(acc2).unStakeNFT(tokenId)).to.be.reverted
      // bad tokenId
      await expect(stakingContract1.connect(acc1).unStakeNFT(0)).to.be.reverted
      // bad tokenId
      await expect(stakingContract1.connect(acc1).unStakeNFT(-10)).to.be.reverted

      await stakingContract1.connect(acc1).unStakeNFT(tokenId)
      // calling unstake function twice
      await expect(stakingContract1.connect(acc1).unStakeNFT(tokenId)).to.be.reverted

      const timestamp = await stakingContract1.connect(acc1).userStakingData(acc1.address, tokenId)
      // checking timestamp / should be 0 after deleting data                  
      assert.equal(Object.values(timestamp)[0], '0x00', 'block.timestamp should be equal to 0')  
      
      await expect(stakingContract1.userStakingTokens(acc1.address, 0)).to.be.reverted

      assert.equal(await nftContract1.ownerOf(tokenId), acc1.address, 'After calling unstake function, owner of NFT should be changed')

    })
  })

})
