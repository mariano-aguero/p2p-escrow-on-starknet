# Demo Script - StarkEscrow

## Setup (Before Demo)

- [ ] Contract deployed on Sepolia
- [ ] Frontend running (`pnpm dev`)
- [ ] 3 wallets ready (Argent/Braavos):
  - **Wallet A (Buyer)**: ~0.1 ETH
  - **Wallet B (Seller)**: ~0 ETH
  - **Wallet C (Arbiter)**: ~0 ETH
- [ ] Browser tabs ready: Dashboard, Create Escrow, Starkscan/Voyager

## Act 1: Introduction (1 min)

"Today I present StarkEscrow, a secure P2P escrow solution on Starknet. Our platform ensures that trustless transactions between buyers and sellers are backed by smart contracts, preventing fraud and providing a clear path for dispute resolution."

## Act 2: Create Escrow (2 min)

1. **Connect Wallet A** as the Buyer.
2. Click **"Create Escrow"** in the navigation.
3. Show the form and explain the fields:
   - **Seller**: Wallet B address.
   - **Arbiter**: Wallet C address (the neutral third party).
   - **Amount**: 0.05 ETH.
   - **Description**: "Payment for Custom Design Work".
4. Click **"Create Escrow"**.
5. _If live_: Approve transaction in wallet.
6. _If demo_: Show the simulated loading and success state.
7. Navigate back to **Dashboard** to show the new "Funded" escrow.

## Act 3: Release (1.5 min)

1. "Imagine the seller has delivered the design work, and the buyer is happy."
2. Click on the escrow card to see details.
3. Click **"Release"**.
4. Explain that funds (minus platform fee) are now being moved to the Seller.
5. Show status change to **"Completed"**.

## Act 4: Refund Flow (1.5 min)

1. "What if the seller can't finish the work?"
2. Create another escrow or use a pre-populated one.
3. **Switch to Wallet B** (Seller).
4. Show that only the Seller has the **"Refund"** button available.
5. Click **"Refund"**.
6. Show status change to **"Refunded"**.

## Act 5: Dispute (2 min)

1. "Conflicts happen. Let's see how we handle them."
2. Create a third escrow.
3. **Switch to Wallet A** (Buyer).
4. Click **"Dispute"**.
5. Status changes to **"Disputed"**.
6. **Switch to Wallet C** (Arbiter).
7. Show that the Arbiter now has two choices: **"Resolve to Seller"** or **"Resolve to Buyer"**.
8. Click **"Resolve to Seller"**.
9. Status changes to **"Resolved"**.

## Closing (30 sec)

"StarkEscrow leverages Starknet's low fees and high security to make P2P commerce safer for everyone. Thank you! Any questions?"

---

## Backup Plan

If the Sepolia testnet is slow or experiencing issues:

- Show the UI flow and explain the smart contract logic behind each button.
- Show the contract on Starkscan to prove deployment and code integrity.
