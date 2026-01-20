### Escrow Smart Contract State Flow

This document describes how the Escrow system works, the states a contract can transition through, and who has the authority to perform each action.

#### Flowchart (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> Funded: Buyer creates Escrow (create_escrow)
    
    Funded --> Completed: Buyer releases funds (release)
    Funded --> Refunded: Seller refunds funds (refund)
    Funded --> Disputed: Buyer or Seller initiates dispute (dispute)
    
    Disputed --> Resolved: Arbiter resolves (resolve)
    
    Completed --> [*]
    Refunded --> [*]
    Resolved --> [*]

    state Funded {
        direction lr
        note right of Funded: Funds are locked in the contract.
    }
    state Disputed {
        note right of Disputed: Only the Arbiter can unlock the funds.
    }
```

#### States and Transitions Detail

| Initial State | Action | Actor | Final State | Description |
| :--- | :--- | :--- | :--- | :--- |
| - | `create_escrow` | **Buyer** | `Funded` | The buyer deposits tokens into the smart contract. |
| `Funded` | `release` | **Buyer** | `Completed` | The buyer confirms receipt of the service/product. Funds are sent to the **Seller** (minus fee). |
| `Funded` | `refund` | **Seller** | `Refunded` | The seller decides to return the money to the buyer (e.g., cannot fulfill). Funds return to the **Buyer**. |
| `Funded` | `dispute` | **Buyer** / **Seller** | `Disputed` | One party disagrees. Funds remain locked until the arbiter intervenes. |
| `Disputed` | `resolve` | **Arbiter** | `Resolved` | The arbiter decides who is right. Can send funds to the **Seller** (minus fee) or return them to the **Buyer**. |

#### Roles and Responsibilities

*   **Buyer:**
    *   Starts the process by depositing funds.
    *   Is the only one who can voluntarily release funds (`release`).
    *   Can initiate a dispute if unsatisfied.
*   **Seller:**
    *   Receives funds once authorized by the buyer or the arbiter.
    *   Can perform a voluntary refund (`refund`).
    *   Can initiate a dispute if they believe they fulfilled the agreement and funds are not released.
*   **Arbiter:**
    *   A neutral third party defined at escrow creation.
    *   Only function is to mediate in the `Disputed` state.
    *   Has the final power to decide the destination of funds in case of conflict.

#### Fees
*   Fees are only charged when money flows to the **Seller** (either via buyer `release` or arbiter `resolve` in favor of the seller).
*   In case of a refund (`refund` or `resolve` in favor of the buyer), no fee is charged and the buyer receives the original full amount.
