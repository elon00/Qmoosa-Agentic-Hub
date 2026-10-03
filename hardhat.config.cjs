require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Official Polkadot Hub TestNet (Paseo Asset Hub)
    polkadotTestnet: {
      url: process.env.POLKADOT_TESTNET_RPC || "https://eth-rpc-testnet.polkadot.io/",
      chainId: 420420417,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    // Westend Asset Hub
    westendAssetHub: {
      url: process.env.POLKADOT_REVIVE_HTTP_RPC || "https://westend-asset-hub-eth-rpc.polkadot.io",
      chainId: 420420421,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
