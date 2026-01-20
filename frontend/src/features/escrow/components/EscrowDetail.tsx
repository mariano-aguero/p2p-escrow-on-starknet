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
        <DialogContent className="sm:max-w-[500px] w-[95vw] bg-slate-900 border-slate-800 text-slate-100 flex items-center justify-center p-12">
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
      <DialogContent className="sm:max-w-[500px] w-[95vw] bg-slate-900 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl">Escrow Details</DialogTitle>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                STATUS_CLASSES[escrow.status]
              )}
            >
              {STATUS_LABELS[escrow.status]}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="text-sm text-slate-400 mb-1">Amount</div>
            <div className="text-3xl font-bold text-cyan-500">
              {formatEth(escrow.amount)}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-500 uppercase font-semibold">
                  Description
                </div>
                <div className="text-sm text-slate-300 break-words">
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
                <div className="text-xs text-slate-500 uppercase font-semibold">
                  Created At
                </div>
                <div className="text-sm text-slate-300">{date}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-500 uppercase font-semibold mb-3">
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
      <div className="h-5 w-5 flex items-center justify-center text-slate-400">
        <ExternalLink className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-500 uppercase font-semibold">
          {label}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-slate-300 font-mono">
            {truncateAddress(address)}
          </div>
          <button
            onClick={() => onCopy(address)}
            className="text-slate-500 hover:text-cyan-500 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
