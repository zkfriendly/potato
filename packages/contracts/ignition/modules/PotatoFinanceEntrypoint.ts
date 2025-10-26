import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PotatoFinanceEntrypointModule", (m) => {
  const deployer = m.getAccount(0);

  // BasketFoundry address
  const basketFoundry = m.getParameter("basketFoundry", "0xbb3f4d19D323760e6407606b80b73151094a7A62");

  const potatoFinanceEntrypoint = m.contract("PotatoFinanceEntrypoint", [basketFoundry], {
    from: deployer,
  });
  return { potatoFinanceEntrypoint };
});
