import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MockTokensModule", (m) => {
  const deployer = m.getAccount(0);

  const wbtc = m.contract("MockERC20", ["Wrapped Bitcoin", "WBTC"], {
    from: deployer,
    id: "WBTC",
  });

  const weth = m.contract("MockERC20", ["Wrapped Ether", "WETH"], {
    from: deployer,
    id: "WETH",
  });

  const pyusd = m.contract("MockERC20", ["PayPal USD", "PYUSD"], {
    from: deployer,
    id: "PYUSD",
  });

  return { wbtc, weth, pyusd };
});
