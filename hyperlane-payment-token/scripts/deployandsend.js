const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("=== Hyperlane ERC20 Payment Token Deployment and Test ===");
  console.log("Base Sepolia (Origin) → Tachyon (Destination)");

  // Define chain configurations
  const chains = {
    baseSepolia: {
      name: "Base Sepolia",
      chainId: 84532, // Ensure this remains a Number
      domainId: 84532,
      mailbox: "0x6966b0E55883d49BFB24539356a2f8A673E02039",
      igp: "0x6966b0E55883d49BFB24539356a2f8A673E02039",
      contract: null,
      isOrigin: true,
    },
    tachyon: {
      name: "Tachyon",
      chainId: 2703,
      domainId: 2703,
      mailbox: process.env.TACHYON_MAILBOX || "0x35231d4c2D8B8ADcB5617A638A0c4548684c7C70",
      igp: process.env.TACHYON_IGP || "0x56f52c0A1ddcD557285f7CBc782D3d83096CE1Cc",
      contract: null,
      isOrigin: false,
    },
  };

  // Step 1: Determine the current network
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId); // Convert BigInt to Number
  console.log(`Current network: ${network.name} (Chain ID: ${currentChainId})`);

  let currentChain = Object.values(chains).find((chain) => chain.chainId === currentChainId);

  if (!currentChain) {
    throw new Error(`Unsupported network: Chain ID ${currentChainId}`);
  }

  console.log(`Detected ${currentChain.name} (${currentChain.isOrigin ? "Origin" : "Destination"} Chain)`);

  try {
    // Step 2: Deploy the contract
    console.log(`\n=== Deploying contract on ${currentChain.name} ===`);
    console.log(`Using Mailbox: ${currentChain.mailbox}`);
    console.log(`Using IGP: ${currentChain.igp}`);

    const HyperlanePaymentToken = await ethers.getContractFactory("HyperlanePaymentToken");
    const token = await HyperlanePaymentToken.deploy(currentChain.mailbox, currentChain.igp);

    console.log(`Deploying contract...`);
    await token.waitForDeployment();

    const deployedAddress = await token.getAddress(); // Correct way to get the deployed address
    console.log(`Contract deployed to: ${deployedAddress}`);

    // Save contract address
    currentChain.contract = deployedAddress;
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});

