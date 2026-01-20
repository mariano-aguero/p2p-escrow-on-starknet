import { num } from "starknet"
import { getTokenConfig, CURRENT_TOKEN_ADDRESS } from "./token-config"

export const ESCROW_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || "0x0"

// STARK Token Address (dynamically loaded based on network)
export const STARK_TOKEN_ADDRESS = CURRENT_TOKEN_ADDRESS

// Token configuration helper
export { getTokenConfig } from "./token-config"

// ERC20 ABI for balance queries
export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ type: "core::integer::u8" }],
    state_mutability: "view",
  },
] as const

export enum EscrowStatus {
  Empty = 0,
  Funded = 1,
  Completed = 2,
  Refunded = 3,
  Disputed = 4,
  Resolved = 5,
}

export const STATUS_LABELS: Record<EscrowStatus, string> = {
  [EscrowStatus.Empty]: "Empty",
  [EscrowStatus.Funded]: "Funded",
  [EscrowStatus.Completed]: "Completed",
  [EscrowStatus.Refunded]: "Refunded",
  [EscrowStatus.Disputed]: "Disputed",
  [EscrowStatus.Resolved]: "Resolved",
}

export const STATUS_CLASSES: Record<EscrowStatus, string> = {
  [EscrowStatus.Empty]: "",
  [EscrowStatus.Funded]: "badge-funded",
  [EscrowStatus.Completed]: "badge-completed",
  [EscrowStatus.Refunded]: "badge-refunded",
  [EscrowStatus.Disputed]: "badge-disputed",
  [EscrowStatus.Resolved]: "badge-resolved",
}

// Complete ABI with struct and enum definitions
export const ESCROW_ABI = [
  {
    name: "starkescrow::interface::EscrowStatus",
    type: "enum",
    variants: [
      { name: "Empty", type: "()" },
      { name: "Funded", type: "()" },
      { name: "Completed", type: "()" },
      { name: "Refunded", type: "()" },
      { name: "Disputed", type: "()" },
      { name: "Resolved", type: "()" },
    ],
  },
  {
    name: "starkescrow::interface::EscrowData",
    type: "struct",
    members: [
      { name: "id", type: "core::integer::u64" },
      {
        name: "buyer",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "seller",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "arbiter",
        type: "core::starknet::contract_address::ContractAddress",
      },
      { name: "amount", type: "core::integer::u256" },
      { name: "status", type: "starkescrow::interface::EscrowStatus" },
      { name: "created_at", type: "core::integer::u64" },
      { name: "description", type: "core::felt252" },
    ],
  },
  {
    name: "IEscrow",
    type: "interface",
    items: [
      {
        name: "create_escrow",
        type: "function",
        inputs: [
          {
            name: "seller",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "arbiter",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "amount", type: "core::integer::u256" },
          { name: "description", type: "core::felt252" },
        ],
        outputs: [{ type: "core::integer::u64" }],
        state_mutability: "external",
      },
      {
        name: "release",
        type: "function",
        inputs: [{ name: "escrow_id", type: "core::integer::u64" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "get_escrow",
        type: "function",
        inputs: [{ name: "escrow_id", type: "core::integer::u64" }],
        outputs: [{ type: "core::array::Array::<core::felt252>" }],
        state_mutability: "view",
      },
      {
        name: "get_escrow_count",
        type: "function",
        inputs: [],
        outputs: [{ type: "core::integer::u64" }],
        state_mutability: "view",
      },
      {
        name: "get_buyer_escrows",
        type: "function",
        inputs: [
          {
            name: "buyer",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::array::Span::<core::integer::u64>" }],
        state_mutability: "view",
      },
      {
        name: "get_seller_escrows",
        type: "function",
        inputs: [
          {
            name: "seller",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::array::Span::<core::integer::u64>" }],
        state_mutability: "view",
      },
      {
        name: "get_arbiter_escrows",
        type: "function",
        inputs: [
          {
            name: "arbiter",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::array::Span::<core::integer::u64>" }],
        state_mutability: "view",
      },
    ],
  },
] as const

export function formatStark(amount: bigint | string | number): string {
  try {
    // @ts-ignore - In case it's there but typed differently in some versions
    return `${num.formatUnits(amount, 18)} STARK`
  } catch (e) {
    // Basic fallback for STARK (18 decimals)
    const val = BigInt(amount)
    const stark = Number(val) / 1e18
    return `${stark.toFixed(4)} STARK`
  }
}

// Keep formatEth for backward compatibility
export function formatEth(amount: bigint | string | number): string {
  return formatStark(amount)
}

export function truncateAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getExplorerUrl(
  address: string,
  network: "mainnet" | "sepolia" = "sepolia"
): string {
  const baseUrl =
    network === "mainnet"
      ? "https://starkscan.co"
      : "https://sepolia.starkscan.co"
  return `${baseUrl}/contract/${address}`
}
