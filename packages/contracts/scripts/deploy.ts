import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect({
    network: "hedera"
  });

  const [deployer] = await viem.getWalletClients();
  
  console.log("Deploying PortfolioFoundry with the account:", deployer.account.address);

  // Deploy PortfolioFoundry with the deployer as the owner
  const portfolioFoundry = await viem.deployContract("PortfolioFoundry", [
    deployer.account.address
  ]);

  console.log("PortfolioFoundry deployed at:", portfolioFoundry.address);
}

main().catch(console.error);