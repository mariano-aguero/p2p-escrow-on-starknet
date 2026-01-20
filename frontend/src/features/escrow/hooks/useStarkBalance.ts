import { useEffect, useState } from "react"
import { useAccount, useReadContract } from "@starknet-react/core"
import { STARK_TOKEN_ADDRESS, ERC20_ABI } from "@/lib/constants"
import { uint256 } from "starknet"

export function useStarkBalance() {
  const { address, status } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data, isLoading, isError, refetch } = useReadContract({
    address: STARK_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    enabled: mounted && status === "connected" && !!address,
    watch: true,
  })

  // Handle u256 format from Starknet
  // The data can be returned as an object with low/high properties or as a bigint
  const balance = data
    ? typeof data === "object" && "low" in data && "high" in data
      ? uint256.uint256ToBN(data)
      : BigInt(data.toString())
    : BigInt(0)

  return {
    balance,
    isLoading,
    isError,
    refetch,
  }
}
