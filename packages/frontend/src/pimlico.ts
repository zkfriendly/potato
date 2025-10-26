import type { Hex } from "viem";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
// Avoid subpath import issues: inline the known EntryPoint v0.7 address
const entryPoint07Address = "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as const;
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { PIMLICO_API_KEY } from "./config";

// Contract addresses on Sepolia
const SETUP_CONTRACT_ADDRESS = "0x03dad733b89471906CA03a2415bAe4ce84003e88" as const;
const BASKET_FOUNDRY_ADDRESS = "0x8aC9a78b9b1Ab340c09c31A70c746e8AB626527F" as const;

// Setup contract ABI - including setup and ownerNickname functions
const SETUP_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_owner", type: "address" },
      { internalType: "string", name: "_nickname", type: "string" },
    ],
    name: "setup",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "ownerNickname",
    outputs: [{ internalType: "string", name: "nickname", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Basket Foundry ABI
const BASKET_FOUNDRY_ABI = [
  {
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    name: "getUserBaskets",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Basket ABI - Complete ABI for basket contract
const BASKET_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "ArraysLengthMismatch", type: "error" },
  { inputs: [], name: "InvalidInitialization", type: "error" },
  { inputs: [], name: "NotInitializing", type: "error" },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  { inputs: [], name: "PercentagesMustSumToExactly100", type: "error" },
  { inputs: [], name: "PriceFeedIdNotFound", type: "error" },
  { inputs: [], name: "PriceNotFound", type: "error" },
  { inputs: [], name: "TotalValueIsZero", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "PYTH_ADDRESS",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes[]", name: "priceUpdates", type: "bytes[]" }],
    name: "getBasketValue",
    outputs: [
      { internalType: "int64", name: "totalValue", type: "int64" },
      { internalType: "int64[]", name: "tokenValues", type: "int64[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_token", type: "address" }],
    name: "getTokenPrice",
    outputs: [{ internalType: "int64", name: "", type: "int64" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokens",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokensInfo",
    outputs: [
      { internalType: "address[]", name: "_tokens", type: "address[]" },
      { internalType: "uint256[]", name: "_percentages", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokensLength",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_owner", type: "address" },
      { internalType: "address[]", name: "_tokens", type: "address[]" },
      { internalType: "uint256[]", name: "_percentages", type: "uint256[]" },
      { internalType: "bytes32[]", name: "_priceFeedIds", type: "bytes32[]" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes[]", name: "priceUpdates", type: "bytes[]" }],
    name: "rebalanceBasket",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "tokenPercentage",
    outputs: [{ internalType: "uint256", name: "percentage", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "tokenPriceFeedId",
    outputs: [{ internalType: "bytes32", name: "priceFeedId", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "tokens",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes[]", name: "priceUpdates", type: "bytes[]" }],
    name: "updatePriceFeeds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
] as const;

// ERC20 ABI (minimal for balance and metadata)
const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function getPimlicoClients(forceNew = false, nickname?: string) {
  if (!PIMLICO_API_KEY) throw new Error("Missing PIMLICO_API_KEY");

  const LS_KEY = "potato:pk";
  let pk: Hex | undefined;
  if (!pk) {
    const stored = typeof window !== "undefined" ? (localStorage.getItem(LS_KEY) as Hex | null) : null;
    if (stored && stored.startsWith("0x") && !forceNew) {
      pk = stored as Hex;
      console.info("[passkey] loaded existing private key from localStorage");
    } else {
      // Try passkey-backed key derivation
      // Any errors thrown here should bubble up
      pk = await generatePrivateKeyWithPasskey(forceNew, nickname);
      if (!pk) {
        throw new Error("Passkey authentication was cancelled or failed");
      }
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LS_KEY, pk);
        } catch (e) {
          console.warn("[passkey] Could not save to localStorage", e);
        }
      }
    }
  }

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http("https://eth-sepolia.g.alchemy.com/v2/alvfYVoqtfz_sWLhV9o9AN0Z9HQyyb3O"),
  });

  const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`;

  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  });

  const account = await toSafeSmartAccount({
    client: publicClient,
    owners: [privateKeyToAccount(pk as Hex)],
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
    version: "1.4.1",
  });

  const smartAccountClient = createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast;
      },
    },
  });

  return { publicClient, pimlicoClient, smartAccountClient, account };
}

// WebAuthn-based private key derivation (client-only, no server):
// 1) If we have a stored credentialId, derive PK from it (deterministic).
// 2) Else, create a new passkey (resident credential) and derive from its id.
// NOTE: This is a demo approach. In production, use a server to manage
// challenges and consider embedding signing into your AA flow directly.
async function generatePrivateKeyWithPasskey(forceNew = false, nickname?: string): Promise<Hex | undefined> {
  try {
    if (!("PublicKeyCredential" in window)) return undefined;

    const CRED_KEY = "potato:cred";
    const storedCred = localStorage.getItem(CRED_KEY);
    if (storedCred && !forceNew) {
      console.info("[passkey] using stored credential id to derive PK");
      return derivePkFromCredentialId(base64UrlToBytes(storedCred));
    }

    // If forceNew is false, ONLY try to recover existing passkey
    if (!forceNew) {
      // Try to recover an existing resident credential
      const recovered = await recoverCredentialIdWithPasskey();
      if (recovered) {
        const credIdB64 = bytesToBase64Url(recovered);
        localStorage.setItem(CRED_KEY, credIdB64);
        console.info("[passkey] recovered existing credential", {
          id: credIdB64,
        });
        return derivePkFromCredentialId(recovered);
      }
      // If recovery didn't find anything, throw error
      throw new Error("No existing passkey found");
    }

    // forceNew is true: Create new passkey
    const rpId = location.hostname;
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(32));

    // Use nickname if provided, otherwise use default
    const userName = nickname || "potato-user";
    const displayName = nickname ? `${nickname} (Potato)` : "Potato User";

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: { name: "Potato Finance", id: rpId },
      user: { id: userId, name: userName, displayName: displayName },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "preferred",
      },
      attestation: "none",
    };

    const cred = (await navigator.credentials.create({
      publicKey,
    })) as PublicKeyCredential | null;
    if (!cred) {
      throw new Error("Passkey creation was cancelled");
    }

    const rawId = new Uint8Array(cred.rawId);
    const credIdB64 = bytesToBase64Url(rawId);
    localStorage.setItem(CRED_KEY, credIdB64);
    console.info("[passkey] created new credential", { id: credIdB64 });
    return derivePkFromCredentialId(rawId);
  } catch (err) {
    console.error("[passkey] generation error", err);
    // Re-throw to let caller handle
    throw err;
  }
}

// Check if passkeys are available on this device
export async function checkPasskeyAvailability(): Promise<boolean> {
  try {
    if (!("PublicKeyCredential" in window)) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "===".slice((b64.length % 4) - 1);
  const str = atob(b64 + pad);
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i);
  return out;
}

async function recoverCredentialIdWithPasskey(): Promise<Uint8Array | undefined> {
  if (!("PublicKeyCredential" in window)) return undefined;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge,
    userVerification: "preferred",
  };
  const cred = (await navigator.credentials.get({
    publicKey,
    // Allow conditional/optional mediation where supported
    mediation: "optional" as CredentialMediationRequirement,
  })) as PublicKeyCredential | null;
  if (!cred) {
    throw new Error("Passkey selection was cancelled");
  }
  return new Uint8Array(cred.rawId);
}

async function derivePkFromCredentialId(rawId: Uint8Array): Promise<Hex> {
  // Hash rawId with SHA-256, map into secp256k1 order
  const digestBuf = await crypto.subtle.digest("SHA-256", rawId as unknown as BufferSource);
  const digest = new Uint8Array(digestBuf);
  const hex = bytesToHex(digest);
  const n = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
  let x = BigInt("0x" + hex);
  x = (x % (n - 1n)) + 1n; // in [1, n-1]
  const out = "0x" + x.toString(16).padStart(64, "0");
  console.info("[passkey] derived PK from credential id");
  return out as Hex;
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Get the current wallet address
export async function getWalletAddress(): Promise<string> {
  const { account } = await getPimlicoClients();
  return account.address;
}

// Check if a nickname is already set for the wallet address
export async function getExistingNickname(address?: string): Promise<string | null> {
  try {
    const { publicClient, account } = await getPimlicoClients();
    const walletAddress = address || account.address;

    const result = await publicClient.readContract({
      address: SETUP_CONTRACT_ADDRESS,
      abi: SETUP_CONTRACT_ABI,
      functionName: "ownerNickname",
      args: [walletAddress as `0x${string}`],
    });

    // If nickname is empty string, return null
    return result && result.length > 0 ? result : null;
  } catch (error) {
    console.error("Error fetching existing nickname:", error);
    return null;
  }
}

export async function sendSetupTransaction(nickname: string) {
  // Validate nickname is not empty
  const trimmedNickname = nickname.trim();
  if (!trimmedNickname) {
    throw new Error("Nickname cannot be empty");
  }

  const { smartAccountClient, account, publicClient } = await getPimlicoClients();

  // Check if nickname already exists
  const existingNickname = await getExistingNickname(account.address);
  if (existingNickname) {
    throw new Error(`Nickname already set for this address: ${existingNickname}`);
  }

  // Encode the setup function call with wallet address and nickname
  const data = encodeFunctionData({
    abi: SETUP_CONTRACT_ABI,
    functionName: "setup",
    args: [account.address, trimmedNickname],
  });

  const txHash = await smartAccountClient.sendTransaction({
    to: SETUP_CONTRACT_ADDRESS,
    value: 0n,
    data,
  });

  // Log to console so it's easy to inspect
  console.log(`Setup transaction submitted: https://sepolia.etherscan.io/tx/${txHash}`);

  // Wait for transaction receipt to check status
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  console.log("Transaction receipt:", receipt);

  if (receipt.status === "reverted") {
    throw new Error(`Transaction failed. Check on Etherscan: https://sepolia.etherscan.io/tx/${txHash}`);
  }

  console.log(`Setup transaction successful: https://sepolia.etherscan.io/tx/${txHash}`);

  return txHash;
}

// Basket-related functions

export interface TokenInfo {
  address: string;
  percentage: number;
  symbol: string;
  decimals: number;
  name: string;
  balance: bigint;
  formattedBalance: string;
}

export interface BasketInfo {
  address: string;
  tokens: TokenInfo[];
}

// Get all user baskets
export async function getUserBaskets(userAddress?: string): Promise<string[]> {
  try {
    const { publicClient, account } = await getPimlicoClients();
    const address = userAddress || account.address;

    const baskets = await publicClient.readContract({
      address: BASKET_FOUNDRY_ADDRESS,
      abi: BASKET_FOUNDRY_ABI,
      functionName: "getUserBaskets",
      args: [address as `0x${string}`],
    });

    return baskets as string[];
  } catch (error) {
    console.error("Error fetching user baskets:", error);
    return [];
  }
}

// Get token info for a basket
export async function getBasketTokensInfo(basketAddress: string): Promise<{ tokens: string[]; percentages: bigint[] }> {
  const { publicClient } = await getPimlicoClients();

  const result = await publicClient.readContract({
    address: basketAddress as `0x${string}`,
    abi: BASKET_ABI,
    functionName: "getTokensInfo",
  });

  return {
    tokens: result[0] as string[],
    percentages: result[1] as bigint[],
  };
}

// Get ERC20 token metadata
export async function getTokenMetadata(tokenAddress: string): Promise<{
  symbol: string;
  decimals: number;
  name: string;
}> {
  const { publicClient } = await getPimlicoClients();

  const [symbol, decimals, name] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "symbol",
    }),
    publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "decimals",
    }),
    publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "name",
    }),
  ]);

  return {
    symbol: symbol as string,
    decimals: Number(decimals),
    name: name as string,
  };
}

// Get token balance for a specific holder (basket)
export async function getTokenBalance(tokenAddress: string, holderAddress: string): Promise<bigint> {
  const { publicClient } = await getPimlicoClients();

  const balance = await publicClient.readContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [holderAddress as `0x${string}`],
  });

  return balance as bigint;
}

// Format token amount with decimals
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (fractionalPart === 0n) {
    return wholePart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  // Remove trailing zeros
  const trimmedFractional = fractionalStr.replace(/0+$/, "");

  if (trimmedFractional.length === 0) {
    return wholePart.toString();
  }

  return `${wholePart}.${trimmedFractional}`;
}

// Get complete basket info with token balances
export async function getBasketInfo(basketAddress: string): Promise<BasketInfo> {
  try {
    // Get tokens and percentages
    const { tokens, percentages } = await getBasketTokensInfo(basketAddress);

    // Get metadata and balance for each token
    const tokenInfoPromises = tokens.map(async (tokenAddress, index) => {
      const [metadata, balance] = await Promise.all([
        getTokenMetadata(tokenAddress),
        getTokenBalance(tokenAddress, basketAddress),
      ]);

      return {
        address: tokenAddress,
        percentage: Number(percentages[index]),
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        name: metadata.name,
        balance,
        formattedBalance: formatTokenAmount(balance, metadata.decimals),
      };
    });

    const tokenInfos = await Promise.all(tokenInfoPromises);

    return {
      address: basketAddress,
      tokens: tokenInfos,
    };
  } catch (error) {
    console.error("Error fetching basket info:", error);
    throw error;
  }
}

// Get all baskets info for a user
export async function getAllUserBasketsInfo(userAddress?: string): Promise<BasketInfo[]> {
  const baskets = await getUserBaskets(userAddress);
  const basketInfoPromises = baskets.map((basketAddress) => getBasketInfo(basketAddress));
  return Promise.all(basketInfoPromises);
}

// Pyth price feed IDs
const PYTH_PRICE_FEED_IDS = {
  BTC: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  PYUSD: "0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692",
};

// Fetch price feed data from Pyth
export async function fetchPriceFeedData(): Promise<string[]> {
  const ids = Object.values(PYTH_PRICE_FEED_IDS);
  const idsParam = ids.map((id) => `ids[]=${id}`).join("&");
  const url = `https://hermes.pyth.network/v2/updates/price/latest?${idsParam}`;

  console.log("Fetching price feed data from:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch price feed data");
  }

  const data = await response.json();
  console.log("Price feed data received:", {
    dataLength: data.binary.data.length,
    parsed: data.parsed,
  });

  // Return the binary data as needed for the contract
  // The API returns data.binary.data which is an array of hex strings
  // Format: bytes[] - flat array of hex strings with 0x prefix
  const priceUpdates = data.binary.data.map((hexString: string) => `0x${hexString}`);

  console.log("Formatted price updates:", priceUpdates.length, "price updates");
  return priceUpdates;
}

// Get prices from Pyth API
async function getPrices(): Promise<Record<string, number>> {
  const ids = Object.values(PYTH_PRICE_FEED_IDS);
  const idsParam = ids.map((id) => `ids[]=${id}`).join("&");
  const url = `https://hermes.pyth.network/v2/updates/price/latest?${idsParam}&parsed=true`;

  console.log("Fetching prices from:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch price data");
  }

  const data = await response.json();
  console.log("Raw price data:", data);

  // Create a map of symbol to price
  const prices: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.parsed.forEach((priceData: any) => {
    // Normalize the ID (ensure it has 0x prefix)
    const id = priceData.id.startsWith("0x") ? priceData.id : `0x${priceData.id}`;

    console.log("Processing price feed:", {
      rawId: priceData.id,
      normalizedId: id,
      price: priceData.price.price,
      expo: priceData.price.expo,
    });

    // Price is in expo format, so we need to apply the exponent
    const price = Number(priceData.price.price) / Math.pow(10, Math.abs(priceData.price.expo));

    // Map feed ID to symbol - normalize both sides for comparison
    const btcId = PYTH_PRICE_FEED_IDS.BTC.toLowerCase();
    const ethId = PYTH_PRICE_FEED_IDS.ETH.toLowerCase();
    const pyusdId = PYTH_PRICE_FEED_IDS.PYUSD.toLowerCase();
    const normalizedId = id.toLowerCase();

    console.log("Comparing:", { normalizedId, btcId, ethId, pyusdId });

    if (normalizedId === btcId) {
      prices.BTC = price;
      console.log("✅ Set BTC price:", price);
    }
    if (normalizedId === ethId) {
      prices.ETH = price;
      console.log("✅ Set ETH price:", price);
    }
    if (normalizedId === pyusdId) {
      prices.PYUSD = price;
      console.log("✅ Set PYUSD price:", price);
    }
  });

  console.log("Final prices:", prices);
  return prices;
}

// Calculate basket total value from token balances and prices
export async function calculateBasketValue(
  tokens: TokenInfo[]
): Promise<{ totalValue: number; tokenValues: number[] }> {
  try {
    const prices = await getPrices();

    const tokenValues = tokens.map((token) => {
      // Get price for this token symbol
      let price = 0;
      if (token.symbol.includes("BTC")) price = prices.BTC || 0;
      else if (token.symbol.includes("ETH")) price = prices.ETH || 0;
      else if (token.symbol.includes("PYUSD")) price = prices.PYUSD || 0;

      // Calculate value: balance (in tokens) * price (per token)
      // Balance is already formatted as a number with proper decimals
      const balance = Number(token.formattedBalance);
      const value = balance * price;

      console.log(`${token.symbol}: ${balance} tokens × $${price} = $${value}`);
      return value;
    });

    const totalValue = tokenValues.reduce((sum, val) => sum + val, 0);

    console.log("Total basket value:", totalValue, "Token values:", tokenValues);
    return { totalValue, tokenValues };
  } catch (error) {
    console.error("Error calculating basket value:", error);
    return { totalValue: 0, tokenValues: [] };
  }
}

// Rebalance a basket
export async function rebalanceBasket(basketAddress: string): Promise<string> {
  console.log("🔄 Starting rebalance for basket:", basketAddress);

  try {
    const { smartAccountClient } = await getPimlicoClients();
    console.log("✅ Got Pimlico clients");

    // First check if basket has any tokens
    console.log("🔍 Checking basket token balances...");
    const basketInfo = await getBasketInfo(basketAddress);
    const hasBalance = basketInfo.tokens.some((token) => token.balance > 0n);

    if (!hasBalance) {
      throw new Error(
        `❌ Cannot rebalance empty basket!\n\n` +
          `Your basket has no tokens. Please deposit tokens to your basket endpoint first.\n\n` +
          `Token balances:\n` +
          basketInfo.tokens.map((t) => `  • ${t.symbol}: ${t.formattedBalance}`).join("\n")
      );
    }

    console.log("✅ Basket has tokens:", basketInfo.tokens.map((t) => `${t.symbol}: ${t.formattedBalance}`).join(", "));

    const priceUpdates = await fetchPriceFeedData();
    console.log("✅ Got price feed data:", priceUpdates.length, "price updates");
    console.log("📊 Price updates (bytes[]):");
    priceUpdates.forEach((p, i) => {
      console.log(`  [${i}]: ${p.slice(0, 30)}...${p.slice(-20)} (${p.length} chars total)`);
    });

    // Encode the function call data
    const callData = encodeFunctionData({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      abi: BASKET_ABI as any,
      functionName: "rebalanceBasket",
      args: [priceUpdates],
    });

    console.log("📦 Encoded calldata:");
    console.log("  Function selector:", callData.slice(0, 10));
    console.log("  Full calldata length:", callData.length, "chars");
    console.log("  First 100 chars:", callData.slice(0, 100));
    console.log(
      "  Args being sent:",
      JSON.stringify({ priceUpdates: priceUpdates.map((p) => `${p.slice(0, 20)}...`) })
    );

    console.log("📤 Sending rebalance transaction...");
    console.log("  To:", basketAddress);
    console.log("  Value: 0 ETH (no fee required)");

    const txHash = await smartAccountClient.sendTransaction({
      to: basketAddress as `0x${string}`,
      value: 0n, // No ETH needed - contract handles fees internally
      data: callData,
    });

    console.log("✅ Rebalance transaction sent:", txHash);
    console.log("🔗 View on Etherscan:", `https://sepolia.etherscan.io/tx/${txHash}`);

    // Return immediately without waiting for confirmation
    // This allows the transaction to be submitted and debugged on-chain even if it fails
    console.log("⚠️ Transaction submitted - check Etherscan to see if it succeeds or reverts");
    console.log(`📝 Debug URL: https://sepolia.etherscan.io/tx/${txHash}`);

    // Note: We no longer wait for confirmation here, so the transaction can be debugged on-chain
    // If you want to check the status, look at the Etherscan link

    return txHash;
  } catch (error) {
    console.error("❌ Rebalance error:", error);
    throw error;
  }
}
