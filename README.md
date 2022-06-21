
Just an idea of NFT staking contract, which show usecase of the minimal proxy contracts. 

![image](https://user-images.githubusercontent.com/64146291/155851023-20d4ab9c-827c-4636-a74b-0f7ede132294.png)

Only the owner of the StakingFactory is eligible to create a new clone contract. It prevents creating proxy contracts for addresses that are not ERC721 (the owner has to check and authorize every contract before enabling staking). Each NFT contract has its own staking contract (proxy) created by the owner. Proxy contracts only delegate calls to the logic contract (gas-saving, proxy contracts are tremendously cheap in deployment). Functions are running in logic contract with storage of proxy contract (and all state variables of proxy contract). We can connect an ERC20 token to a logic contract and pay users for staking.
