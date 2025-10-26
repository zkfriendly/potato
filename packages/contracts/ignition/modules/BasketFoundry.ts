import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BasketImplementationModule from "./BasketImplementation";

export default buildModule("BasketFoundryModule", (m) => {
  const deployer = m.getAccount(0);

  // Use the deployed BasketImplementation from the module
  const { basketImplementation } = m.useModule(BasketImplementationModule);

  const basketFoundry = m.contract("BasketFoundry", [basketImplementation], {
    from: deployer,
  });

  return { basketFoundry, basketImplementation };
});
