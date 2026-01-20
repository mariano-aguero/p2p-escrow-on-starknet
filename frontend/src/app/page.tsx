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
    <div className="container space-y-8 px-4 py-8 md:px-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center space-y-4 rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent px-4 py-12 text-center">
        <div className="rounded-2xl bg-cyan-500/20 p-3 ring-1 ring-cyan-500/50">
          <ShieldCheck className="h-10 w-10 text-cyan-500" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Secure P2P Escrow on <span className="text-cyan-500">Starknet</span>
        </h1>
        {ESCROW_CONTRACT_ADDRESS && ESCROW_CONTRACT_ADDRESS !== "0x0" && (
          <Link
            href={getExplorerUrl(ESCROW_CONTRACT_ADDRESS)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground inline-flex items-center gap-2 text-sm transition-colors hover:text-cyan-500"
          >
            <span>Contract: {truncateAddress(ESCROW_CONTRACT_ADDRESS)}</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
        <p className="text-muted-foreground max-w-[600px] md:text-xl">
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
          <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
            <Lock className="text-muted-foreground mb-4 h-12 w-12 opacity-20" />
            <h3 className="mb-2 text-xl font-semibold">Wallet Disconnected</h3>
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Escrows</CardTitle>
          <Lock className="h-4 w-4 text-cyan-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "--" : stats.active}
          </div>
          <p className="text-muted-foreground text-xs">Currently funded</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "--" : stats.completed}
          </div>
          <p className="text-muted-foreground text-xs">
            Successfully released/refunded
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disputed</CardTitle>
          <AlertCircle className="text-destructive h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "--" : stats.disputed}
          </div>
          <p className="text-muted-foreground text-xs">Pending resolution</p>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-1 h-8 w-12" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
