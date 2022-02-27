NFT staking contract which gives users tokens for staking their nfts. It works for every ERC721 tokens.  

![image](https://user-images.githubusercontent.com/64146291/155851023-20d4ab9c-827c-4636-a74b-0f7ede132294.png)

Only owner of the StakingFactory is eligible to crate new clone contract. It prevents creating proxy contract for addresses that are not ERC721 (owner has to check and authorize every contract before enable staking). 
