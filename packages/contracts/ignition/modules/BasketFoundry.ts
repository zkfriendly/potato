import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BasketFoundryModule", (m) => {
  const deployer = m.getAccount(0);

  // Basket implementation address
  const basketImplementation = m.getParameter("basketImplementation", "0xbC847fCbd4868D507592AF69eDA02AE47c6ac7EF");

  const basketFoundry = m.contract("BasketFoundry", [basketImplementation], {
    from: deployer,
  });

  return { basketFoundry };
});
