#!/bin/bash

# StarkEscrow Deployment Script - Sepolia Testnet
# Uses sncast (Starknet Foundry) for deployment

# Load .env file if it exists
# When called via pnpm from root, we're already in root directory
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
elif [ -f ../.env ]; then
  export $(cat ../.env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Configuration
NETWORK=${NETWORK:-"sepolia"}
OWNER_ADDRESS=${OWNER_ADDRESS:-"0x0"}
TOKEN_ADDRESS=${TOKEN_ADDRESS:-"0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"}  # STARK token on Sepolia
FEE_BPS=${FEE_BPS:-100}  # 1% fee
PRIVATE_KEY=${PRIVATE_KEY:-""}
ACCOUNT_ADDRESS=${ACCOUNT_ADDRESS:-""}
ACCOUNT_NAME="braavos-deployer"

# Validation
if [ "$OWNER_ADDRESS" == "0x0" ]; then
  echo "❌ Error: OWNER_ADDRESS is not set."
  echo "Usage: OWNER_ADDRESS=0x... PRIVATE_KEY=0x... ACCOUNT_ADDRESS=0x... [NETWORK=sepolia] [FEE_BPS=100] ./contracts/scripts/deploy.sh"
  exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Error: PRIVATE_KEY is not set."
  echo "Please set PRIVATE_KEY to your Braavos account private key."
  echo "Example: PRIVATE_KEY=0x1234..."
  exit 1
fi

if [ -z "$ACCOUNT_ADDRESS" ]; then
  echo "❌ Error: ACCOUNT_ADDRESS is not set."
  echo "Please set ACCOUNT_ADDRESS to your Braavos account address."
  echo "Example: ACCOUNT_ADDRESS=0x1234..."
  exit 1
fi

echo "🚀 Building contract..."
cd contracts
scarb build

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to build contract"
  exit 1
fi

echo "📦 Checking sncast account..."
# Check if account already exists
ACCOUNT_EXISTS=$(sncast account list 2>/dev/null | grep -c "$ACCOUNT_NAME")

if [ "$ACCOUNT_EXISTS" -eq 0 ]; then
  echo "📝 Importing Braavos account into sncast..."
  sncast account import \
    --name "$ACCOUNT_NAME" \
    --address "$ACCOUNT_ADDRESS" \
    --type braavos \
    --private-key "$PRIVATE_KEY" \
    --network "$NETWORK" \
    --add-profile

  if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to import account"
    exit 1
  fi
  echo "✅ Account imported successfully"
else
  echo "✅ Account already exists in sncast"
fi

echo "📦 Declaring contract..."
# Declare contract and capture output
DECLARE_OUTPUT=$(sncast --account "$ACCOUNT_NAME" declare \
  --contract-name escrow \
  --network "$NETWORK" 2>&1)

DECLARE_EXIT_CODE=$?

# Extract class hash from output (works for both success and "already declared" error)
CONTRACT_CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -oE 'class_hash: 0x[0-9a-fA-F]+|class hash 0x[0-9a-fA-F]+|Class Hash: *0x[0-9a-fA-F]+' | grep -oE '0x[0-9a-fA-F]+' | head -1)

if [ -z "$CONTRACT_CLASS_HASH" ]; then
  echo "❌ Error: Could not extract class hash from declare output"
  echo "$DECLARE_OUTPUT"
  exit 1
fi

# Check if it was already declared
if echo "$DECLARE_OUTPUT" | grep -q "already declared"; then
  echo "ℹ️  Contract already declared with class hash: $CONTRACT_CLASS_HASH"
  echo "⏳ Skipping wait time..."
elif [ $DECLARE_EXIT_CODE -ne 0 ]; then
  echo "❌ Error: Failed to declare contract"
  echo "$DECLARE_OUTPUT"
  exit 1
else
  echo "✅ Contract declared with class hash: $CONTRACT_CLASS_HASH"
  echo "⏳ Waiting for declaration to be confirmed (30 seconds)..."
  sleep 30
fi

echo "🏗️ Deploying contract..."
DEPLOY_OUTPUT=$(sncast --account "$ACCOUNT_NAME" deploy \
  --class-hash "$CONTRACT_CLASS_HASH" \
  --constructor-calldata "$OWNER_ADDRESS" "$TOKEN_ADDRESS" "$FEE_BPS" \
  --network "$NETWORK" 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to deploy contract"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

# Extract contract address from output (handles both formats)
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oE 'contract_address: 0x[0-9a-fA-F]+|Contract Address: 0x[0-9a-fA-F]+' | grep -oE '0x[0-9a-fA-F]+' | head -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "❌ Error: Could not extract contract address from deploy output"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo "✅ Contract deployed at: $CONTRACT_ADDRESS"
echo ""
echo "🔗 View on Starkscan:"
echo "https://sepolia.starkscan.co/contract/$CONTRACT_ADDRESS"
echo ""
echo "Update frontend/src/lib/constants.ts with:"
echo "export const ESCROW_CONTRACT_ADDRESS = \"$CONTRACT_ADDRESS\""
