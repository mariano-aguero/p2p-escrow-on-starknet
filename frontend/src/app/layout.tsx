import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { StarknetProvider } from "@/providers/StarknetProvider"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StarkEscrow | Secure P2P Escrow on Starknet",
  description:
    "A decentralized peer-to-peer escrow service built on Starknet. Safely exchange goods or services with locked funds and arbiter resolution.",
  keywords: [
    "Starknet",
    "Escrow",
    "P2P",
    "Smart Contract",
    "Blockchain",
    "Security",
    "STARK",
    "Crypto",
    "Decentralized",
  ],
  authors: [{ name: "mariano-aguero" }],
  openGraph: {
    title: "StarkEscrow | Secure P2P Escrow on Starknet",
    description:
      "Decentralized P2P escrow on Starknet. Secure your trades with smart contracts.",
    url: "https://p2p-escrow-on-starknet.vercel.app/",
    siteName: "StarkEscrow",
    images: [
      {
        url: "https://p2p-escrow-on-starknet.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "StarkEscrow Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StarkEscrow | Secure P2P Escrow on Starknet",
    description:
      "Decentralized P2P escrow on Starknet. Secure your trades with smart contracts.",
    images: ["https://p2p-escrow-on-starknet.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <StarknetProvider>
          <div className="text-foreground bg-background flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </StarknetProvider>
      </body>
    </html>
  )
}
