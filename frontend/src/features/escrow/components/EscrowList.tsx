"use client"

import { useState, useEffect } from "react"
import { useAccount } from "@starknet-react/core"
import { EscrowData } from "../types"
import {
  useBuyerEscrows,
  useSellerEscrows,
  useArbiterEscrows,
  useEscrow,
} from "../hooks/useEscrowQueries"
import { truncateAddress } from "@/lib/constants"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EscrowCard, EscrowCardSkeleton } from "./EscrowCard"
import { EscrowDetail } from "./EscrowDetail"
import { SearchX, Wallet } from "lucide-react"

export function EscrowList() {
  const { address, status } = useAccount()
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const {
    data: arbiterIds,
    isLoading: loadingArbiter,
    refetch: refetchArbiter,
  } = useArbiterEscrows(address || "")

  const {
    data: buyerIds,
    isLoading: loadingBuyer,
    refetch: refetchBuyer,
  } = useBuyerEscrows(address || "")
  const {
    data: sellerIds,
    isLoading: loadingSeller,
    refetch: refetchSeller,
  } = useSellerEscrows(address || "")

  console.log(loadingBuyer, loadingSeller, loadingArbiter, address)

  const handleRefreshList = () => {
    refetchArbiter()
    refetchBuyer()
    refetchSeller()
  }

  // Show loading state when wallet is connecting or not connected yet
  const isWalletLoading = status === "connecting" || status === "disconnected"

  const handleEscrowClick = (escrow: EscrowData) => {
    setSelectedEscrow(escrow)
    setDetailOpen(true)
  }

  // Use local variable for address to avoid hydration issues
  const showAddress = status === "connected" && address

  return (
    <div className="w-full">
      {showAddress && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg">
          <Wallet className="h-4 w-4 text-cyan-400" />
          <span className="text-sm text-slate-400">Connected:</span>
          <span className="text-sm font-mono text-slate-100">
            {truncateAddress(address)}
          </span>
        </div>
      )}

      <Tabs defaultValue="as-buyer" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-6">
          <TabsTrigger
            value="as-buyer"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            As Buyer
          </TabsTrigger>
          <TabsTrigger
            value="as-seller"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            As Seller
          </TabsTrigger>
          <TabsTrigger
            value="as-arbiter"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            As Arbiter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="as-buyer">
          <EscrowGrid
            ids={buyerIds || []}
            isLoading={loadingBuyer || isWalletLoading}
            onItemClick={handleEscrowClick}
          />
        </TabsContent>

        <TabsContent value="as-seller">
          <EscrowGrid
            ids={sellerIds || []}
            isLoading={loadingSeller || isWalletLoading}
            onItemClick={handleEscrowClick}
          />
        </TabsContent>

        <TabsContent value="as-arbiter">
          <EscrowGrid
            ids={arbiterIds || []}
            isLoading={loadingArbiter || isWalletLoading}
            onItemClick={handleEscrowClick}
          />
        </TabsContent>
      </Tabs>

      <EscrowDetail
        escrowId={selectedEscrow?.id || null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSuccess={handleRefreshList}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl">
      <SearchX className="h-12 w-12 text-slate-600 mb-4" />
      <h3 className="text-lg font-semibold text-slate-300">No escrows found</h3>
      <p className="text-sm text-slate-500">
        Start by creating a new escrow agreement.
      </p>
    </div>
  )
}

function EscrowGrid({
  ids,
  isLoading,
  onItemClick,
}: {
  ids: number[]
  isLoading: boolean
  onItemClick: (escrow: EscrowData) => void
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <EscrowCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (ids.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ids.map((id) => (
        <EscrowItem key={id.toString()} id={Number(id)} onClick={onItemClick} />
      ))}
    </div>
  )
}

function EscrowItem({
  id,
  onClick,
}: {
  id: number
  onClick: (escrow: EscrowData) => void
}) {
  const { data: escrow, isLoading, refetch } = useEscrow(id)

  if (isLoading || !escrow) {
    return <EscrowCardSkeleton />
  }

  return <EscrowCard escrow={escrow} onClick={() => onClick(escrow)} />
}
