import path from "node:path"
import { config as loadEnv } from "dotenv"
import type { NextConfig } from "next"

// Monorepo: load shared env from repo root (Next.js only reads apps/web/.env by default)
loadEnv({ path: path.resolve(__dirname, "../../.env") })

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig
