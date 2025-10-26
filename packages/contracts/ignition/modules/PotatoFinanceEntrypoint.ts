import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PotatoFinanceEntrypointModule", (m) => {
  const deployer = m.getAccount(0);

  // BasketFoundry address
  const basketFoundry = m.getParameter("basketFoundry", "0x7F5256136c384A4Da19B44420e4C98d556a60381");

  const potatoFinanceEntrypoint = m.contract("PotatoFinanceEntrypoint", [basketFoundry], {
    from: deployer,
  });
  return { potatoFinanceEntrypoint };
});
