"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  Loader2,
  Wallet,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react"
import {
  useAccount,
  useTransactionReceipt,
  useEstimateFees,
} from "@starknet-react/core"
import { uint256, Call } from "starknet"
import { TransactionStepper } from "@/components/TransactionStepper"
import { GasBreakdown } from "@/components/GasBreakdown"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEscrowContract } from "../hooks/useEscrowContract"
import { useStarkBalance } from "../hooks/useStarkBalance"
import {
  ESCROW_CONTRACT_ADDRESS,
  STARK_TOKEN_ADDRESS,
  formatStark,
  truncateAddress,
} from "@/lib/constants"

const createEscrowSchema = z.object({
  seller: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "Invalid Starknet address"),
  arbiter: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "Invalid Starknet address"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be greater than 0",
  }),
  description: z.string().min(3).max(31, "Description too long (max 31 chars)"),
})

type CreateEscrowForm = z.infer<typeof createEscrowSchema>

export function CreateEscrowModal() {
  const [open, setOpen] = useState(false)
  const { address } = useAccount()
  const { functions, isLoading } = useEscrowContract()
  const { balance, isLoading: isLoadingBalance } = useStarkBalance()

  // Transaction state management
  const [txHash, setTxHash] = useState<string | undefined>(undefined)
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
  const txError = transactionState.error

  const [txStartTime, setTxStartTime] = useState<number | undefined>(undefined)

  // Watch transaction receipt
  const {
    data: receipt,
    isLoading: isWaitingForReceipt,
    isError: isReceiptError,
  } = useTransactionReceipt({
    hash: txHash,
    watch: true,
    enabled: !!txHash && txStatus === "pending",
  })

  // Update stepper status when waiting for receipt
  useEffect(() => {
    if (txHash && txStatus === "pending" && txStepperStatus === "accepted") {
      setTransactionState((prev) => ({
        ...prev,
        stepperStatus: "pending",
      }))
    }
  }, [txHash, txStatus, txStepperStatus])

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

  // Handle receipt error
  useEffect(() => {
    if (isReceiptError && txStatus === "pending") {
      setTransactionState((prev) => ({
        ...prev,
        status: "error",
        error: "Failed to get transaction receipt",
      }))
    }
  }, [isReceiptError, txStatus])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateEscrowForm>({
    resolver: zodResolver(createEscrowSchema),
    defaultValues: {
      seller: "",
      arbiter: "",
      amount: "",
      description: "",
    },
  })

  // Watch form values for fee estimation
  const formValues = useWatch({ control })

  // Build calls for fee estimation
  const estimateCalls = useMemo(() => {
    if (
      !formValues.seller ||
      !formValues.arbiter ||
      !formValues.amount ||
      !formValues.description
    ) {
      return undefined
    }

    try {
      const amountWei = BigInt(Math.floor(Number(formValues.amount) * 1e18))
      const amountUint256 = uint256.bnToUint256(amountWei)

      const approveCall: Call = {
        contractAddress: STARK_TOKEN_ADDRESS,
        entrypoint: "approve",
        calldata: [
          ESCROW_CONTRACT_ADDRESS,
          amountUint256.low.toString(),
          amountUint256.high.toString(),
        ],
      }

      const createEscrowCall: Call = {
        contractAddress: ESCROW_CONTRACT_ADDRESS,
        entrypoint: "create_escrow",
        calldata: [
          formValues.seller,
          formValues.arbiter,
          amountUint256.low.toString(),
          amountUint256.high.toString(),
          formValues.description,
        ],
      }

      return [approveCall, createEscrowCall]
    } catch {
      return undefined
    }
  }, [
    formValues.seller,
    formValues.arbiter,
    formValues.amount,
    formValues.description,
  ])

  // Estimate fees
  const { data: feeEstimate, isLoading: isEstimatingFees } = useEstimateFees({
    calls: estimateCalls,
    enabled: !!estimateCalls && !!address,
  })

  const onSubmit = async (data: CreateEscrowForm) => {
    try {
      setTransactionState({
        status: "pending",
        stepperStatus: "submitted",
        error: undefined,
      })
      setTxStartTime(Date.now())

      const result = await functions.createEscrow(data)
      setTxHash(result.transaction_hash)

      // Move to accepted state after transaction is submitted
      setTransactionState((prev) => ({
        ...prev,
        stepperStatus: "accepted",
      }))
    } catch (error) {
      console.error("Failed to create escrow:", error)
      setTransactionState((prev) => ({
        ...prev,
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit transaction",
      }))
    }
  }

  const handleClose = (newOpen: boolean, force: boolean = false) => {
    // Prevent closing if transaction is pending (but allow if success/error or forced)
    if (!newOpen && txStatus === "pending" && !force) {
      return
    }

    setOpen(newOpen)

    // Reset states after modal closes
    if (!newOpen) {
      setTxHash(undefined)
      setTransactionState({
        status: "idle",
        stepperStatus: "submitted",
        error: undefined,
      })
      setTxStartTime(undefined)
      reset()
    }
  }

  const handleNewTransaction = () => {
    setTxHash(undefined)
    setTransactionState({
      status: "idle",
      stepperStatus: "submitted",
      error: undefined,
    })
    setTxStartTime(undefined)
    reset()
  }

  const setPercentage = (percentage: number) => {
    const balanceInStark = Number(balance) / 1e18
    const amount = (balanceInStark * percentage) / 100
    setValue("amount", amount.toFixed(6))
  }

  const getExplorerUrl = (hash: string) => {
    return `https://sepolia.starkscan.co/tx/${hash}`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-600 text-white hover:bg-cyan-700">
          <Plus className="mr-2 h-4 w-4" /> Create Escrow
        </Button>
      </DialogTrigger>
      <DialogContent className="flex min-h-[580px] w-[95vw] flex-col border-slate-800 bg-slate-900 text-slate-100 sm:max-w-[425px]">
        <DialogHeader className="flex-none">
          <DialogTitle>New Escrow</DialogTitle>
          <DialogDescription className="text-slate-400">
            {txStatus === "idle" &&
              "Create a new P2P escrow agreement on Starknet."}
            {txStatus === "pending" && "Processing your transaction..."}
            {txStatus === "success" && "Transaction successful!"}
            {txStatus === "error" && "Transaction failed"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col justify-center">
          {/* Transaction Status Display */}
          {txStatus === "pending" && (
            <div className="flex flex-col items-center justify-center space-y-6 py-4">
              <TransactionStepper
                status={txStepperStatus}
                startTime={txStartTime}
              />
              <div className="space-y-2 text-center">
                <p className="text-sm font-medium">
                  Processing your transaction
                </p>
                <p className="text-xs text-slate-400">
                  Your escrow is being created on Starknet
                </p>
                {txHash && (
                  <a
                    href={getExplorerUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400"
                  >
                    View on Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {txStatus === "success" && (
            <div className="flex flex-col items-center justify-center space-y-6 py-4">
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium">
                    Escrow created successfully!
                  </p>
                  <p className="text-xs text-slate-400">
                    Your escrow has been created and funded
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
                  className="w-full"
                />
              )}

              <div className="flex w-full gap-2 pt-4">
                <Button
                  onClick={handleNewTransaction}
                  variant="outline"
                  className="flex-1"
                >
                  Create Another
                </Button>
                <Button
                  onClick={() => handleClose(false, true)}
                  className="flex-1 bg-cyan-600 text-white hover:bg-cyan-700"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {txStatus === "error" && (
            <div className="flex flex-col items-center justify-center space-y-6 py-4">
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="h-12 w-12 text-red-500" />
                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium">Transaction failed</p>
                  <p className="mx-auto max-w-[280px] text-xs text-slate-400">
                    {txError ||
                      "An error occurred while processing your transaction"}
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
              </div>
              <Button
                onClick={handleNewTransaction}
                className="w-full bg-cyan-600 text-white hover:bg-cyan-700"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Form - only show when idle */}
          {txStatus === "idle" && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-1 flex-col space-y-4 py-4"
            >
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buyer">Buyer Address (You)</Label>
                  <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-400">
                    <Wallet className="h-4 w-4" />
                    <span className="font-mono text-sm">
                      {address ? truncateAddress(address) : "Not connected"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller">Seller Address</Label>
                  <Input
                    id="seller"
                    placeholder="0x..."
                    className="border-slate-800 bg-slate-950"
                    {...register("seller")}
                  />
                  {errors.seller && (
                    <p className="text-xs text-red-500">
                      {errors.seller.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arbiter">Arbiter Address</Label>
                  <Input
                    id="arbiter"
                    placeholder="0x..."
                    className="border-slate-800 bg-slate-950"
                    {...register("arbiter")}
                  />
                  {errors.arbiter && (
                    <p className="text-xs text-red-500">
                      {errors.arbiter.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="amount">Amount (STARK)</Label>
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Wallet className="h-3 w-3" />
                      {isLoadingBalance ? (
                        <span>Loading...</span>
                      ) : (
                        <span>{formatStark(balance)}</span>
                      )}
                    </div>
                  </div>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="0.01"
                    className="border-slate-800 bg-slate-950"
                    {...register("amount")}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 text-xs"
                      onClick={() => setPercentage(25)}
                      disabled={isLoadingBalance || balance === BigInt(0)}
                    >
                      25%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 text-xs"
                      onClick={() => setPercentage(50)}
                      disabled={isLoadingBalance || balance === BigInt(0)}
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 text-xs"
                      onClick={() => setPercentage(75)}
                      disabled={isLoadingBalance || balance === BigInt(0)}
                    >
                      75%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 text-xs"
                      onClick={() => setPercentage(100)}
                      disabled={isLoadingBalance || balance === BigInt(0)}
                    >
                      MAX
                    </Button>
                  </div>
                  {errors.amount && (
                    <p className="text-xs text-red-500">
                      {errors.amount.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="e.g. Domain purchase"
                    className="border-slate-800 bg-slate-950"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Estimated Fees Display - Always visible */}
                <div className="space-y-1 rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Estimated Transaction Fee:
                    </span>
                    <span className="font-medium text-slate-100">
                      {!estimateCalls ? (
                        <span className="text-xs text-slate-500">
                          Complete form to estimate
                        </span>
                      ) : isEstimatingFees ? (
                        <Loader2 className="inline h-4 w-4 animate-spin" />
                      ) : feeEstimate ? (
                        formatStark(feeEstimate.overall_fee)
                      ) : (
                        <span className="text-xs text-slate-500">
                          Estimating...
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {feeEstimate
                      ? "This is an estimate. Actual fee may vary slightly."
                      : "Fill in all fields to see the estimated transaction fee."}
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-6 flex-none">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-600 text-white hover:bg-cyan-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Fund & Create Escrow"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
