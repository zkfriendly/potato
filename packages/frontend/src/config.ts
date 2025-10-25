import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { porto } from "wagmi/connectors";

export const config = createConfig({
  chains: [sepolia],
  connectors: [porto()],
  transports: {
    [sepolia.id]: http(),
  },
});
