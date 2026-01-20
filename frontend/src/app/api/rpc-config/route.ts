import { NextResponse } from "next/server"

export async function GET() {
  const rpcUrl = process.env.STARKNET_RPC_URL

  if (!rpcUrl) {
    return NextResponse.json(
      { error: "RPC URL not configured" },
      { status: 500 }
    )
  }

  return NextResponse.json({ nodeUrl: rpcUrl })
}
