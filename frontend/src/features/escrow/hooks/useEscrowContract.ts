"use client"

import { useAccount, useSendTransaction } from "@starknet-react/core"
import { ESCROW_CONTRACT_ADDRESS, STARK_TOKEN_ADDRESS } from "@/lib/constants"
import { CreateEscrowInput } from "../types"
import { Call, uint256 } from "starknet"
import { useCallback, useMemo } from "react"

export function useEscrowContract() {
  const { address } = useAccount()

  const {
    sendAsync,
    isPending: isLoading,
    error,
  } = useSendTransaction({
    calls: undefined,
  })

  const createEscrow = useCallback(
    async (input: CreateEscrowInput) => {
      if (!address) throw new Error("Wallet not connected")

      const amountWei = BigInt(Math.floor(Number(input.amount) * 1e18))
      const amountUint256 = uint256.bnToUint256(amountWei)

      // First, approve the escrow contract to spend tokens
      const approveCall: Call = {
        contractAddress: STARK_TOKEN_ADDRESS,
        entrypoint: "approve",
        calldata: [
          ESCROW_CONTRACT_ADDRESS,
          amountUint256.low.toString(),
          amountUint256.high.toString(),
        ],
      }

      // Then, create the escrow
      const createEscrowCall: Call = {
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "create_escrow",
        calldata: [
          input.seller,
          input.arbiter,
          amountUint256.low.toString(),
          amountUint256.high.toString(),
          input.description,
        ],
      }

      return await sendAsync([approveCall, createEscrowCall])
    },
    [address, sendAsync]
  )

  const release = useCallback(
    async (escrowId: number) => {
      const call: Call = {
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "release",
        calldata: [escrowId.toString()],
      }

      return await sendAsync([call])
    },
    [sendAsync]
  )

  const refund = useCallback(
    async (escrowId: number) => {
      const call: Call = {
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "refund",
        calldata: [escrowId.toString()],
      }

      return await sendAsync([call])
    },
    [sendAsync]
  )

  const dispute = useCallback(
    async (escrowId: number) => {
      const call: Call = {
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "dispute",
        calldata: [escrowId.toString()],
      }

      return await sendAsync([call])
    },
    [sendAsync]
  )

  const resolve = useCallback(
    async (escrowId: number, releaseToSeller: boolean) => {
      const call: Call = {
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "resolve",
        calldata: [escrowId.toString(), releaseToSeller ? "1" : "0"],
      }

      return await sendAsync([call])
    },
    [sendAsync]
  )

  const functions = useMemo(
    () => ({
      createEscrow,
      release,
      refund,
      dispute,
      resolve,
    }),
    [createEscrow, release, refund, dispute, resolve]
  )

  return {
    functions,
    isLoading,
    error,
  }
}
