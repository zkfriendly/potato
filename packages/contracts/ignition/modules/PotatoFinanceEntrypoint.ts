import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BasketFoundryModule from "./BasketFoundry";

export default buildModule("PotatoFinanceEntrypointModule", (m) => {
  const deployer = m.getAccount(0);

  // Use the deployed BasketFoundry from the module
  const { basketFoundry, basketImplementation } = m.useModule(BasketFoundryModule);

  const potatoFinanceEntrypoint = m.contract("PotatoFinanceEntrypoint", [basketFoundry], {
    from: deployer,
  });

  return { potatoFinanceEntrypoint, basketFoundry, basketImplementation };
});
