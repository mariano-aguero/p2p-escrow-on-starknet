"use client"

import { useState, useEffect, useMemo } from "react"
import {
  useAccount,
  useTransactionReceipt,
  useEstimateFees,
} from "@starknet-react/core"
import { EscrowData, EscrowStatus } from "../types"
import { useEscrowContract } from "../hooks/useEscrowContract"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Check,
  XCircle,
  AlertCircle,
  Scale,
  ExternalLink,
} from "lucide-react"
import { GasBreakdown } from "@/components/GasBreakdown"
import { ESCROW_CONTRACT_ADDRESS, formatStark } from "@/lib/constants"
import { TransactionStepper } from "@/components/TransactionStepper"
import { Call } from "starknet"

interface EscrowActionsProps {
  escrow: EscrowData
  onSuccess?: () => void
}

export function EscrowActions({ escrow, onSuccess }: EscrowActionsProps) {
  const { address } = useAccount()
  const { functions, isLoading } = useEscrowContract()
  const [txHash, setTxHash] = useState<string | undefined>(undefined)
  const [showGasBreakdown, setShowGasBreakdown] = useState(false)
  // Use a state for the entire transaction state to reduce multiple setStates
  const [transactionState, setTransactionState] = useState<{
    status: "idle" | "pending" | "success" | "error"
    stepperStatus: "submitted" | "accepted" | "pending" | "confirmed"
    error?: string
  }>({
    status: "idle",
    stepperStatus: "submitted",
  })

  const txStatus = transactionState.status
  const txStepperStatus = transactionState.stepperStatus
  const [txStartTime, setTxStartTime] = useState<number | undefined>(undefined)

  const txError = transactionState.error

  // Watch transaction receipt
  const { data: receipt } = useTransactionReceipt({
    hash: txHash,
    watch: true,
    enabled: !!txHash,
  })

  // Update status when receipt is received
  useEffect(() => {
    if (receipt && txStatus === "pending") {
      if (receipt.isSuccess()) {
        setTransactionState({
          status: "success",
          stepperStatus: "confirmed",
        })
      } else if (receipt.isReverted()) {
        setTransactionState((prev) => ({
          ...prev,
          status: "error",
          error: "Transaction was reverted",
        }))
      } else if (receipt.isError()) {
        setTransactionState((prev) => ({
          ...prev,
          status: "error",
          error: "Transaction failed during execution",
        }))
      }
    }
  }, [receipt, txStatus])

  // Call onSuccess in a separate effect to avoid cascading renders warning
  useEffect(() => {
    if (txStatus === "success") {
      onSuccess?.()
    }
  }, [txStatus, onSuccess])

  // Update stepper status when waiting for receipt
  useEffect(() => {
    if (txHash && txStatus === "pending" && txStepperStatus === "accepted") {
      setTransactionState((prev) => ({
        ...prev,
        stepperStatus: "pending",
      }))
    }
  }, [txHash, txStatus, txStepperStatus])

  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const estimateCalls = useMemo(() => {
    if (!pendingAction || !escrow.id) return undefined

    const calls: Call[] = []
    if (pendingAction === "release") {
      calls.push({
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "release",
        calldata: [escrow.id.toString()],
      })
    } else if (pendingAction === "refund") {
      calls.push({
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "refund",
        calldata: [escrow.id.toString()],
      })
    } else if (pendingAction === "dispute") {
      calls.push({
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "dispute",
        calldata: [escrow.id.toString()],
      })
    } else if (pendingAction === "resolve-seller") {
      calls.push({
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "resolve",
        calldata: [escrow.id.toString(), "1"],
      })
    } else if (pendingAction === "resolve-buyer") {
      calls.push({
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "resolve",
        calldata: [escrow.id.toString(), "0"],
      })
    }
    return calls
  }, [pendingAction, escrow.id])

  const { data: feeEstimate, isLoading: isEstimatingFees } = useEstimateFees({
    calls: estimateCalls,
    enabled: !!estimateCalls && !!address,
  })

  const isBuyer = address?.toLowerCase() === escrow.buyer.toLowerCase()
  const isSeller = address?.toLowerCase() === escrow.seller.toLowerCase()
  const isArbiter = address?.toLowerCase() === escrow.arbiter.toLowerCase()

  const hasAvailableActions = useMemo(() => {
    if (isBuyer && escrow.status === EscrowStatus.Funded) return true
    if (isSeller && escrow.status === EscrowStatus.Funded) return true
    if (isArbiter && escrow.status === EscrowStatus.Disputed) return true
    return false
  }, [isBuyer, isSeller, isArbiter, escrow.status])

  if (!address) {
    return (
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-400 italic">
        Connect your wallet to perform actions on this escrow.
      </div>
    )
  }

  if (!isBuyer && !isSeller && !isArbiter) {
    return (
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-400 italic">
        You are not a participant in this escrow. Only the buyer, seller, or
        arbiter can perform actions.
      </div>
    )
  }

  const handleAction = async (
    action: () => Promise<any>,
    message: string,
    actionId: string
  ) => {
    if (pendingAction !== actionId) {
      setPendingAction(actionId)
      return
    }

    if (!confirm(`Are you sure you want to ${message}?`)) return

    try {
      setTransactionState({
        status: "pending",
        stepperStatus: "submitted",
        error: undefined,
      })
      setTxStartTime(Date.now())
      setShowGasBreakdown(false)

      const result = await action()
      if (result?.transaction_hash) {
        setTxHash(result.transaction_hash)
        setShowGasBreakdown(true)
        setTransactionState((prev) => ({
          ...prev,
          stepperStatus: "accepted",
        }))
      }
    } catch (error) {
      console.error(`Failed to ${message}:`, error)
      setTransactionState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : `Failed to ${message}`,
      }))
    }
  }

  const cancelPendingAction = () => {
    setPendingAction(null)
  }

  const getExplorerUrl = (hash: string) => {
    return `https://sepolia.starkscan.co/tx/${hash}`
  }

  return (
    <div className="space-y-4">
      {txStatus === "idle" && (
        <div className="flex flex-wrap gap-2">
          {!hasAvailableActions && (
            <p className="text-sm text-slate-500 italic py-1">
              No actions currently available for this escrow status.
            </p>
          )}
          {/* Buyer Actions */}
          {isBuyer && escrow.status === EscrowStatus.Funded && (
            <>
              <Button
                size="sm"
                onClick={() =>
                  handleAction(
                    () => functions.release(escrow.id),
                    "release funds",
                    "release"
                  )
                }
                disabled={
                  isLoading ||
                  (pendingAction !== null && pendingAction !== "release")
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading && pendingAction === "release" ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {pendingAction === "release" ? "Confirm Release" : "Release"}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handleAction(
                    () => functions.dispute(escrow.id),
                    "dispute this escrow",
                    "dispute"
                  )
                }
                disabled={
                  isLoading ||
                  (pendingAction !== null && pendingAction !== "dispute")
                }
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading && pendingAction === "dispute" ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="mr-2 h-4 w-4" />
                )}
                {pendingAction === "dispute" ? "Confirm Dispute" : "Dispute"}
              </Button>
            </>
          )}

          {/* Seller Actions */}
          {isSeller && escrow.status === EscrowStatus.Funded && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleAction(
                    () => functions.refund(escrow.id),
                    "refund the buyer",
                    "refund"
                  )
                }
                disabled={
                  isLoading ||
                  (pendingAction !== null && pendingAction !== "refund")
                }
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
              >
                {isLoading && pendingAction === "refund" ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                {pendingAction === "refund" ? "Confirm Refund" : "Refund"}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handleAction(
                    () => functions.dispute(escrow.id),
                    "dispute this escrow",
                    "dispute"
                  )
                }
                disabled={
                  isLoading ||
                  (pendingAction !== null && pendingAction !== "dispute")
                }
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading && pendingAction === "dispute" ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="mr-2 h-4 w-4" />
                )}
                {pendingAction === "dispute" ? "Confirm Dispute" : "Dispute"}
              </Button>
            </>
          )}

          {/* Arbiter Actions */}
          {isArbiter && escrow.status === EscrowStatus.Disputed && (
            <>
              <Button
                size="sm"
                onClick={() =>
                  handleAction(
                    () => functions.resolve(escrow.id, true),
                    "resolve to seller",
                    "resolve-seller"
                  )
                }
                disabled={
                  isLoading ||
                  (pendingAction !== null && pendingAction !== "resolve-seller")
                }
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading && pendingAction === "resolve-seller" ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Scale className="mr-2 h-4 w-4" />
                )}
                {pendingAction === "resolve-seller"
                  ? "Confirm Resolve to Seller"
                  : "Resolve to Seller"}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handleAction(
                    () => functions.resolve(escrow.id, false),
                    "resolve to buyer",
                    "resolve-buyer"
                  )
                }
                disabled={
                  isLoading ||
                  (pendingAction !== null && pendingAction !== "resolve-buyer")
                }
                className="bg-slate-700 hover:bg-slate-800"
              >
                {isLoading && pendingAction === "resolve-buyer" ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Scale className="mr-2 h-4 w-4" />
                )}
                {pendingAction === "resolve-buyer"
                  ? "Confirm Resolve to Buyer"
                  : "Resolve to Buyer"}
              </Button>
            </>
          )}

          {pendingAction && (
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelPendingAction}
              className="text-slate-400 hover:text-slate-100"
            >
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Fee Estimation for Pending Action */}
      {txStatus === "idle" && pendingAction && (
        <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Estimated Transaction Fee:</span>
            <span className="font-medium text-slate-100">
              {isEstimatingFees ? (
                <Loader2 className="h-4 w-4 animate-spin inline" />
              ) : feeEstimate ? (
                formatStark(feeEstimate.overall_fee)
              ) : (
                <span className="text-slate-500 text-xs">Estimating...</span>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            This action requires a transaction on Starknet.
          </p>
        </div>
      )}

      {/* Transaction Status Display */}
      {txStatus === "pending" && (
        <div className="flex flex-col items-center justify-center py-4 space-y-4 bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <TransactionStepper
            status={txStepperStatus}
            startTime={txStartTime}
          />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Processing action</p>
            {txHash && (
              <a
                href={getExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 mt-2"
              >
                View on Explorer <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {txStatus === "success" && (
        <div className="flex flex-col items-center justify-center py-4 space-y-4 bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <Check className="h-10 w-10 text-green-500" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              Action completed successfully!
            </p>
            {txHash && (
              <a
                href={getExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400"
              >
                View on Explorer <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {/* Gas Breakdown */}
          {receipt && receipt.isSuccess() && (
            <GasBreakdown
              actualFee={
                (receipt as any).actual_fee ||
                (receipt as any).value?.actual_fee
              }
              executionResources={
                (receipt as any).execution_resources ||
                (receipt as any).value?.execution_resources
              }
              className="w-full mt-2"
            />
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTransactionState({
                status: "idle",
                stepperStatus: "submitted",
              })
              setPendingAction(null)
              setTxHash(undefined)
            }}
            className="mt-2"
          >
            Done
          </Button>
        </div>
      )}

      {txStatus === "error" && (
        <div className="flex flex-col items-center justify-center py-4 space-y-4 bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Action failed</p>
            <p className="text-xs text-slate-400">{txError}</p>
          </div>
          <Button
            size="sm"
            onClick={() =>
              setTransactionState({
                status: "idle",
                stepperStatus: "submitted",
              })
            }
            className="bg-cyan-600 hover:bg-cyan-700 mt-2"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
