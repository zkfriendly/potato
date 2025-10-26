import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BasketFoundryModule", (m) => {
  const deployer = m.getAccount(0);

  // Basket implementation address
  const basketImplementation = m.getParameter("basketImplementation", "0x6841214e8c675AA444932dE6cBde2D30A9BB88e5");

  const basketFoundry = m.contract("BasketFoundry", [basketImplementation], {
    from: deployer,
  });

  return { basketFoundry };
});
