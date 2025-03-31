require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://base-sepolia-rpc.publicnode.com",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532
    },
    tachyon: {
      url: process.env.TACHYON_RPC_URL|| "http://65.2.69.84:8547",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 2703
    }
  }
};