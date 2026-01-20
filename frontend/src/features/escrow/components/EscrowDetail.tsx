"use client"

import { EscrowData } from "../types"
import { useEscrow } from "../hooks/useEscrowQueries"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EscrowActions } from "./EscrowActions"
import {
  formatEth,
  truncateAddress,
  STATUS_LABELS,
  STATUS_CLASSES,
} from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Copy, ExternalLink, Calendar, Info, Loader2 } from "lucide-react"

interface EscrowDetailProps {
  escrowId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EscrowDetail({
  escrowId,
  open,
  onOpenChange,
  onSuccess,
}: EscrowDetailProps) {
  const { data: escrow, isLoading, refetch } = useEscrow(escrowId || 0)

  if (!open) return null

  if (isLoading && !escrow) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex w-[95vw] items-center justify-center border-slate-800 bg-slate-900 p-12 text-slate-100 sm:max-w-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </DialogContent>
      </Dialog>
    )
  }

  if (!escrow) return null

  const date = new Date(Number(escrow.createdAt) * 1000).toLocaleString()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // In a real app, show a toast here
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto border-slate-800 bg-slate-900 text-slate-100 sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl">Escrow Details</DialogTitle>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                STATUS_CLASSES[escrow.status]
              )}
            >
              {STATUS_LABELS[escrow.status]}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="mb-1 text-sm text-slate-400">Amount</div>
            <div className="text-3xl font-bold text-cyan-500">
              {formatEth(escrow.amount)}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 text-slate-400" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Description
                </div>
                <div className="break-words text-sm text-slate-300">
                  {escrow.description}
                </div>
              </div>
            </div>

            <AddressField
              label="Buyer"
              address={escrow.buyer}
              onCopy={copyToClipboard}
            />
            <AddressField
              label="Seller"
              address={escrow.seller}
              onCopy={copyToClipboard}
            />
            <AddressField
              label="Arbiter"
              address={escrow.arbiter}
              onCopy={copyToClipboard}
            />

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Created At
                </div>
                <div className="text-sm text-slate-300">{date}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <div className="mb-3 text-xs font-semibold uppercase text-slate-500">
              Available Actions
            </div>
            <EscrowActions
              escrow={escrow}
              onSuccess={() => {
                refetch?.()
                onSuccess?.()
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddressField({
  label,
  address,
  onCopy,
}: {
  label: string
  address: string
  onCopy: (text: string) => void
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-5 w-5 items-center justify-center text-slate-400">
        <ExternalLink className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-semibold uppercase text-slate-500">
          {label}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono text-sm text-slate-300">
            {truncateAddress(address)}
          </div>
          <button
            onClick={() => onCopy(address)}
            className="text-slate-500 transition-colors hover:text-cyan-500"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
