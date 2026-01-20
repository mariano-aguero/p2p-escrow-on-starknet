"use client"

import Link from "next/link"
import { ConnectWallet } from "./ConnectWallet"
import { ShieldCheck, Menu, X, PlusCircle, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { useAccount, useNetwork } from "@starknet-react/core"
import { sepolia } from "@starknet-react/chains"
import { ESCROW_CONTRACT_ADDRESS } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { status } = useAccount()
  const { chain } = useNetwork()

  const isWrongNetwork = status === "connected" && chain?.id !== sepolia.id

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      {isWrongNetwork && (
        <div className="bg-destructive text-destructive-foreground flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Wrong Network: StarkEscrow only works on{" "}
            <strong>Starknet Sepolia</strong> at the moment.
          </span>
        </div>
      )}
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-cyan-500" />
            <span className="inline-block font-bold sm:text-xl">
              StarkEscrow
            </span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link
              href="/"
              className="hover:text-primary text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className="hover:text-primary flex items-center gap-1 text-sm font-medium transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Create Escrow
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center sm:flex">
            <div
              className={cn(
                "flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
                isWrongNetwork
                  ? "bg-destructive/10 text-destructive ring-destructive/20"
                  : "bg-cyan-500/10 text-cyan-500 ring-1 ring-cyan-500/20"
              )}
            >
              {isWrongNetwork ? "Unsupported Network" : "Sepolia Testnet"}
            </div>
          </div>
          <ConnectWallet />
          <button
            className="flex items-center space-x-2 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="bg-background flex flex-col gap-4 border-b p-4 md:hidden">
          <Link
            href="/"
            className="border-b py-2 text-sm font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/create"
            className="border-b py-2 text-sm font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Create Escrow
          </Link>
          <div className="flex justify-center pt-2">
            <div
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
                isWrongNetwork
                  ? "bg-destructive/10 text-destructive ring-destructive/20"
                  : "bg-cyan-500/10 text-cyan-500 ring-1 ring-cyan-500/20"
              )}
            >
              {isWrongNetwork ? "Unsupported Network" : "Sepolia Testnet"}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
