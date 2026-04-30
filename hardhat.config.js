require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      evmVersion: "cancun", // required for mcopy opcode (OpenZeppelin 5.x)
    },
  },
  networks: {
    // Celo Alfajores Testnet
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [PRIVATE_KEY],
      chainId: 44787,
      gasPrice: 1_000_000_000, // 1 gwei – ultra-cheap on Celo
    },
    // Celo Mainnet
    celo: {
      url: "https://forno.celo.org",
      accounts: [PRIVATE_KEY],
      chainId: 42220,
      gasPrice: 1_000_000_000,
    },
  },
  etherscan: {
    apiKey: {
      alfajores: process.env.CELOSCAN_API_KEY || "",
      celo:      process.env.CELOSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL:      "https://api-alfajores.celoscan.io/api",
          browserURL:  "https://alfajores.celoscan.io",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL:      "https://api.celoscan.io/api",
          browserURL:  "https://celoscan.io",
        },
      },
    ],
  },
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
