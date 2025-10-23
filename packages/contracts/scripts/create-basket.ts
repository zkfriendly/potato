import { network } from "hardhat";
import { parseAbiItem, decodeEventLog } from "viem";

const PORTFOLIO_CONTRACT_ADDRESS = "0x0E50Dd2CE38A30eA27f58C9ef61Bf14a50c783eC";
const OWNER_ADDRESS = "0x8cFe0f626F2155B3513F8F3B7f0F47742b45f6bF";

const { viem } = await network.connect({
  network: "hedera"
});

async function main() {
    // Before running this script, you need to set the private key of the owner account of the portfolio
    console.log("Creating basket for a portfolio")

    const publicClient = await viem.getPublicClient();
    const [owner] = await viem.getWalletClients();

    console.log("Using account:", owner.account.address);

    const portfolio = await viem.getContractAt(
        "Portfolio",
        PORTFOLIO_CONTRACT_ADDRESS
    );

    console.log("Check the owner of the portfolio");
    const portfolioOwner = await portfolio.read.owner();
    console.log("Portfolio owner:", portfolioOwner);

    console.log("Creating a basket for the portfolio");
    const hash = await portfolio.write.createBasket([
        ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0xdAC17F958D2ee523a2206206994597C13D831ec7"],
        [50n, 50n],
        [100n, 200n]
    ]);
    console.log("Transaction hash:", hash);

    console.log("Waiting for transaction confirmation");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Transaction confirmed in block:", receipt.blockNumber);


    // Get the basket address from events
    const basketCreatedEvent = parseAbiItem(
        "event BasketCreated(uint indexed basketIndex)"
    );

    const logs = receipt.logs.filter(log => {
        try {
          const decoded = decodeEventLog({
            abi: [basketCreatedEvent],
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === "BasketCreated";
        } catch {
          return false;
        }
    });

    if (logs.length > 0) {
        const decoded = decodeEventLog({
          abi: [basketCreatedEvent],
          data: logs[0].data,
          topics: logs[0].topics,
        });
        console.log("\n--- Basket Created Event ---");
        console.log("Basket Index:", decoded.args.basketIndex);
    }

    console.log("Check the baskets count");
    const basketsCount = await portfolio.read.getBasketsCount();
    console.log("Baskets count:", basketsCount);

    if (logs.length > 0) {
        const decoded = decodeEventLog({
          abi: [basketCreatedEvent],
          data: logs[0].data,
          topics: logs[0].topics,
        });
        const basketIndex = decoded.args.basketIndex;

        console.log("\n--- Getting Basket Details ---");
        const basket = await portfolio.read.getBasket([basketIndex]);
        console.log("Basket Index:", basketIndex);
        console.log("Tokens:", basket[0]);
        console.log("Percentages:", basket[1]);
        console.log("Amounts:", basket[2]);
    }
}

main().catch(console.error);