import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BasketImplementationModule", (m) => {
  const deployer = m.getAccount(0);

  const basketImplementation = m.contract("Basket", [], {
    from: deployer,
    id: "BasketImplementation",
  });

  return { basketImplementation };
});
