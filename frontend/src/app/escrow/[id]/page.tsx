"use client"

import { useParams } from "next/navigation"
import { useEscrow } from "@/features/escrow/hooks/useEscrowQueries"
import { EscrowDetail } from "@/features/escrow/components/EscrowDetail"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Suspense } from "react"

export default function EscrowPage() {
  const params = useParams()
  const id = Number(params.id)

  return (
    <div className="container py-8 space-y-6 px-4 md:px-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Escrow #{id}</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<EscrowDetailSkeleton />}>
          <EscrowContent id={id} />
        </Suspense>
      </div>
    </div>
  )
}

function EscrowContent({ id }: { id: number }) {
  const { data: escrow, isLoading, error } = useEscrow(id)

  if (isLoading) {
    return <EscrowDetailSkeleton />
  }

  if (error || !escrow) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div className="p-4 bg-destructive/10 rounded-full mb-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Escrow Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          We couldn&apos;t find an escrow with ID #{id}. It might not exist or
          there was an error fetching it.
        </p>
        <Button asChild variant="outline">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <EscrowDetail
      escrowId={id}
      open={true}
      onOpenChange={() => {}} // No-op since this is a page
    />
  )
}

function EscrowDetailSkeleton() {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-slate-950 p-6 rounded-lg border border-slate-800">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
