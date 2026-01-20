#!/bin/bash

# StarkEscrow Contract Verification Script - Voyager
# Uses sncast (Starknet Foundry) for verification

# Load .env file if it exists
# When called via pnpm from root, we're already in root directory
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
elif [ -f ../.env ]; then
  export $(cat ../.env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Configuration
NETWORK=${NETWORK:-"sepolia"}
CONTRACT_ADDRESS=${ESCROW_CONTRACT_ADDRESS:-""}
CONTRACT_NAME="escrow"
VERIFIER="voyager"

# Validation
if [ -z "$CONTRACT_ADDRESS" ] || [ "$CONTRACT_ADDRESS" == "0x0" ]; then
  echo "❌ Error: ESCROW_CONTRACT_ADDRESS is not set or invalid."
  echo "Please set ESCROW_CONTRACT_ADDRESS in your .env file."
  echo "Example: ESCROW_CONTRACT_ADDRESS=0x1234..."
  exit 1
fi

echo "🔍 Verifying contract on Voyager..."
echo "Contract Address: $CONTRACT_ADDRESS"
echo "Network: $NETWORK"
echo ""

# Navigate to contracts directory
cd contracts

# Verify contract on Voyager
echo "📝 Submitting verification to Voyager..."
VERIFY_OUTPUT=$(sncast verify \
  --contract-address "$CONTRACT_ADDRESS" \
  --contract-name "$CONTRACT_NAME" \
  --verifier "$VERIFIER" \
  --network "$NETWORK" \
  --confirm-verification 2>&1)

VERIFY_EXIT_CODE=$?

if [ $VERIFY_EXIT_CODE -ne 0 ]; then
  echo "❌ Error: Failed to verify contract"
  echo "$VERIFY_OUTPUT"
  exit 1
fi

echo "$VERIFY_OUTPUT"
echo ""
echo "✅ Contract verification submitted successfully!"
echo ""
echo "🔗 View verified contract on Voyager:"
if [ "$NETWORK" == "mainnet" ]; then
  echo "https://voyager.online/contract/$CONTRACT_ADDRESS"
else
  echo "https://sepolia.voyager.online/contract/$CONTRACT_ADDRESS"
fi
echo ""
echo "Note: Verification may take a few minutes to process on Voyager."
