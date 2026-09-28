import { Networks } from '@stellar/stellar-sdk'
import { DEFAULT_NETWORK, getAssetIssuer } from './assets.js'

/**
 * Which Stellar network this agent serves, and every endpoint that follows
 * from it — decided in one place.
 *
 * Each module used to read its own env vars with its own testnet default. So
 * STELLAR_NETWORK=mainnet signed transactions for mainnet while balances,
 * history and account loads still came from testnet Horizon. Now one variable
 * picks the network and the endpoints come with it; the URL variables only
 * override individual endpoints.
 *
 * Mainnet by default, because that is where Veil's users are. Run a second
 * instance with STELLAR_NETWORK=testnet for testnet.
 */
export type StellarNetwork = 'mainnet' | 'testnet'

// `DEFAULT_NETWORK` follows NEXT_PUBLIC_NETWORK for API routes embedded in the
// wallet, while allowing standalone agent deployments to use STELLAR_NETWORK.
export const NETWORK: StellarNetwork = DEFAULT_NETWORK

const DEFAULTS = {
  mainnet: {
    passphrase: Networks.PUBLIC,
    horizonUrl: 'https://horizon.stellar.org',
    // SDF runs no public mainnet RPC. This is Veil's own proxy, which fails over
    // across several providers — the same one the web and mobile apps use.
    sorobanRpcUrl: 'https://app.useveilapp.xyz/api/rpc/mainnet',
  },
  testnet: {
    passphrase: Networks.TESTNET,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  },
} as const

const d = DEFAULTS[NETWORK]

export const NETWORK_PASSPHRASE: string = d.passphrase
export const HORIZON_URL = process.env.HORIZON_URL?.trim() || d.horizonUrl
export const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL?.trim() || d.sorobanRpcUrl

/** USDC's issuer on this network, resolved from the shared registry. */
export const USDC_ISSUER: string = getAssetIssuer('USDC', NETWORK)!
