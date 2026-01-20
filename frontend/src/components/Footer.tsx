import Link from "next/link"
import { Github, ExternalLink } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 md:h-24 md:flex-row md:px-8">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-muted-foreground text-center text-sm leading-loose md:text-left">
            Built on{" "}
            <span className="font-semibold text-cyan-500">
              Starknet Sepolia
            </span>
            . Secure P2P Escrow.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/mariano-aguero/starkescrow"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </Link>
          <Link
            href="https://sepolia.voyager.online"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium"
          >
            <span>Voyager</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
