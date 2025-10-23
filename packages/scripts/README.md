# Portfolio Rebalancing Backtest

A backtesting tool that compares portfolio rebalancing strategies vs buy-and-hold using historical cryptocurrency price data.

## What It Does

Tests whether periodically rebalancing your portfolio (maintaining target allocations) outperforms a simple buy-and-hold strategy.

**Example:** Start with 50% BTC / 50% ETH. When prices change and allocations drift (e.g., 55% BTC / 45% ETH), rebalance back to 50/50.

## Quick Start

### Local CSV Backtest

```bash
# Run the backtest with included sample data
bun start

# Or
bun run backtest
```

This runs a backtest on the included Bitcoin and Ethereum price data (Sep 2024 - Oct 2025).

### TradingView Backtest

For interactive backtesting directly in TradingView:

1. Copy the contents of `tradingview-dual-asset.pine`
2. Paste into TradingView's Pine Editor
3. Click "Add to Chart"
4. Configure your settings

See [TRADINGVIEW_GUIDE.md](./TRADINGVIEW_GUIDE.md) for detailed instructions.

## Which Version Should I Use?

| Feature             | TypeScript (Local)    | TradingView (Pine)           |
| ------------------- | --------------------- | ---------------------------- |
| **Setup**           | Install Bun           | Just copy-paste              |
| **Data Source**     | Local CSV files       | TradingView charts           |
| **Speed**           | Very fast             | Instant                      |
| **Customization**   | Full control          | Limited by Pine Script       |
| **Visualization**   | Terminal output       | Interactive charts           |
| **Multiple Assets** | Easy                  | Requires more work           |
| **Automation**      | Can script            | Can set alerts               |
| **Best For**        | Custom data, research | Quick tests, visual analysis |

**Recommendation:**

- Use **TradingView** for quick visual backtests and exploring different assets
- Use **TypeScript** for detailed analysis, custom data, or multiple assets

## Results

The backtest shows you:

- 🔄 **Rebalancing Strategy**: Final value, return %, number of rebalances
- 💎 **Buy & Hold Strategy**: Final value, return %, no trades
- 📈 **Comparison**: Which strategy won and by how much

### Sample Output

```
======================================================================
📊 BACKTEST RESULTS
======================================================================

📋 Configuration:
  Period: 2024-09-16 to 2025-10-19
  Tokens: bitcoin, ethereum
  Target Allocation: 50% / 50%
  Rebalance Threshold: 5.0%
  Initial Investment: $10,000

🔄 REBALANCING STRATEGY:
  Final Value: $18,321.18
  Total Return: +83.21%
  Number of Rebalances: 6

💎 BUY & HOLD STRATEGY:
  Final Value: $17,685.31
  Total Return: +76.85%

📈 COMPARISON:
  Difference: +$635.87 (+3.60%)
  Winner: Rebalancing 🏆
```

## Customizing

Edit `index.ts` to change:

```typescript
const config: BacktestConfig = {
  startDate: "2024-10-20",
  endDate: "2025-10-19",
  tokens: ["bitcoin", "ethereum"],
  weights: [0.5, 0.5], // Change allocation: [0.7, 0.3] = 70/30
  rebalanceThreshold: 0.05, // Change threshold: 0.03 = 3%, 0.1 = 10%
  initialInvestment: 10000, // Change starting capital
};
```

## Using Your Own Data

### CSV Format

Place your CSV files in the `data/` directory. Format should be:

```
timeOpen;timeClose;timeHigh;timeLow;name;open;high;low;close;volume;marketCap;circulatingSupply;timestamp
"2025-10-19T00:00:00.000Z";"2025-10-19T23:59:59.999Z";"...";...;108666.71;...;"2025-10-19T23:59:59.999Z"
```

**Key columns:**

- Column 8: `close` price (the closing price for the day)
- Column 12: `timestamp` (the date of the data point)

### Add New Tokens

1. Add CSV file to `data/` directory
2. Update the `csvFiles` map in `index.ts`:

```typescript
const csvFiles = new Map<string, string>([
  ["bitcoin", join(dataDir, "Bitcoin_historical_data.csv")],
  ["ethereum", join(dataDir, "Ethereum_historical_data.csv")],
  ["solana", join(dataDir, "Solana_historical_data.csv")], // Add new token
]);
```

3. Update the config to include the new token:

```typescript
const config: BacktestConfig = {
  // ...
  tokens: ["bitcoin", "ethereum", "solana"],
  weights: [0.4, 0.4, 0.2], // Must sum to 1.0
};
```

## How Rebalancing Works

1. **Start**: Buy tokens according to target allocation (e.g., 50/50)
2. **Monitor**: Prices change daily, causing allocations to drift
3. **Rebalance**: When any token drifts more than threshold (e.g., 5%), sell overweight and buy underweight to restore targets
4. **Repeat**: Continue monitoring and rebalancing throughout the period

### Example

```
Day 1:   $10,000 → $5,000 BTC + $5,000 ETH (50/50)
Day 30:  BTC rises → 57% BTC / 43% ETH
         Drift = 7% > 5% threshold
         → Rebalance: Sell $700 BTC, Buy $700 ETH
         → Back to 50/50
```

## When Rebalancing Wins

- ✅ **Mean-reverting markets**: Prices oscillate around averages
- ✅ **Low correlation assets**: Different price movements
- ✅ **Moderate volatility**: Enough movement to trigger rebalances

## When Buy & Hold Wins

- ✅ **Strong trending markets**: One asset consistently outperforms
- ✅ **High momentum**: Winners keep winning
- ✅ **High transaction costs**: Rebalancing fees eat into gains

## Configuration Options

| Parameter            | Type     | Description                          | Example                   |
| -------------------- | -------- | ------------------------------------ | ------------------------- |
| `startDate`          | string   | Start date (YYYY-MM-DD)              | `"2024-01-01"`            |
| `endDate`            | string   | End date (YYYY-MM-DD)                | `"2025-01-01"`            |
| `tokens`             | string[] | Token identifiers                    | `["bitcoin", "ethereum"]` |
| `weights`            | number[] | Target allocations (must sum to 1.0) | `[0.5, 0.5]`              |
| `rebalanceThreshold` | number   | Drift % before rebalancing           | `0.05` (5%)               |
| `initialInvestment`  | number   | Starting capital in USD              | `10000`                   |

## Files

```
scripts/
├── index.ts                      # Main TypeScript backtest script
├── tradingview-dual-asset.pine  # TradingView Pine Script (simple)
├── tradingview-strategy.pine    # TradingView Pine Script (advanced)
├── TRADINGVIEW_GUIDE.md         # TradingView setup guide
├── data/                        # Historical price data (CSV files)
│   ├── Bitcoin_10_20_2024-10_20_2025_historical_data_coinmarketcap.csv
│   └── Ethereum_10_20_2024-10_20_2025_historical_data_coinmarketcap.csv
├── package.json                 # Package configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## Limitations

This backtest **does not account for**:

- Trading fees (typically 0.1-1% per trade)
- Slippage (price moves during trade execution)
- Gas fees (for on-chain transactions)
- Tax implications (capital gains)
- Market impact (your trades affecting prices)

For real-world scenarios, factor in ~0.5-1% cost per rebalancing event.

## Example Experiments

Try different scenarios:

```typescript
// Conservative rebalancing (less frequent)
rebalanceThreshold: 0.1; // 10% drift

// Aggressive rebalancing (more frequent)
rebalanceThreshold: 0.03; // 3% drift

// Bitcoin-heavy portfolio
weights: [0.7, 0.3]; // 70% BTC, 30% ETH

// Equal weight portfolio
weights: [0.5, 0.5]; // 50/50
```

## Data Sources

Sample data from CoinMarketCap (Sep 2024 - Oct 2025):

- Bitcoin: $58,193 → $108,667 (+86.7%)
- Ethereum: $2,295 → $3,985 (+73.6%)

You can export your own data from:

- [CoinMarketCap](https://coinmarketcap.com/)
- [CoinGecko](https://www.coingecko.com/)
- [Binance](https://www.binance.com/)
- [Crypto Compare](https://www.cryptocompare.com/)

## License

MIT
