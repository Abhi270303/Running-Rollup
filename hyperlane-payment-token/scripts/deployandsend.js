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
      mailbox: process.env.TACHYON_MAILBOX || "0xe86751188603ed0a9E6394aF9aabeDB7166ce49b",
      igp: process.env.TACHYON_IGP || "0xe86751188603ed0a9E6394aF9aabeDB7166ce49b",
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

    // Step 3: Set remote receiver if on origin chain
    if (currentChain.isOrigin) {
      console.log("\n=== Setting Remote Receiver ===");
      const destinationChain = chains.tachyon;
      const receiverAddress = "0x5B16e5ecDc1338bb7AC0aC5174539dD91B158854"; // Replace with actual receiver
      const tx = await token.setRemoteReceiver(destinationChain.domainId, receiverAddress);
      
      await tx.wait();
      console.log("Remote receiver set successfully.");
      const paymentTx = await token.requestPayment(["0x5B16e5ecDc1338bb7AC0aC5174539dD91B158854"], [100], chains.tachyon.domainId, { value: ethers.parseEther("0") });
      await paymentTx.wait();
      console.log("Payment request sent successfully.");
    }
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
