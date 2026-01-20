import { EscrowData } from "./types"

export async function createEscrowAction(
  escrow: Omit<EscrowData, "id" | "status" | "createdAt">
) {
  // Implementation for Starknet transaction
}
