import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type TokenSpec = {
  id: string;
  name: string;
  symbol: string;
};

const TOKENS: TokenSpec[] = [
  { id: "WBTC", name: "Wrapped Bitcoin", symbol: "WBTC" },
  { id: "WETH", name: "Wrapped Ether", symbol: "WETH" },
  { id: "PYUSD", name: "PayPal USD", symbol: "PYUSD" },
];

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function execFileAsync(
  file: string,
  args: string[],
  opts: { cwd?: string } = {}
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { cwd: opts.cwd }, (error, stdout, stderr) => {
      if (error) {
        const err: any = new Error(stderr || stdout || String(error));
        err.code = (error as any).code;
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function main() {
  const chainId = 11155111; // Sepolia

  const moduleName = "MockTokensModule";
  const deploymentsPath = path.resolve(__dirname, `../ignition/deployments/chain-${chainId}/deployed_addresses.json`);

  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(
      `Could not find deployed addresses at: ${deploymentsPath}. Make sure you've deployed to chain ${chainId}.`
    );
  }

  const deployedAddresses = JSON.parse(fs.readFileSync(deploymentsPath, "utf8")) as Record<string, string>;

  // Resolve local hardhat CLI path
  const hardhatBin = path.resolve(__dirname, "../node_modules/.bin/hardhat");
  const projectRoot = path.resolve(__dirname, "..");

  for (const token of TOKENS) {
    const futureId = `${moduleName}#${token.id}`;
    const address = deployedAddresses[futureId];

    if (!address) {
      console.warn(
        `Skipping ${token.id}: address not found in ${path.basename(deploymentsPath)} under key ${futureId}`
      );
      continue;
    }

    const networkLabel = "sepolia";
    console.log(`Verifying ${token.id} at ${address} on ${networkLabel} (chainId=${chainId})...`);

    const args = [
      "verify",
      "--network",
      networkLabel,
      "--contract",
      "src/mock/erc20.sol:MockERC20",
      address,
      token.name,
      token.symbol,
    ];

    try {
      const { stdout, stderr } = await execFileAsync(hardhatBin, args, { cwd: projectRoot });
      if (stdout.trim()) console.log(stdout.trim());
      if (stderr.trim()) console.error(stderr.trim());
      console.log(`Verified ${token.id} successfully.`);
    } catch (err: any) {
      const message: string = err?.stderr || err?.stdout || err?.message || String(err);
      const alreadyVerified =
        message.includes("Already Verified") ||
        message.includes("already verified") ||
        message.includes("Contract source code already verified") ||
        message.includes("Smart-contract already verified");

      if (alreadyVerified) {
        console.log(`${token.id} is already verified.`);
      } else {
        console.error(`Failed to verify ${token.id}:`, message);
      }
    }

    // Be polite with Etherscan rate limits
    await delay(6000);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
