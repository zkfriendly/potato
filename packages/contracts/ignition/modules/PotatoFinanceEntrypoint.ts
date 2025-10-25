import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PotatoFinanceEntrypointModule", (m) => {
  const deployer = m.getAccount(0);

  const potatoFinanceEntrypoint = m.contract("PotatoFinanceEntrypoint", [], {
    from: deployer,
  });
  return { potatoFinanceEntrypoint };
});
