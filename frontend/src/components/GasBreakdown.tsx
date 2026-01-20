"use client"

import { useMemo } from "react"
import { Fuel, TrendingUp, Cpu, Database, Hash } from "lucide-react"
import { formatStark } from "@/lib/constants"
import { uint256 } from "starknet"

interface ExecutionResources {
  steps?: number
  memory_holes?: number
  range_check_builtin_applications?: number
  pedersen_builtin_applications?: number
  poseidon_builtin_applications?: number
  ec_op_builtin_applications?: number
  ecdsa_builtin_applications?: number
  bitwise_builtin_applications?: number
  keccak_builtin_applications?: number
  segment_arena_builtin?: number
  data_availability?: {
    l1_gas?: number
    l1_data_gas?: number
  }
}

interface GasBreakdownProps {
  actualFee?: bigint | string | any
  executionResources?: ExecutionResources | any
  className?: string
}

export function GasBreakdown({
  actualFee,
  executionResources,
  className = "",
}: GasBreakdownProps) {
  const feeInWei = useMemo(() => {
    if (!actualFee) return BigInt(0)

    // Handle different fee structures from Starknet receipts
    if (typeof actualFee === "object" && actualFee !== null) {
      // RPC v0.7+ structure: { amount: string | uint256, unit: string }
      if ("amount" in actualFee) {
        const amount = (actualFee as any).amount

        // amount is a hex string (most common in RPC v0.7+)
        if (typeof amount === "string") {
          try {
            return BigInt(amount)
          } catch (e) {
            console.error("Failed to convert hex string to BigInt:", e)
            return BigInt(0)
          }
        }

        // amount is a uint256 object with low/high
        if (
          typeof amount === "object" &&
          amount !== null &&
          "low" in amount &&
          "high" in amount
        ) {
          try {
            return uint256.uint256ToBN(amount)
          } catch (e) {
            console.error("Failed to convert nested uint256:", e)
            return BigInt(0)
          }
        }

        // amount is already a bigint
        if (typeof amount === "bigint") {
          return amount
        }
      }

      // Legacy structure: direct uint256 (low/high)
      if ("low" in actualFee && "high" in actualFee) {
        try {
          return uint256.uint256ToBN(actualFee)
        } catch (e) {
          console.error("Failed to convert uint256:", e)
          return BigInt(0)
        }
      }

      // If it's an object but not a recognized structure, return 0
      console.warn("Unrecognized actualFee structure:", actualFee)
      return BigInt(0)
    }

    // Handle string or bigint directly
    if (typeof actualFee === "string") {
      try {
        return BigInt(actualFee)
      } catch (e) {
        console.error("Failed to convert string to BigInt:", e)
        return BigInt(0)
      }
    }

    if (typeof actualFee === "bigint") {
      return actualFee
    }

    return BigInt(0)
  }, [actualFee])

  const resources = useMemo(() => {
    if (!executionResources) return []

    const items = [
      {
        label: "Steps",
        value: executionResources.steps,
        icon: TrendingUp,
        color: "text-cyan-400",
      },
      {
        label: "Memory Holes",
        value: executionResources.memory_holes,
        icon: Database,
        color: "text-purple-400",
      },
      {
        label: "Range Check",
        value: executionResources.range_check_builtin_applications,
        icon: Hash,
        color: "text-green-400",
      },
      {
        label: "Pedersen",
        value: executionResources.pedersen_builtin_applications,
        icon: Hash,
        color: "text-blue-400",
      },
      {
        label: "Poseidon",
        value: executionResources.poseidon_builtin_applications,
        icon: Hash,
        color: "text-indigo-400",
      },
      {
        label: "EC Operations",
        value: executionResources.ec_op_builtin_applications,
        icon: Cpu,
        color: "text-yellow-400",
      },
      {
        label: "ECDSA",
        value: executionResources.ecdsa_builtin_applications,
        icon: Hash,
        color: "text-orange-400",
      },
      {
        label: "Bitwise",
        value: executionResources.bitwise_builtin_applications,
        icon: Cpu,
        color: "text-pink-400",
      },
      {
        label: "Keccak",
        value: executionResources.keccak_builtin_applications,
        icon: Hash,
        color: "text-red-400",
      },
    ]

    return items.filter((item) => item.value && item.value > 0)
  }, [executionResources])

  const l1DataAvailability = useMemo(() => {
    if (!executionResources?.data_availability) return null

    const { l1_gas, l1_data_gas } = executionResources.data_availability

    if (!l1_gas && !l1_data_gas) return null

    return { l1_gas, l1_data_gas }
  }, [executionResources])

  if (!actualFee && !executionResources) {
    return null
  }

  return (
    <div
      className={`rounded-lg bg-slate-950 border border-slate-800 p-4 space-y-4 ${className}`}
    >
      <div className="flex items-center gap-2 text-slate-100">
        <Fuel className="h-5 w-5 text-cyan-400" />
        <h3 className="font-semibold">Gas Distribution</h3>
      </div>

      {/* Actual Fee */}
      {actualFee && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Fee Paid:</span>
            <span className="text-lg font-bold text-cyan-400">
              {formatStark(feeInWei)}
            </span>
          </div>
          <div className="h-px bg-slate-800" />
        </div>
      )}

      {/* Execution Resources */}
      {resources.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">
            Execution Resources
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resources.map((resource) => {
              const Icon = resource.icon
              return (
                <div
                  key={resource.label}
                  className="flex items-center justify-between bg-slate-900 rounded-md p-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${resource.color}`} />
                    <span className="text-xs text-slate-400">
                      {resource.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    {resource.value?.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* L1 Data Availability */}
      {l1DataAvailability && (
        <div className="space-y-2">
          <div className="h-px bg-slate-800" />
          <h4 className="text-sm font-medium text-slate-300">
            L1 Data Availability
          </h4>
          <div className="space-y-1">
            {l1DataAvailability.l1_gas !== undefined &&
              l1DataAvailability.l1_gas > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">L1 Gas:</span>
                  <span className="font-medium text-slate-200">
                    {l1DataAvailability.l1_gas.toLocaleString()}
                  </span>
                </div>
              )}
            {l1DataAvailability.l1_data_gas !== undefined &&
              l1DataAvailability.l1_data_gas > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">L1 Data Gas:</span>
                  <span className="font-medium text-slate-200">
                    {l1DataAvailability.l1_data_gas.toLocaleString()}
                  </span>
                </div>
              )}
          </div>
        </div>
      )}

      {resources.length === 0 && !l1DataAvailability && actualFee && (
        <p className="text-xs text-slate-500 italic">
          Detailed execution resources not available for this transaction.
        </p>
      )}
    </div>
  )
}
