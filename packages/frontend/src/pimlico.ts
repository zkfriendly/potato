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
import { PIMLICO_API_KEY, PRIVATE_KEY } from "./config";

export async function getPimlicoClients() {
  if (!PIMLICO_API_KEY) throw new Error("Missing PIMLICO_API_KEY");

  const LS_KEY = "potato:pk";
  let pk: Hex | undefined = PRIVATE_KEY as Hex | undefined;
  if (!pk) {
    try {
      const stored =
        typeof window !== "undefined"
          ? (localStorage.getItem(LS_KEY) as Hex | null)
          : null;
      if (stored && stored.startsWith("0x")) {
        pk = stored as Hex;
      } else {
        const generated = generatePrivateKey();
        if (typeof window !== "undefined")
          localStorage.setItem(LS_KEY, generated);
        pk = generated as Hex;
      }
    } catch (e) {
      // fallback if localStorage blocked
      pk = generatePrivateKey() as Hex;
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
