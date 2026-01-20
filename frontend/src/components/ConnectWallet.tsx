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
        <div className="flex flex-col items-end rounded-md border border-slate-700 bg-slate-800 px-3 py-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase leading-none tracking-wider text-slate-400">
              Connected
            </span>
          </div>
          <span className="font-mono text-sm leading-none text-cyan-400">
            {truncateAddress(address)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => disconnect()}
          className="text-slate-400 hover:bg-red-400/10 hover:text-red-400"
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
              <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-500"></span>
            </span>
            <Wallet className="h-4 w-4" />
          </div>
          <span>Connect Wallet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
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
                className="flex h-14 items-center justify-between border-slate-800 bg-slate-950 px-4 text-white hover:bg-slate-800"
                disabled={!connector.available()}
              >
                <div className="flex items-center gap-3">
                  {connector.icon && typeof connector.icon === "string" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={connector.icon}
                      alt={connector.name}
                      className="h-6 w-6"
                    />
                  ) : (
                    <Wallet className="h-6 w-6" />
                  )}
                  <span className="font-semibold">{connector.name}</span>
                </div>
                {!connector.available() && (
                  <span className="text-muted-foreground text-xs">
                    Not available
                  </span>
                )}
              </Button>
            ))
          ) : (
            <div className="py-4 text-center text-slate-400">
              No wallet connectors found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
