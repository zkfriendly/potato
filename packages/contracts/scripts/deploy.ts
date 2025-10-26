import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect({
    network: "sepolia"
  });

  const [deployer] = await viem.getWalletClients();
  
  console.log("Deploying BasketFoundry with the account:", deployer.account.address);

  // Deploy BasketFoundry
  const basketFoundry = await viem.deployContract("BasketFoundry");

  console.log("BasketFoundry deployed at:", basketFoundry.address);
}

main().catch(console.error);