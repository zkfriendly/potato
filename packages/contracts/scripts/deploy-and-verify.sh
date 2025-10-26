#!/bin/bash

# Extract addresses from deployed_addresses.json
echo ""
echo "📋 Extracting deployed addresses..."
DEPLOYED_ADDRESSES_FILE="ignition/deployments/chain-11155111/deployed_addresses.json"

if [ -f "$DEPLOYED_ADDRESSES_FILE" ]; then
    echo "Deployed addresses:"
    cat "$DEPLOYED_ADDRESSES_FILE"
    echo ""
    
    # Parse addresses (requires jq, but we'll show manual commands)
    BASKET_IMPL=$(grep -o '"BasketImplementationModule#BasketImplementation"[^"]*"[^"]*"' "$DEPLOYED_ADDRESSES_FILE" | grep -o '0x[a-fA-F0-9]\{40\}' | head -1)
    BASKET_FOUNDRY=$(grep -o '"BasketFoundryModule#BasketFoundry"[^"]*"[^"]*"' "$DEPLOYED_ADDRESSES_FILE" | grep -o '0x[a-fA-F0-9]\{40\}' | head -1)
    POTATO_ENTRYPOINT=$(grep -o '"PotatoFinanceEntrypointModule#PotatoFinanceEntrypoint"[^"]*"[^"]*"' "$DEPLOYED_ADDRESSES_FILE" | grep -o '0x[a-fA-F0-9]\{40\}' | head -1)
    
    echo "✅ Basket Implementation: $BASKET_IMPL"
    echo "✅ Basket Foundry: $BASKET_FOUNDRY"
    echo "✅ Potato Finance Entrypoint: $POTATO_ENTRYPOINT"
    echo ""
    
    # Verify contracts
    echo "Step 2: Verifying contracts on Sepolia..."
    echo ""
    
    if [ -n "$BASKET_IMPL" ]; then
        echo "Verifying Basket Implementation..."
        npx hardhat verify --network sepolia "$BASKET_IMPL"
        echo ""
    fi
    
    if [ -n "$BASKET_FOUNDRY" ] && [ -n "$BASKET_IMPL" ]; then
        echo "Verifying Basket Foundry..."
        npx hardhat verify --network sepolia "$BASKET_FOUNDRY" "$BASKET_IMPL"
        echo ""
    fi
    
    if [ -n "$POTATO_ENTRYPOINT" ] && [ -n "$BASKET_FOUNDRY" ]; then
        echo "Verifying Potato Finance Entrypoint..."
        npx hardhat verify --network sepolia "$POTATO_ENTRYPOINT" "$BASKET_FOUNDRY"
        echo ""
    fi
    
    echo "🎉 Deployment and verification complete!"
    echo ""
    echo "📝 Final Deployed Addresses:"
    echo "  Basket Implementation: $BASKET_IMPL"
    echo "  Basket Foundry: $BASKET_FOUNDRY"
    echo "  Potato Finance Entrypoint: $POTATO_ENTRYPOINT"
else
    echo "❌ Deployed addresses file not found!"
fi

