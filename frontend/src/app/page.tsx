"use client"

import { useAccount } from "@starknet-react/core"
import { EscrowList } from "@/features/escrow/components/EscrowList"
import {
  ESCROW_CONTRACT_ADDRESS,
  EscrowStatus,
  getExplorerUrl,
  truncateAddress,
} from "@/lib/constants"
import {
  ShieldCheck,
  Lock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEscrowStats } from "@/features/escrow/hooks/useEscrowQueries"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"

export default function DashboardPage() {
  const { status } = useAccount()

  return (
    <div className="container py-8 space-y-8 px-4 md:px-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-4 py-12 px-4 rounded-3xl bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20">
        <div className="p-3 bg-cyan-500/20 rounded-2xl ring-1 ring-cyan-500/50">
          <ShieldCheck className="h-10 w-10 text-cyan-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Secure P2P Escrow on <span className="text-cyan-500">Starknet</span>
        </h1>
        {ESCROW_CONTRACT_ADDRESS && ESCROW_CONTRACT_ADDRESS !== "0x0" && (
          <Link
            href={getExplorerUrl(ESCROW_CONTRACT_ADDRESS)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-500 transition-colors"
          >
            <span>Contract: {truncateAddress(ESCROW_CONTRACT_ADDRESS)}</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
        <p className="max-w-[600px] text-muted-foreground md:text-xl">
          Create trustless escrow contracts for your peer-to-peer transactions.
          Funds are locked safely until the buyer releases them or the seller
          refunds.
        </p>
        <div className="flex gap-4 pt-4">
          <Button asChild size="lg" className="h-12 px-8">
            <Link href="/create">
              <PlusCircle className="mr-2 h-5 w-5" />
              New Escrow
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-8" asChild>
            <Link
              href="https://github.com/yourusername/starkescrow"
              target="_blank"
            >
              How it works
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Main Content */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Your Escrows</h2>
        {status === "connected" ? (
          <EscrowList />
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <Lock className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-semibold mb-2">Wallet Disconnected</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Connect your wallet to view your active escrows and manage your
              transactions.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

function DashboardStats() {
  const { data: stats, isLoading } = useEscrowStats()
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Active Escrows</CardTitle>
          <Lock className="h-4 w-4 text-cyan-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "--" : stats.active}
          </div>
          <p className="text-xs text-muted-foreground">Currently funded</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "--" : stats.completed}
          </div>
          <p className="text-xs text-muted-foreground">
            Successfully released/refunded
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Disputed</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "--" : stats.disputed}
          </div>
          <p className="text-xs text-muted-foreground">Pending resolution</p>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
