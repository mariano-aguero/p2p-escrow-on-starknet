import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { StarknetProvider } from "@/providers/StarknetProvider"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StarkEscrow | Secure P2P Escrow on Starknet",
  description: "A decentralized P2P escrow service built on Starknet Sepolia",
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
          <div className="flex min-h-screen flex-col text-foreground bg-background">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </StarknetProvider>
      </body>
    </html>
  )
}
