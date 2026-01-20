import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a value that could be a bigint, number, string, or a Starknet u64 object
 * (with low/high properties) into a number.
 */
export function parseEscrowId(id: any): number {
  if (id === undefined || id === null) return 0

  // Handle Starknet u64/u256 object structure {low: bigint, high: bigint}
  if (typeof id === "object" && "low" in id) {
    return Number(id.low)
  }

  const num = Number(id)
  return isNaN(num) ? 0 : num
}
