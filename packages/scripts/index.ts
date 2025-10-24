import { readFileSync } from "fs";
import { join } from "path";

interface BacktestConfig {
  startDate: string;
  endDate: string;
  tokens: string[];
  weights: number[];
  rebalanceThreshold: number;
  initialInvestment: number;
}

interface PriceData {
  timestamp: number;
  prices: { [token: string]: number };
}

interface PortfolioState {
  timestamp: number;
  holdings: { [token: string]: number };
  totalValue: number;
  allocations: { [token: string]: number };
}

interface BacktestResults {
  strategy: "rebalancing" | "hold";
  finalValue: number;
  totalReturn: number;
  numRebalances?: number;
  transactions?: Array<{
    timestamp: number;
    action: string;
    trades: { [token: string]: number };
  }>;
  dailyValues: Array<{ date: string; value: number }>;
}

/**
 * Parse CSV file from CoinMarketCap format
 */
function parseCSV(
  filePath: string
): Array<{ timestamp: number; price: number }> {
  console.log(`Reading ${filePath}...`);

  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  // Skip header
  const dataLines = lines.slice(1);

  const priceData: Array<{ timestamp: number; price: number }> = [];

  for (const line of dataLines) {
    if (!line.trim()) continue; // Skip empty lines

    // Split by semicolon
    const parts = line.split(";");

    if (parts.length < 13) {
      console.warn(`  Skipping malformed line: ${line.substring(0, 50)}...`);
      continue;
    }

    // Extract timestamp (last column) and close price (column index 8)
    // timeOpen;timeClose;timeHigh;timeLow;name;open;high;low;close;volume;marketCap;circulatingSupply;timestamp
    // 0      ;1        ;2       ;3      ;4   ;5   ;6   ;7  ;8    ;9     ;10       ;11                ;12
    const timestampStr = parts[12]?.replace(/"/g, "").trim(); // Remove quotes and whitespace
    const closeStr = parts[8]?.trim(); // close price

    if (timestampStr && closeStr) {
      const timestamp = new Date(timestampStr).getTime();
      const price = parseFloat(closeStr);

      if (!isNaN(timestamp) && !isNaN(price) && price > 0) {
        priceData.push({ timestamp, price });
      }
    }
  }

  // Sort by timestamp (oldest first)
  priceData.sort((a, b) => a.timestamp - b.timestamp);

  console.log(`  Loaded ${priceData.length} data points`);
  if (priceData.length > 0) {
    const firstEntry = priceData[0]!;
    const lastEntry = priceData[priceData.length - 1]!;
    console.log(
      `  Date range: ${
        new Date(firstEntry.timestamp).toISOString().split("T")[0]
      } to ${new Date(lastEntry.timestamp).toISOString().split("T")[0]}`
    );
    console.log(
      `  Price range: $${firstEntry.price.toLocaleString()} to $${lastEntry.price.toLocaleString()}`
    );
  }

  return priceData;
}

/**
 * Align price data for all tokens to common timestamps
 */
function alignPriceData(
  pricesMap: Map<string, Array<{ timestamp: number; price: number }>>
): PriceData[] {
  const allTimestamps = new Set<number>();

  // Collect all unique timestamps (rounded to day)
  for (const prices of pricesMap.values()) {
    prices.forEach((p) => {
      const dayTimestamp =
        Math.floor(p.timestamp / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
      allTimestamps.add(dayTimestamp);
    });
  }

  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  // Create aligned price data
  const alignedData: PriceData[] = [];

  for (const timestamp of sortedTimestamps) {
    const prices: { [token: string]: number } = {};
    let hasAllPrices = true;

    for (const [token, priceArray] of pricesMap.entries()) {
      // Find closest price to this timestamp
      const closest = priceArray.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.timestamp - timestamp);
        const currDiff = Math.abs(curr.timestamp - timestamp);
        return currDiff < prevDiff ? curr : prev;
      });

      // Only include if within 24 hours
      if (Math.abs(closest.timestamp - timestamp) < 24 * 60 * 60 * 1000) {
        prices[token] = closest.price;
      } else {
        hasAllPrices = false;
        break;
      }
    }

    if (hasAllPrices) {
      alignedData.push({ timestamp, prices });
    }
  }

  return alignedData;
}

/**
 * Calculate current portfolio value and allocations
 */
function calculatePortfolioState(
  holdings: { [token: string]: number },
  prices: { [token: string]: number },
  timestamp: number
): PortfolioState {
  const allocations: { [token: string]: number } = {};
  let totalValue = 0;

  // Calculate total value
  for (const [token, amount] of Object.entries(holdings)) {
    const price = prices[token];
    if (price === undefined) {
      throw new Error(`Price not found for token: ${token}`);
    }
    const value = amount * price;
    totalValue += value;
  }

  // Calculate allocations
  for (const [token, amount] of Object.entries(holdings)) {
    const price = prices[token];
    if (price === undefined) {
      throw new Error(`Price not found for token: ${token}`);
    }
    const value = amount * price;
    allocations[token] = totalValue > 0 ? value / totalValue : 0;
  }

  return {
    timestamp,
    holdings: { ...holdings },
    totalValue,
    allocations,
  };
}

/**
 * Check if rebalancing is needed
 */
function needsRebalancing(
  currentAllocations: { [token: string]: number },
  targetWeights: { [token: string]: number },
  threshold: number
): boolean {
  for (const [token, currentAlloc] of Object.entries(currentAllocations)) {
    const targetAlloc = targetWeights[token];
    if (targetAlloc === undefined) {
      throw new Error(`Target weight not found for token: ${token}`);
    }
    const drift = Math.abs(currentAlloc - targetAlloc);
    if (drift > threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Rebalance portfolio to target weights
 */
function rebalancePortfolio(
  currentHoldings: { [token: string]: number },
  currentPrices: { [token: string]: number },
  targetWeights: { [token: string]: number }
): {
  holdings: { [token: string]: number };
  trades: { [token: string]: number };
} {
  const totalValue = Object.entries(currentHoldings).reduce(
    (sum, [token, amount]) => {
      const price = currentPrices[token];
      if (price === undefined) {
        throw new Error(`Price not found for token: ${token}`);
      }
      return sum + amount * price;
    },
    0
  );

  const newHoldings: { [token: string]: number } = {};
  const trades: { [token: string]: number } = {};

  for (const [token, weight] of Object.entries(targetWeights)) {
    const price = currentPrices[token];
    if (price === undefined) {
      throw new Error(`Price not found for token: ${token}`);
    }
    const targetValue = totalValue * weight;
    const newAmount = targetValue / price;
    newHoldings[token] = newAmount;
    const currentAmount = currentHoldings[token];
    if (currentAmount === undefined) {
      throw new Error(`Current holding not found for token: ${token}`);
    }
    trades[token] = newAmount - currentAmount;
  }

  return { holdings: newHoldings, trades };
}

/**
 * Run backtesting with rebalancing strategy
 */
function runRebalancingBacktest(
  config: BacktestConfig,
  priceData: PriceData[]
): BacktestResults {
  const { tokens, weights, rebalanceThreshold, initialInvestment } = config;

  // Initialize portfolio
  const targetWeights: { [token: string]: number } = {};
  tokens.forEach((token, i) => {
    const weight = weights[i];
    if (weight === undefined) {
      throw new Error(`Weight not found for token at index ${i}`);
    }
    targetWeights[token] = weight;
  });

  // Initial purchase
  const firstDay = priceData[0];
  if (!firstDay) {
    throw new Error("No price data available");
  }
  const initialPrices = firstDay.prices;
  let holdings: { [token: string]: number } = {};
  for (const [token, weight] of Object.entries(targetWeights)) {
    const price = initialPrices[token];
    if (price === undefined) {
      throw new Error(`Initial price not found for token: ${token}`);
    }
    const allocation = initialInvestment * weight;
    holdings[token] = allocation / price;
  }

  const transactions: Array<{
    timestamp: number;
    action: string;
    trades: { [token: string]: number };
  }> = [];

  const dailyValues: Array<{ date: string; value: number }> = [];
  let numRebalances = 0;

  // Simulate each day
  for (const dayData of priceData) {
    const state = calculatePortfolioState(
      holdings,
      dayData.prices,
      dayData.timestamp
    );

    // Check if rebalancing is needed
    if (
      needsRebalancing(state.allocations, targetWeights, rebalanceThreshold)
    ) {
      const { holdings: newHoldings, trades } = rebalancePortfolio(
        holdings,
        dayData.prices,
        targetWeights
      );

      transactions.push({
        timestamp: dayData.timestamp,
        action: "rebalance",
        trades,
      });

      holdings = newHoldings;
      numRebalances++;
    }

    // Record daily value
    const dateStr = new Date(dayData.timestamp).toISOString().split("T")[0];
    if (dateStr === undefined) {
      throw new Error("Failed to format date");
    }
    dailyValues.push({
      date: dateStr,
      value: state.totalValue,
    });
  }

  // Calculate final value
  const lastDay = priceData[priceData.length - 1];
  if (!lastDay) {
    throw new Error("No final price data available");
  }
  const finalPrices = lastDay.prices;
  const finalState = calculatePortfolioState(
    holdings,
    finalPrices,
    lastDay.timestamp
  );

  return {
    strategy: "rebalancing",
    finalValue: finalState.totalValue,
    totalReturn:
      ((finalState.totalValue - initialInvestment) / initialInvestment) * 100,
    numRebalances,
    transactions,
    dailyValues,
  };
}

/**
 * Run backtesting with buy-and-hold strategy
 */
function runHoldBacktest(
  config: BacktestConfig,
  priceData: PriceData[]
): BacktestResults {
  const { tokens, weights, initialInvestment } = config;

  // Initial purchase
  const firstDay = priceData[0];
  if (!firstDay) {
    throw new Error("No price data available");
  }
  const initialPrices = firstDay.prices;
  const holdings: { [token: string]: number } = {};
  tokens.forEach((token, i) => {
    const weight = weights[i];
    if (weight === undefined) {
      throw new Error(`Weight not found for token at index ${i}`);
    }
    const price = initialPrices[token];
    if (price === undefined) {
      throw new Error(`Initial price not found for token: ${token}`);
    }
    const allocation = initialInvestment * weight;
    holdings[token] = allocation / price;
  });

  const dailyValues: Array<{ date: string; value: number }> = [];

  // Track portfolio value over time (no rebalancing)
  for (const dayData of priceData) {
    const state = calculatePortfolioState(
      holdings,
      dayData.prices,
      dayData.timestamp
    );
    const dateStr = new Date(dayData.timestamp).toISOString().split("T")[0];
    if (dateStr === undefined) {
      throw new Error("Failed to format date");
    }
    dailyValues.push({
      date: dateStr,
      value: state.totalValue,
    });
  }

  // Calculate final value
  const lastDay = priceData[priceData.length - 1];
  if (!lastDay) {
    throw new Error("No final price data available");
  }
  const finalPrices = lastDay.prices;
  const finalState = calculatePortfolioState(
    holdings,
    finalPrices,
    lastDay.timestamp
  );

  return {
    strategy: "hold",
    finalValue: finalState.totalValue,
    totalReturn:
      ((finalState.totalValue - initialInvestment) / initialInvestment) * 100,
    dailyValues,
  };
}

/**
 * Display results in a formatted way
 */
function displayResults(
  rebalanceResults: BacktestResults,
  holdResults: BacktestResults,
  config: BacktestConfig
) {
  console.log("\n" + "=".repeat(70));
  console.log("📊 BACKTEST RESULTS");
  console.log("=".repeat(70));

  console.log("\n📋 Configuration:");
  console.log(`  Period: ${config.startDate} to ${config.endDate}`);
  console.log(`  Tokens: ${config.tokens.join(", ")}`);
  console.log(
    `  Target Allocation: ${config.weights
      .map((w) => `${(w * 100).toFixed(0)}%`)
      .join(" / ")}`
  );
  console.log(
    `  Rebalance Threshold: ${(config.rebalanceThreshold * 100).toFixed(1)}%`
  );
  console.log(
    `  Initial Investment: $${config.initialInvestment.toLocaleString()}`
  );

  console.log("\n🔄 REBALANCING STRATEGY:");
  console.log(
    `  Final Value: $${rebalanceResults.finalValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  );
  console.log(
    `  Total Return: ${
      rebalanceResults.totalReturn >= 0 ? "+" : ""
    }${rebalanceResults.totalReturn.toFixed(2)}%`
  );
  console.log(`  Number of Rebalances: ${rebalanceResults.numRebalances}`);

  console.log("\n💎 BUY & HOLD STRATEGY:");
  console.log(
    `  Final Value: $${holdResults.finalValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  );
  console.log(
    `  Total Return: ${
      holdResults.totalReturn >= 0 ? "+" : ""
    }${holdResults.totalReturn.toFixed(2)}%`
  );

  console.log("\n📈 COMPARISON:");
  const difference = rebalanceResults.finalValue - holdResults.finalValue;
  const percentDiff = (difference / holdResults.finalValue) * 100;
  const winner = difference > 0 ? "Rebalancing" : "Buy & Hold";

  console.log(
    `  Difference: ${difference >= 0 ? "+" : ""}$${difference.toLocaleString(
      undefined,
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )} (${percentDiff >= 0 ? "+" : ""}${percentDiff.toFixed(2)}%)`
  );
  console.log(`  Winner: ${winner} 🏆`);

  if (
    rebalanceResults.transactions &&
    rebalanceResults.transactions.length > 0
  ) {
    console.log("\n📝 Rebalancing Events (first 5):");
    const samplTransactions = rebalanceResults.transactions.slice(0, 5);
    samplTransactions.forEach((tx) => {
      const date = new Date(tx.timestamp).toISOString().split("T")[0];
      console.log(`  ${date}:`);
      for (const [token, amount] of Object.entries(tx.trades)) {
        const action = amount > 0 ? "Buy" : "Sell";
        console.log(`    ${action} ${Math.abs(amount).toFixed(6)} ${token}`);
      }
    });
    if (rebalanceResults.transactions.length > 5) {
      console.log(
        `  ... and ${rebalanceResults.transactions.length - 5} more rebalances`
      );
    }
  }

  console.log("\n" + "=".repeat(70) + "\n");
}

/**
 * Main backtest function using local CSV data
 */
async function runBacktest(
  config: BacktestConfig,
  csvFiles: Map<string, string>
) {
  console.log("🚀 Starting backtest with local data...\n");

  // Validate config
  if (config.tokens.length !== config.weights.length) {
    throw new Error("Number of tokens must match number of weights");
  }

  const sumWeights = config.weights.reduce((a, b) => a + b, 0);
  if (Math.abs(sumWeights - 1.0) > 0.001) {
    throw new Error("Weights must sum to 1.0");
  }

  // Load price data from CSV files (generate synthetic series for stablecoins like USDC)
  const pricesMap = new Map<
    string,
    Array<{ timestamp: number; price: number }>
  >();

  const dayMs = 24 * 60 * 60 * 1000;
  let minTimestamp: number | undefined;
  let maxTimestamp: number | undefined;

  for (const token of config.tokens) {
    if (token.toLowerCase() === "usdc") {
      // handled after loading other assets so we can align span
      continue;
    }

    const csvFile = csvFiles.get(token);
    if (!csvFile) {
      throw new Error(`CSV file not found for token: ${token}`);
    }
    const parsed = parseCSV(csvFile);
    const prices = parsed.length > 0 ? parsed : [];
    pricesMap.set(token, prices);

    // Track date span
    if (prices.length > 0) {
      const firstTs = Math.floor(prices[0]!.timestamp / dayMs) * dayMs;
      const lastTs =
        Math.floor(prices[prices.length - 1]!.timestamp / dayMs) * dayMs;
      minTimestamp =
        minTimestamp === undefined ? firstTs : Math.min(minTimestamp, firstTs);
      maxTimestamp =
        maxTimestamp === undefined ? lastTs : Math.max(maxTimestamp, lastTs);
    }
  }

  // If USDC requested, synthesize constant $1 price series over the backtest period
  if (config.tokens.some((t) => t.toLowerCase() === "usdc")) {
    const startFromConfig =
      Math.floor(new Date(config.startDate).getTime() / dayMs) * dayMs;
    const endFromConfig =
      Math.floor(new Date(config.endDate).getTime() / dayMs) * dayMs;

    // Guard undefined span: if we lack other assets, use config range
    const startTs =
      minTimestamp !== undefined && !Number.isNaN(minTimestamp)
        ? Math.max(minTimestamp, startFromConfig)
        : startFromConfig;
    const endTs =
      maxTimestamp !== undefined && !Number.isNaN(maxTimestamp)
        ? Math.min(maxTimestamp, endFromConfig)
        : endFromConfig;

    const usdcSeries: Array<{ timestamp: number; price: number }> = [];
    for (let ts = startTs; ts <= endTs; ts += dayMs) {
      usdcSeries.push({ timestamp: ts, price: 1 });
    }
    pricesMap.set("usdc", usdcSeries);
  }

  console.log("\n✅ Price data loaded successfully\n");

  // Align price data to common timestamps
  const alignedData = alignPriceData(pricesMap);
  console.log(`📅 Analyzing ${alignedData.length} days of data\n`);

  // Run both strategies
  const rebalanceResults = runRebalancingBacktest(config, alignedData);
  const holdResults = runHoldBacktest(config, alignedData);

  // Display results
  displayResults(rebalanceResults, holdResults, config);

  return { rebalanceResults, holdResults };
}

// Main execution
async function main() {
  // Define CSV file paths
  const dataDir = join(__dirname, "data");
  const csvFiles = new Map<string, string>([
    [
      "bitcoin",
      join(
        dataDir,
        "Bitcoin_10_20_2024-10_20_2025_historical_data_coinmarketcap.csv"
      ),
    ],
    [
      "ethereum",
      join(
        dataDir,
        "Ethereum_10_20_2024-10_20_2025_historical_data_coinmarketcap.csv"
      ),
    ],
    // USDC handled as synthetic $1 price in the code
  ]);

  // Define both basket configurations
  const configs: Array<{ config: BacktestConfig; label: string }> = [
    {
      label: "50% BTC / 50% ETH",
      config: {
        startDate: "2024-10-20",
        endDate: "2025-10-19",
        tokens: ["bitcoin", "ethereum"],
        weights: [0.5, 0.5],
        rebalanceThreshold: 0.05,
        initialInvestment: 10000,
      },
    },
    {
      label: "40% BTC / 40% ETH / 20% USDC",
      config: {
        startDate: "2024-10-20",
        endDate: "2025-10-19",
        tokens: ["bitcoin", "ethereum", "usdc"],
        weights: [0.4, 0.4, 0.2],
        rebalanceThreshold: 0.05,
        initialInvestment: 10000,
      },
    },
  ];

  for (const { config, label } of configs) {
    console.log(`\n🔍 Running ${label} backtest with local data...\n`);
    await runBacktest(config, csvFiles);
  }
}

main().catch(console.error);
