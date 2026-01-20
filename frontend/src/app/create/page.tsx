"use client"

import { CreateEscrowModal } from "@/features/escrow/components/CreateEscrowModal"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ShieldPlus } from "lucide-react"

export default function CreatePage() {
  return (
    <div className="container py-8 space-y-8 px-4 md:px-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create New Escrow</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-card border rounded-3xl overflow-hidden shadow-xl">
          <div className="p-8 border-b bg-muted/30 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl">
              <ShieldPlus className="h-8 w-8 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Initiate Secure Transaction</h2>
              <p className="text-sm text-muted-foreground">
                Set up a new escrow by providing the seller, arbiter, and
                amount.
              </p>
            </div>
          </div>
          <div className="p-8">
            <CreateEscrowModal />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border bg-muted/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/10 text-xs text-cyan-500 ring-1 ring-cyan-500/30">
                1
              </span>
              Locked Funds
            </h3>
            <p className="text-sm text-muted-foreground">
              Your funds are held securely in the smart contract until
              conditions are met.
            </p>
          </div>
          <div className="p-6 rounded-2xl border bg-muted/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/10 text-xs text-cyan-500 ring-1 ring-cyan-500/30">
                2
              </span>
              Arbitration Support
            </h3>
            <p className="text-sm text-muted-foreground">
              The assigned arbiter can resolve disputes if the buyer and seller
              cannot agree.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
