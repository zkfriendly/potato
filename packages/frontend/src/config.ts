// Pimlico configuration helpers for the frontend
export const PIMLICO_API_KEY = import.meta.env.VITE_PIMLICO_API_KEY as
  | string
  | undefined;

export const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY as
  | `0x${string}`
  | undefined;

export const CHAIN = "sepolia" as const;

// Minimal wagmi config (no wallet connectors) to keep app booting
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});
