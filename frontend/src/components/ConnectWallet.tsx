"use client"

import { useAccount, useConnect, useDisconnect } from "@starknet-react/core"
import { Button } from "@/components/ui/button"
import { truncateAddress } from "@/lib/constants"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LogOut, Wallet } from "lucide-react"
import { Skeleton } from "./ui/skeleton"

export function ConnectWallet() {
  const { address, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Use useEffect to avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-32 bg-slate-800" />
        <Skeleton className="h-10 w-10 bg-slate-800" />
      </div>
    )
  }

  if (status === "connected" && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end px-3 py-1 bg-slate-800 rounded-md border border-slate-700">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold leading-none">
              Connected
            </span>
          </div>
          <span className="text-sm font-mono text-cyan-400 leading-none">
            {truncateAddress(address)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => disconnect()}
          className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
          title="Disconnect"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
            </span>
            <Wallet className="h-4 w-4" />
          </div>
          <span>Connect Wallet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {connectors.length > 0 ? (
            connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => {
                  connect({ connector })
                  setIsOpen(false)
                }}
                variant="outline"
                className="flex justify-between items-center h-14 px-4 bg-slate-950 border-slate-800 hover:bg-slate-800 text-white"
                disabled={!connector.available()}
              >
                <div className="flex items-center gap-3">
                  {connector.icon && typeof connector.icon === "string" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={connector.icon}
                      alt={connector.name}
                      className="w-6 h-6"
                    />
                  ) : (
                    <Wallet className="w-6 h-6" />
                  )}
                  <span className="font-semibold">{connector.name}</span>
                </div>
                {!connector.available() && (
                  <span className="text-xs text-muted-foreground">
                    Not available
                  </span>
                )}
              </Button>
            ))
          ) : (
            <div className="text-center py-4 text-slate-400">
              No wallet connectors found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
