"use client"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EscrowData } from "../types"
import {
  formatEth,
  truncateAddress,
  STATUS_LABELS,
  STATUS_CLASSES,
} from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Calendar, User, UserCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface EscrowCardProps {
  escrow: EscrowData
  onClick?: () => void
}

export function EscrowCard({ escrow, onClick }: EscrowCardProps) {
  const date = new Date(Number(escrow.createdAt) * 1000).toLocaleDateString()

  return (
    <Card
      className="cursor-pointer border-slate-800 bg-slate-900 text-slate-100 transition-all hover:border-cyan-500/50"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          Escrow #{escrow.id.toString()}
        </CardTitle>
        <span
          className={cn(
            "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider",
            STATUS_CLASSES[escrow.status]
          )}
        >
          {STATUS_LABELS[escrow.status]}
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-cyan-500">
          {formatEth(escrow.amount)}
        </div>
        <p className="mt-1 line-clamp-1 text-sm italic text-slate-400">
          &quot;{escrow.description}&quot;
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-xs text-slate-400">
            <User className="mr-2 h-3 w-3" />
            <span className="mr-1 font-semibold">Buyer:</span>
            {truncateAddress(escrow.buyer)}
          </div>
          <div className="flex items-center text-xs text-slate-400">
            <UserCheck className="mr-2 h-3 w-3" />
            <span className="mr-1 font-semibold">Seller:</span>
            {truncateAddress(escrow.seller)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex items-center text-[10px] text-slate-500">
          <Calendar className="mr-1 h-3 w-3" />
          {date}
        </div>
      </CardFooter>
    </Card>
  )
}

export function EscrowCardSkeleton() {
  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="mb-4 h-4 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Skeleton className="h-3 w-20" />
      </CardFooter>
    </Card>
  )
}
