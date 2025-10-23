import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PortfolioFoundryModule", (m) => {
  const owner = m.getAccount(0); // Uses the first account as owner
  
  const portfolioFoundry = m.contract("PortfolioFoundry", [owner]);

  return { portfolioFoundry };
});

