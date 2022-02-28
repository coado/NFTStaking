NFT staking contract which gives users tokens for staking their nfts. It works for every ERC721 tokens.  

![image](https://user-images.githubusercontent.com/64146291/155851023-20d4ab9c-827c-4636-a74b-0f7ede132294.png)

Only owner of the StakingFactory is eligible to crate new clone contract. It prevents creating proxy contracts for addresses that are not ERC721 (owner has to check and authorize every contract before enable staking). Each NFT contract has own staking contract (proxy) creating by owner. Proxy contracts only delegate calls to logic contract (gas saving, proxy contracts are tremendously cheap in deployment). Functions are running in logic contract with storage of proxy contract (and all state varaibles of proxy contract). We can connect any ERC20 tokens to logic contract to give user rewards for staking.
