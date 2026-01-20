"use client"

import { useMemo, useEffect, useState } from "react"
import { useCall, useReadContract, useContract } from "@starknet-react/core"
import { validateAndParseAddress, shortString, RpcProvider } from "starknet"
import {
  ESCROW_ABI,
  ESCROW_CONTRACT_ADDRESS,
  EscrowStatus,
} from "@/lib/constants"
import { EscrowData } from "../types"

export function useEscrowStats() {
  const { data: totalEscrows, isLoading: isLoadingCount } = useEscrowCount()
  const { contract } = useContract({
    abi: ESCROW_ABI,
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
  })

  const [stats, setStats] = useState({ active: 0, completed: 0, disputed: 0 })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      if (!totalEscrows || totalEscrows === 0 || !contract) {
        setStats({ active: 0, completed: 0, disputed: 0 })
        return
      }

      setIsLoading(true)
      try {
        const activeEscrows = []
        for (let i = 1; i <= totalEscrows; i++) {
          activeEscrows.push(i)
        }

        const fetchStatus = async (id: number) => {
          try {
            const res = await contract.call("get_escrow", [id])
            if (!res || !Array.isArray(res)) return null
            if (Number(res[0]) === 1) return null // None case
            return Number(res[7]) // Status
          } catch (e) {
            console.error(`Error fetching escrow ${id}:`, e)
            return null
          }
        }

        const statuses = await Promise.all(activeEscrows.map(fetchStatus))

        const newStats = { active: 0, completed: 0, disputed: 0 }
        statuses.forEach((status) => {
          if (status === null) return
          if (status === EscrowStatus.Funded) newStats.active++
          else if (
            status === EscrowStatus.Completed ||
            status === EscrowStatus.Refunded ||
            status === EscrowStatus.Resolved
          )
            newStats.completed++
          else if (status === EscrowStatus.Disputed) newStats.disputed++
        })

        setStats(newStats)
      } catch (error) {
        console.error("Error calculating stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [totalEscrows, contract])

  return {
    data: stats,
    isLoading: isLoadingCount || isLoading,
  }
}

export function useEscrow(escrowId: number) {
  const { data, isLoading, error, refetch, isPending } = useCall({
    abi: ESCROW_ABI,
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    functionName: "get_escrow",
    args: [escrowId],
    watch: true,
    enabled: !!escrowId,
  })

  // Deserialize Array<felt252> to EscrowData
  const escrowData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null
    }

    // Check if escrow exists (first element: 0 = Some, 1 = None)
    const exists = Number(data[0])
    if (exists === 1 || data.length < 10) {
      return null
    }

    // Parse all fields from the array
    const parseAddress = (value: any): string => {
      if (typeof value === "string") {
        return value.startsWith("0x") ? value : `0x${value}`
      }
      if (typeof value === "bigint") {
        return `0x${value.toString(16).padStart(64, "0")}`
      }
      return `0x${String(value).padStart(64, "0")}`
    }

    const parseBigInt = (value: any): bigint => {
      if (typeof value === "bigint") return value
      if (typeof value === "string") {
        return BigInt(value.startsWith("0x") ? value : `0x${value}`)
      }
      return BigInt(value)
    }

    try {
      const descriptionRaw = data[9]
      let description = ""

      if (descriptionRaw !== undefined && descriptionRaw !== null) {
        if (typeof descriptionRaw === "bigint") {
          description = shortString.decodeShortString(descriptionRaw.toString())
        } else if (typeof descriptionRaw === "string") {
          description = descriptionRaw.startsWith("0x")
            ? shortString.decodeShortString(descriptionRaw)
            : shortString.decodeShortString(BigInt(descriptionRaw).toString())
        }
      }

      const escrow: EscrowData = {
        id: Number(data[1]),
        buyer: parseAddress(data[2]),
        seller: parseAddress(data[3]),
        arbiter: parseAddress(data[4]),
        // Combine u256 (low, high)
        amount: parseBigInt(data[5]) + (parseBigInt(data[6]) << BigInt(128)),
        status: Number(data[7]),
        createdAt: Number(parseBigInt(data[8])),
        description: description || String(descriptionRaw),
      }

      return escrow
    } catch (e) {
      console.error("Failed to parse escrow data:", e)
      // Fallback for description if decoding fails
      try {
        const escrow: EscrowData = {
          id: Number(data[1]),
          buyer: parseAddress(data[2]),
          seller: parseAddress(data[3]),
          arbiter: parseAddress(data[4]),
          amount: parseBigInt(data[5]) + (parseBigInt(data[6]) << BigInt(128)),
          status: Number(data[7]),
          createdAt: Number(parseBigInt(data[8])),
          description: String(data[9]),
        }
        return escrow
      } catch (innerError) {
        return null
      }
    }
  }, [data])

  return {
    data: escrowData,
    isLoading: isLoading || isPending,
    error,
    refetch,
  }
}

export function useEscrowCount() {
  const { data, isLoading, error, refetch, isPending } = useReadContract({
    abi: ESCROW_ABI,
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    functionName: "get_escrow_count",
    args: [],
    watch: true,
    enabled: true,
  })

  return {
    data: data ? Number(data) : 0,
    isLoading: isLoading || isPending,
    error,
    refetch,
  }
}

export function useBuyerEscrows(address: string) {
  // Normalize address to ensure proper format (checksum, padding)
  const normalizedAddress = address ? validateAndParseAddress(address) : ""

  const { data, isLoading, error, refetch, isPending } = useReadContract({
    abi: ESCROW_ABI,
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    functionName: "get_buyer_escrows",
    args: [normalizedAddress],
    watch: true,
    enabled: !!normalizedAddress,
  })

  // Handle both array and single bigint responses
  let escrowIds: number[] = []

  if (Array.isArray(data)) {
    escrowIds = (data as any[]).map((id) => Number(id))
  } else if (
    typeof data === "bigint" ||
    typeof data === "number" ||
    typeof data === "string"
  ) {
    escrowIds = [Number(data)]
  } else if (data !== undefined && data !== null) {
    // Try to convert any other type to number
    const num = Number(data)
    if (!isNaN(num)) {
      escrowIds = [num]
    }
  }

  return {
    data: escrowIds,
    isLoading: isLoading || isPending,
    error,
    refetch,
  }
}

export function useSellerEscrows(address: string) {
  // Normalize address to ensure proper format (checksum, padding)
  const normalizedAddress = address ? validateAndParseAddress(address) : ""

  const { data, isLoading, error, refetch, isPending } = useReadContract({
    abi: ESCROW_ABI,
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    functionName: "get_seller_escrows",
    args: [normalizedAddress],
    watch: true,
    enabled: !!normalizedAddress,
  })

  // Handle both array and single bigint responses
  let escrowIds: number[] = []
  if (Array.isArray(data)) {
    escrowIds = (data as any[]).map((id) => Number(id))
  } else if (
    typeof data === "bigint" ||
    typeof data === "number" ||
    typeof data === "string"
  ) {
    escrowIds = [Number(data)]
  } else if (data !== undefined && data !== null) {
    // Try to convert any other type to number
    const num = Number(data)
    if (!isNaN(num)) {
      escrowIds = [num]
    }
  }

  return {
    data: escrowIds,
    isLoading: isLoading || isPending,
    error,
    refetch,
  }
}

export function useArbiterEscrows(address: string) {
  // Normalize address to ensure proper format (checksum, padding)
  const normalizedAddress = address ? validateAndParseAddress(address) : ""

  const { data, isLoading, error, refetch, isPending } = useReadContract({
    abi: ESCROW_ABI,
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    functionName: "get_arbiter_escrows",
    args: [normalizedAddress],
    watch: true,
    enabled: !!normalizedAddress,
  })

  // Handle both array and single bigint responses
  let escrowIds: number[] = []
  if (Array.isArray(data)) {
    escrowIds = (data as any[]).map((id) => Number(id))
  } else if (
    typeof data === "bigint" ||
    typeof data === "number" ||
    typeof data === "string"
  ) {
    escrowIds = [Number(data)]
  } else if (data !== undefined && data !== null) {
    // Try to convert any other type to number
    const num = Number(data)
    if (!isNaN(num)) {
      escrowIds = [num]
    }
  }

  return {
    data: escrowIds,
    isLoading: isLoading || isPending,
    error,
    refetch,
  }
}
