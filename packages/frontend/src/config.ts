// Pimlico configuration helpers for the frontend
export const PIMLICO_API_KEY = import.meta.env.VITE_PIMLICO_API_KEY as
  | string
  | undefined;

export const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY as
  | `0x${string}`
  | undefined;

export const CHAIN = "sepolia" as const;

// Minimal wagmi config (no wallet connectors) to keep app booting
// If you later add passkey-capable connectors, wire them here.
export const config = undefined as unknown as never;
