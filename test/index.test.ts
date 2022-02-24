import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect, should } from "chai";
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
      stakingContract2: LogicContract

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
      await nftContract1.mint(acc1.address, 1);
      await nftContract1.connect(acc1).approve(stakingContract1.address, 1)

      // calling with tokenId: 0
      await expect(stakingContract1.connect(acc1).stakeNFT(0)).to.be.reverted
      // calling with tokenId that user doesn't approve / have
      await expect(stakingContract1.connect(acc1).stakeNFT(10)).to.be.reverted

      await stakingContract1.connect(acc1).stakeNFT(1)
                 
      await expect(stakingContract1.connect(acc1).userStakingData(acc1.address, 1)).to.exist



    })
  })

})
