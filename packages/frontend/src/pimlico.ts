import type { Hex } from "viem";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
// Avoid subpath import issues: inline the known EntryPoint v0.7 address
const entryPoint07Address =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as const;
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { PIMLICO_API_KEY } from "./config";

// Setup contract address on Sepolia
const SETUP_CONTRACT_ADDRESS =
  "0x27D5ca4840b04Aa0e6B1C7f864C5802307476526" as const;

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

export async function getPimlicoClients(forceNew = false) {
  if (!PIMLICO_API_KEY) throw new Error("Missing PIMLICO_API_KEY");

  const LS_KEY = "potato:pk";
  let pk: Hex | undefined;
  if (!pk) {
    const stored =
      typeof window !== "undefined"
        ? (localStorage.getItem(LS_KEY) as Hex | null)
        : null;
    if (stored && stored.startsWith("0x") && !forceNew) {
      pk = stored as Hex;
      console.info("[passkey] loaded existing private key from localStorage");
    } else {
      // Try passkey-backed key derivation
      // Any errors thrown here should bubble up
      pk = await generatePrivateKeyWithPasskey(forceNew);
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
    transport: http("https://sepolia.rpc.thirdweb.com"),
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
async function generatePrivateKeyWithPasskey(
  forceNew = false
): Promise<Hex | undefined> {
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
    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: { name: "Potato Finance", id: rpId },
      user: { id: userId, name: "potato-user", displayName: "Potato User" },
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

async function recoverCredentialIdWithPasskey(): Promise<
  Uint8Array | undefined
> {
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
  const digestBuf = await crypto.subtle.digest(
    "SHA-256",
    rawId as unknown as BufferSource
  );
  const digest = new Uint8Array(digestBuf);
  const hex = bytesToHex(digest);
  const n = BigInt(
    "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"
  );
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
export async function getExistingNickname(
  address?: string
): Promise<string | null> {
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

  const { smartAccountClient, account, publicClient } =
    await getPimlicoClients();

  // Check if nickname already exists
  const existingNickname = await getExistingNickname(account.address);
  if (existingNickname) {
    throw new Error(
      `Nickname already set for this address: ${existingNickname}`
    );
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
  console.log(
    `Setup transaction submitted: https://sepolia.etherscan.io/tx/${txHash}`
  );

  // Wait for transaction receipt to check status
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  console.log("Transaction receipt:", receipt);

  if (receipt.status === "reverted") {
    throw new Error(
      `Transaction failed. Check on Etherscan: https://sepolia.etherscan.io/tx/${txHash}`
    );
  }

  console.log(
    `Setup transaction successful: https://sepolia.etherscan.io/tx/${txHash}`
  );

  return txHash;
}
