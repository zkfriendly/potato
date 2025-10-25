import type { Hex } from "viem";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
// Avoid subpath import issues: inline the known EntryPoint v0.7 address
const entryPoint07Address =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as const;
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { PIMLICO_API_KEY } from "./config";

export async function getPimlicoClients() {
  if (!PIMLICO_API_KEY) throw new Error("Missing PIMLICO_API_KEY");

  const LS_KEY = "potato:pk";
  let pk: Hex | undefined;
  if (!pk) {
    try {
      const stored =
        typeof window !== "undefined"
          ? (localStorage.getItem(LS_KEY) as Hex | null)
          : null;
      if (stored && stored.startsWith("0x")) {
        pk = stored as Hex;
        console.info("[passkey] loaded existing private key from localStorage");
      } else {
        // Try passkey-backed key derivation first
        pk = await generatePrivateKeyWithPasskey().catch(() => undefined);
        if (!pk) {
          const generated = generatePrivateKey();
          pk = generated as Hex;
          console.warn(
            "[passkey] WebAuthn unavailable or failed, using random PK fallback"
          );
        }
        if (typeof window !== "undefined") localStorage.setItem(LS_KEY, pk);
      }
    } catch {
      // fallback if localStorage blocked
      pk = generatePrivateKey() as Hex;
      console.warn("[passkey] localStorage blocked, generated ephemeral PK");
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
async function generatePrivateKeyWithPasskey(): Promise<Hex | undefined> {
  try {
    if (!("PublicKeyCredential" in window)) return undefined;

    const CRED_KEY = "potato:cred";
    const storedCred = localStorage.getItem(CRED_KEY);
    if (storedCred) {
      console.info("[passkey] using stored credential id to derive PK");
      return derivePkFromCredentialId(base64UrlToBytes(storedCred));
    }

    // Try to recover an existing resident credential (e.g., user cleared localStorage)
    const recovered = await recoverCredentialIdWithPasskey();
    if (recovered) {
      const credIdB64 = bytesToBase64Url(recovered);
      localStorage.setItem(CRED_KEY, credIdB64);
      console.info("[passkey] recovered existing credential", {
        id: credIdB64,
      });
      return derivePkFromCredentialId(recovered);
    }

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
    if (!cred) return undefined;

    const rawId = new Uint8Array(cred.rawId);
    const credIdB64 = bytesToBase64Url(rawId);
    localStorage.setItem(CRED_KEY, credIdB64);
    console.info("[passkey] created new credential", { id: credIdB64 });
    return derivePkFromCredentialId(rawId);
  } catch (err) {
    console.error("[passkey] generation error", err);
    return undefined;
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
  try {
    if (!("PublicKeyCredential" in window)) return undefined;
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge,
      userVerification: "preferred",
    };
    const cred = (await navigator.credentials.get({
      publicKey,
      // Allow conditional/optional mediation where supported
      ...({ mediation: "optional" } as any),
    })) as PublicKeyCredential | null;
    if (!cred) return undefined;
    return new Uint8Array(cred.rawId);
  } catch (err) {
    console.warn("[passkey] credential recovery failed", err);
    return undefined;
  }
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

export async function sendExampleGaslessTx() {
  const { smartAccountClient } = await getPimlicoClients();
  const txHash = await smartAccountClient.sendTransaction({
    to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    value: 0n,
    data: "0x1234",
  });
  // Log to console so it’s easy to inspect
  console.log(
    `User operation included: https://sepolia.etherscan.io/tx/${txHash}`
  );
  return txHash;
}
