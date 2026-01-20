# Changes Summary - STARK Token Integration

## Overview

This document summarizes the changes made to integrate STARK token functionality into the StarkEscrow project, making it fully functional on Starknet Sepolia testnet.

## Smart Contract Changes

### 1. Added ERC20 Token Support

- **File**: `contracts/src/escrow.cairo`
- Added OpenZeppelin IERC20 dispatcher integration
- Added `token_address` to contract storage
- Modified constructor to accept `token_address` parameter
- Implemented token transfers in all escrow operations:
  - `create_escrow`: Uses `transfer_from` to pull tokens from buyer to contract
  - `release`: Transfers tokens to seller (minus fees)
  - `refund`: Transfers tokens back to buyer
  - `resolve`: Transfers tokens based on arbiter decision
  - `withdraw_fees`: Transfers accumulated fees to owner

### 2. Updated Dependencies

- **File**: `contracts/Scarb.toml`
- Added OpenZeppelin Cairo Contracts v0.20.0 dependency

### 3. Updated Deployment Script

- **File**: `contracts/scripts/deploy.sh`
- Added `TOKEN_ADDRESS` configuration (defaults to STARK token on Sepolia)
- Updated constructor calldata to include token address

## Frontend Changes

### 1. Token Approval Flow

- **File**: `frontend/src/features/escrow/hooks/useEscrowContract.ts`
- Modified `createEscrow` function to include two calls:
  1. `approve`: Approves escrow contract to spend STARK tokens
  2. `create_escrow`: Creates the escrow with approved tokens
- Both calls are executed in a single transaction

### 2. STARK Token Balance Display

- **File**: `frontend/src/features/escrow/hooks/useStarkBalance.ts` (already implemented)
- Displays user's STARK token balance in the create escrow modal
- Shows balance with percentage buttons (25%, 50%, 75%, MAX)

### 3. Updated Constants

- **File**: `frontend/src/lib/constants.ts` (already updated)
- Changed from ETH to STARK token references
- Added STARK token address for Sepolia testnet

## Documentation Updates

### 1. README.md

- Updated features to mention STARK token instead of ETH
- Added ERC20 Token Support feature
- Updated usage instructions to mention STARK tokens
- Added step about token approval being handled automatically

## Technical Details

### Token Address

- **STARK Token on Sepolia**: `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d`

### Constructor Parameters (Updated)

1. `owner`: Contract owner address
2. `token_address`: ERC20 token address (STARK)
3. `fee_bps`: Fee in basis points (default: 100 = 1%)

### Transaction Flow

1. User fills escrow form with STARK amount
2. Frontend creates multicall transaction:
   - Call 1: Approve escrow contract to spend tokens
   - Call 2: Create escrow (contract pulls tokens via transfer_from)
3. Tokens are held in escrow contract until release/refund/resolve

## Testing Status

- ✅ Contract compiles successfully
- ✅ Frontend TypeScript compiles without errors
- ✅ ESLint passes
- ✅ Prettier formatting verified
- ⚠️ No unit tests currently defined (existing test suite needs update)

## Deployment Instructions

To deploy the updated contract:

```bash
OWNER_ADDRESS=0x... PRIVATE_KEY=0x... ACCOUNT_ADDRESS=0x... ./contracts/scripts/deploy.sh
```

The script will automatically use the STARK token address for Sepolia testnet.

## Breaking Changes

⚠️ **Important**: This is a breaking change from the previous version. The contract constructor signature has changed:

**Old**: `constructor(owner: ContractAddress, fee_bps: u16)`
**New**: `constructor(owner: ContractAddress, token_address: ContractAddress, fee_bps: u16)`

Existing deployments will need to be redeployed with the new contract version.

## Next Steps

1. Deploy the updated contract to Sepolia testnet
2. Update frontend `.env` with new contract address
3. Test end-to-end flow with real STARK tokens
4. Update unit tests to reflect new token-based logic
5. Consider adding events for token transfers for better tracking
