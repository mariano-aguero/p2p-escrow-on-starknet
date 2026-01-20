export interface TokenConfig {
  symbol: string
  name: string
  address: string
  decimals: number
  logo: string
  chainId: string
}

export interface NetworkTokens {
  mainnet: TokenConfig
  sepolia: TokenConfig
}

export const STRK_TOKEN: NetworkTokens = {
  mainnet: {
    symbol: "STRK",
    name: "Starknet Token",
    address:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18,
    logo: "https://assets.coingecko.com/coins/images/26433/small/starknet.png",
    chainId: "SN_MAIN",
  },
  sepolia: {
    symbol: "STRK",
    name: "Starknet Token",
    address:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18,
    logo: "https://assets.coingecko.com/coins/images/26433/small/starknet.png",
    chainId: "SN_SEPOLIA",
  },
}

// Default network (can be configured via env)
export const DEFAULT_NETWORK =
  (process.env.NEXT_PUBLIC_NETWORK as "mainnet" | "sepolia") || "sepolia"

// Get current token config based on network
export function getTokenConfig(
  network: "mainnet" | "sepolia" = DEFAULT_NETWORK
): TokenConfig {
  return STRK_TOKEN[network]
}

// Export current token address for backward compatibility
export const CURRENT_TOKEN_ADDRESS = getTokenConfig().address
