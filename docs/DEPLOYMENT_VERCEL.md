# Deploying StarkEscrow to Vercel

This guide provides step-by-step instructions on how to deploy the **StarkEscrow** frontend to Vercel.

## Prerequisites

- A [Vercel](https://vercel.com/) account.
- The project's source code hosted on GitHub (e.g., `https://github.com/mariano-aguero/p2p-escrow-on-starknet`).

## Deployment Steps

1. **Import Project**:
   - Log in to your Vercel dashboard.
   - Click on **"Add New"** and then **"Project"**.
   - Select your `p2p-escrow-on-starknet` repository from GitHub.

2. **Configure Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: Select `frontend` (Important: since this is a monorepo, the frontend code is in the `frontend/` folder).
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`

3. **Environment Variables**:
   Add the following environment variables required by the frontend:
   - `NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS`: The address of your deployed Escrow contract on Starknet.
   - `NEXT_PUBLIC_STARK_TOKEN_ADDRESS`: The address of the STARK token (e.g., `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` for Sepolia).
   - `NEXT_PUBLIC_NETWORK`: `sepolia` (or `mainnet` if applicable).

4. **Deploy**:
   - Click **"Deploy"**. Vercel will automatically detect the configuration, install dependencies using `pnpm`, and build the application.

## Continuous Deployment

Once deployed, every push to the `main` branch will automatically trigger a new deployment on Vercel. Pull Requests will generate **Preview Deployments**, allowing you to test changes before merging.

## Monorepo Considerations

Vercel handles pnpm workspaces automatically. Ensure that the `pnpm-lock.yaml` file in the root directory is kept up to date, as Vercel uses it to install dependencies efficiently.
