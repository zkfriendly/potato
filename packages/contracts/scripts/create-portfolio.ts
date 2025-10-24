import { network } from "hardhat";
import { parseAbiItem, decodeEventLog } from "viem";

// Replace this with your deployed contract address
const PORTFOLIO_FOUNDRY_ADDRESS = "0x93d715d7b8a690f96e1a4e9bd357d432153cfded";

const { viem } = await network.connect({
  network: "hedera"
});

async function main() {
  console.log("Interacting with PortfolioFoundry on Hedera");
  
  const publicClient = await viem.getPublicClient();
  const [owner] = await viem.getWalletClients();
  
  console.log("Using account:", owner.account.address);
  
  // Get the deployed contract
  const portfolioFoundry = await viem.getContractAt(
    "PortfolioFoundry",
    PORTFOLIO_FOUNDRY_ADDRESS
  );
  
  // 1. Check the owner
  console.log("\n--- Checking owner ---");
  const contractOwner = await portfolioFoundry.read.owner();
  console.log("Contract owner:", contractOwner);
  
  // 2. Create a portfolio for a test user
  console.log("\n--- Creating portfolio ---");
  const testUserAddress = "0x8cFe0f626F2155B3513F8F3B7f0F47742b45f6bF"; // Replace with actual address
  
  // Check if user already has a portfolio
  const existingPortfolio = await portfolioFoundry.read.userPortfolios([testUserAddress]);
  console.log("Existing portfolio for user:", existingPortfolio);
  
  if (existingPortfolio === "0x0000000000000000000000000000000000000000") {
    console.log("Creating new portfolio for:", testUserAddress);
    
    const hash = await portfolioFoundry.write.createPortfolio([testUserAddress]);
    console.log("Transaction hash:", hash);
    
    // Wait for transaction confirmation
    console.log("Waiting for transaction confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // Get the portfolio address from events
    const portfolioCreatedEvent = parseAbiItem(
      "event PortfolioCreated(address indexed portfolioOwner, address indexed portfolio)"
    );
    
    const logs = receipt.logs.filter(log => {
      try {
        const decoded = decodeEventLog({
          abi: [portfolioCreatedEvent],
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === "PortfolioCreated";
      } catch {
        return false;
      }
    });
    
    if (logs.length > 0) {
      const decoded = decodeEventLog({
        abi: [portfolioCreatedEvent],
        data: logs[0].data,
        topics: logs[0].topics,
      });
      console.log("\n--- Portfolio Created Event ---");
      console.log("Portfolio Owner:", decoded.args.portfolioOwner);
      console.log("Portfolio Address:", decoded.args.portfolio);
    }
    
    // 3. Verify the portfolio was created
    console.log("\n--- Verifying portfolio creation ---");
    const newPortfolio = await portfolioFoundry.read.userPortfolios([testUserAddress]);
    console.log("New portfolio address:", newPortfolio);
    
    // 4. Interact with the created Portfolio contract
    console.log("\n--- Checking Portfolio contract ---");
    const portfolio = await viem.getContractAt("Portfolio", newPortfolio);
    const portfolioOwner = await portfolio.read.owner();
    console.log("Portfolio owner:", portfolioOwner);
    
  } else {
    console.log("User already has a portfolio:", existingPortfolio);
    
    // Just check the existing portfolio
    const portfolio = await viem.getContractAt("Portfolio", existingPortfolio);
    const portfolioOwner = await portfolio.read.owner();
    console.log("Portfolio owner:", portfolioOwner);
  }
  
  console.log("\n✅ Interaction complete!");
}

main().catch(console.error);