"use client"

import React, { useMemo } from "react"
import { sepolia } from "@starknet-react/chains"
import {
  StarknetConfig,
  jsonRpcProvider,
  argent,
  braavos,
  useInjectedConnectors,
  voyager,
} from "@starknet-react/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), [])

  const { connectors } = useInjectedConnectors({
    recommended: [argent(), braavos()],
    includeRecommended: "always",
    order: "alphabetical",
  })

  function rpc() {
    return {
      nodeUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL,
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StarknetConfig
        chains={[sepolia]}
        provider={jsonRpcProvider({ rpc })}
        connectors={connectors}
        explorer={voyager}
        autoConnect
      >
        {children}
      </StarknetConfig>
    </QueryClientProvider>
  )
}
