import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PotatoFinanceEntrypointModule", (m) => {
  const deployer = m.getAccount(0);

  // BasketFoundry address
  const basketFoundry = m.getParameter("basketFoundry", "0x268c1dfd21A772D392981E070334C2a5dC3DD539");

  const potatoFinanceEntrypoint = m.contract("PotatoFinanceEntrypoint", [basketFoundry], {
    from: deployer,
  });
  return { potatoFinanceEntrypoint };
});
