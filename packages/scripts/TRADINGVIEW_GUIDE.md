# TradingView Rebalancing Strategy Guide

This guide shows you how to use the portfolio rebalancing strategy directly in TradingView.

## 📋 Quick Setup

### Option 1: Dual Asset Strategy (Recommended)

This is the simpler, more reliable version for backtesting BTC/ETH or any two assets.

**Steps:**

1. Open TradingView and go to any chart (e.g., BTCUSDT on Binance)
2. Click the "Pine Editor" button at the bottom
3. Copy the entire contents of `tradingview-dual-asset.pine`
4. Paste it into the Pine Editor
5. Click "Add to Chart"
6. Open the strategy settings (gear icon) to configure

**Configuration:**

- **Second Asset**: Enter the symbol for your second asset (e.g., `BINANCE:ETHUSDT`)
- **Primary Asset Weight**: Set your target allocation (50 = 50/50 split)
- **Rebalance Threshold**: Set drift percentage (5 = rebalance at 5% drift)

### Option 2: Advanced Strategy

The `tradingview-strategy.pine` version has more features but requires more setup.

## 🎯 How to Use

### Basic Usage

1. **Select Your Chart**: Choose your primary asset (e.g., BTC/USDT)

2. **Add the Strategy**: Copy-paste the Pine Script into the editor

3. **Configure Settings**:

   ```
   Primary Asset Weight: 50%
   Second Asset: BINANCE:ETHUSDT
   Rebalance Threshold: 5%
   Commission: 0.1%
   ```

4. **Run Backtest**: The strategy will automatically backtest on historical data

### Reading the Results

The chart will show:

- **Green Line**: Portfolio value over time
- **Blue Line**: Primary asset allocation %
- **Orange Line**: Secondary asset allocation %
- **Dashed Lines**: Target allocations
- **Dotted Lines**: Rebalancing threshold bands
- **Blue Background**: Rebalancing events
- **Labels**: Details of each rebalance

The **Statistics Table** (top right) shows:

- Initial Capital
- Current Value
- Total Return %
- Number of Rebalances
- Current Allocations
- Max Drift

## 📊 Example Configurations

### Conservative 50/50 BTC/ETH

```pine
Primary Asset Weight: 50%
Second Asset: BINANCE:ETHUSDT
Rebalance Threshold: 10%
```

### Aggressive 70/30 BTC/ETH

```pine
Primary Asset Weight: 70%
Second Asset: BINANCE:ETHUSDT
Rebalance Threshold: 3%
```

### Balanced 50/50 BTC/SOL

```pine
Primary Asset Weight: 50%
Second Asset: BINANCE:SOLUSDT
Rebalance Threshold: 5%
```

## 🔧 Advanced Features

### Time-Based Rebalancing

Enable "Time-Based Rebalancing" to rebalance on a schedule (e.g., every 30 days) in addition to threshold-based rebalancing.

### Custom Commission

Adjust the commission percentage to match your exchange fees:

- Binance: ~0.1%
- Coinbase: ~0.5%
- Kraken: ~0.16%

### Alerts

Set up alerts in TradingView:

1. Click the "Alerts" button
2. Select "Portfolio Rebalancing Strategy"
3. Choose "Rebalance Alert"
4. Configure notification method (email, SMS, webhook)

## 📈 Comparing Strategies

To compare rebalancing vs buy-and-hold:

1. **Add the rebalancing strategy** to your chart
2. **Take a screenshot** of the results
3. **Remove the strategy**
4. **Add a simple buy-and-hold strategy**:
   ```pine
   //@version=5
   strategy("Buy & Hold", overlay=true, initial_capital=10000)
   if barstate.isfirst
       strategy.entry("Buy", strategy.long)
   ```
5. **Compare the equity curves**

## 💡 Tips & Best Practices

### Choosing Assets

- ✅ **Good**: Uncorrelated or negatively correlated assets (BTC/ETH, BTC/Gold)
- ❌ **Bad**: Highly correlated assets (BTC/BCH, ETH/BNB)

### Setting Thresholds

- **3-5%**: Frequent rebalancing, more trades, captures smaller moves
- **5-10%**: Moderate rebalancing, balanced approach
- **10-20%**: Infrequent rebalancing, fewer trades, lower costs

### Timeframes

- **1D (Daily)**: Most common, good for medium-term strategies
- **4H**: More granular, captures intraday moves
- **1W**: Long-term perspective, fewer signals

### Market Conditions

Rebalancing tends to work better in:

- Range-bound markets
- Mean-reverting conditions
- Sideways/choppy price action

Buy-and-hold tends to win in:

- Strong trending markets
- Bull runs where one asset dominates
- Low-volatility periods

## 🐛 Troubleshooting

### "Cannot call 'request.security'"

**Solution**: Make sure you're using a valid symbol format:

```
BINANCE:ETHUSDT
COINBASE:ETHUSD
KRAKEN:XETHZUSD
```

### "Script could not be translated"

**Solution**:

1. Check you copied the entire script
2. Make sure you're using Pine Script v5
3. Try removing and re-pasting the code

### Wrong Results

**Solution**:

1. Verify the second asset symbol is correct
2. Check that weights sum to 100%
3. Ensure commission and slippage are set appropriately
4. Try a different timeframe

### Missing Data

**Solution**: Some asset pairs might not have data for the entire period. Try:

1. Reducing the backtest period
2. Using a different exchange's data
3. Switching to a major pair like ETHUSDT

## 📝 Customization Examples

### Add Third Asset (Advanced)

You'd need to modify the script to add variables for a third asset:

```pine
asset3Price = request.security("BINANCE:SOLUSDT", timeframe.period, close)
// ... add similar logic for asset3
```

### Different Rebalancing Logic

Modify the `needsRebalance` condition:

```pine
// Original (threshold-based)
needsRebalance = asset1Drift > rebalanceThreshold

// Time-based (every N bars)
needsRebalance = bar_index % 30 == 0

// Combined
needsRebalance = (asset1Drift > rebalanceThreshold) or (bar_index % 30 == 0)
```

### Transaction Cost Modeling

Adjust the strategy settings:

```pine
strategy("...",
         commission_type=strategy.commission.percent,
         commission_value=0.5,  // 0.5% per trade
         slippage=10)           // 10 ticks slippage
```

## 📚 Strategy Parameters Explained

| Parameter              | Description                   | Recommended     |
| ---------------------- | ----------------------------- | --------------- |
| `initial_capital`      | Starting capital              | $10,000         |
| `Primary Asset Weight` | % allocation to primary asset | 50%             |
| `Second Asset`         | Symbol of second asset        | BINANCE:ETHUSDT |
| `Rebalance Threshold`  | Drift % to trigger rebalance  | 5%              |
| `Commission`           | Trading fees %                | 0.1%            |
| `Slippage`             | Execution slippage in ticks   | 5               |

## 🎓 Understanding the Output

### Equity Curve

Shows your portfolio value over time. Compare to the initial capital line to see performance.

### Allocation Chart

Shows how your allocations drift from targets and when rebalancing occurs.

### Performance Metrics

TradingView shows standard metrics:

- **Net Profit**: Total gain/loss in $
- **Total Trades**: Number of rebalancing events × 2 (buy + sell)
- **Win Rate**: Not meaningful for rebalancing
- **Max Drawdown**: Largest peak-to-trough decline

### Custom Stats Table

Our script adds a custom table showing:

- Portfolio value and returns
- Number of rebalances (more useful metric)
- Current allocations
- Drift from targets

## 🚀 Next Steps

1. **Test Different Allocations**: Try 60/40, 70/30, 80/20
2. **Test Different Thresholds**: Compare 3%, 5%, 10%
3. **Test Different Assets**: BTC/ETH, BTC/SOL, ETH/SOL
4. **Test Different Timeframes**: 1D, 4H, 1W
5. **Compare Periods**: Bull market vs bear market vs sideways

## 📖 Additional Resources

- [TradingView Pine Script Documentation](https://www.tradingview.com/pine-script-docs/)
- [TradingView Strategy Tester](https://www.tradingview.com/support/solutions/43000481029/)
- [Understanding Portfolio Rebalancing](https://www.investopedia.com/terms/r/rebalancing.asp)

## ⚠️ Disclaimer

This is for educational and research purposes only. Past performance does not guarantee future results. Always do your own research and consider your risk tolerance before implementing any trading strategy.
