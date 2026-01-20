export enum EscrowStatus {
  Empty = 0,
  Funded = 1,
  Completed = 2,
  Refunded = 3,
  Disputed = 4,
  Resolved = 5,
}

export interface EscrowData {
  id: number
  buyer: string
  seller: string
  arbiter: string
  amount: bigint
  status: EscrowStatus
  createdAt: number
  description: string
}

export interface CreateEscrowInput {
  seller: string
  arbiter: string
  amount: string
  description: string
}
