import { Asset, Networks, StrKey } from '@stellar/stellar-sdk'
import type { StellarNetwork } from './network.js'

const configuredNetwork = (process.env.STELLAR_NETWORK ?? process.env.NEXT_PUBLIC_NETWORK)
  ?.trim()
  .toLowerCase()

export const DEFAULT_NETWORK: StellarNetwork = configuredNetwork === 'testnet' ? 'testnet' : 'mainnet'

/**
 * Assets the agent will vouch for, keyed by code and pinned by ISSUER.
 *
 * An asset code is not an identity. Eight different issuers publish `USDT0` on
 * mainnet, and the genuine one is the only one without a stellar.toml, so a
 * code match is seven-to-one against you. Nothing here (or anywhere in the
 * agent) may call a holding "verified" because its code matches; the issuer
 * has to match too.
 */
export interface VerifiedAsset {
  code: string
  issuer: string
  /** Stellar Asset Contract id, only where it is pinned and asserted in tests. */
  sac?: string
  name: string
  issuerName: string
  homeDomain?: string
  network: StellarNetwork
  kind: 'treasury' | 'fund' | 'equity' | 'stablecoin' | 'native'
  reserveXlm?: number
  sacContractId?: string
  /** What the issuer can do to a holder, when the agent should say so. */
  issuerControls?: { clawback: boolean; freeze: boolean }
}

export type RegisteredAsset = VerifiedAsset
export type AssetNetwork = StellarNetwork | 'all'

export const USDY_MAINNET_ISSUER = 'GAJMPX5NBOG6TQFPQGRABJEEB2YE7RFRLUKJDZAZGAD5GFX4J7TADAZ6'
export const USDC_MAINNET_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
export const USDC_TESTNET_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
export const USDT0_MAINNET_ISSUER = 'GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q'
export const USDT0_MAINNET_SAC = 'CBSJZEIO5C7KC2SF3MKSNXXJSW5G3VTNBX4ATMKUI3B2MR4JKM4R26YF'
export const NGNC_MAINNET_ISSUER = 'GASBV6W7GGED66MXEVC7YZHTWWYMSVYEY35USF2HJZBLABLYIFQGXZY6'

const REGISTRY: Record<StellarNetwork, Record<string, VerifiedAsset>> = {
  mainnet: {
    USDY: {
      code: 'USDY',
      issuer: USDY_MAINNET_ISSUER,
      name: 'Ondo US Dollar Yield',
      issuerName: 'Ondo Finance',
      homeDomain: 'ondo.finance',
      network: 'mainnet',
      kind: 'treasury',
      reserveXlm: 0.5,
    },
    USDT0: {
      code: 'USDT0',
      issuer: USDT0_MAINNET_ISSUER,
      sac: USDT0_MAINNET_SAC,
      sacContractId: USDT0_MAINNET_SAC,
      name: 'USDT0',
      issuerName: 'Tether',
      network: 'mainnet',
      kind: 'stablecoin',
      reserveXlm: 0.5,
      issuerControls: { clawback: true, freeze: true },
    },
    USDC: {
      code: 'USDC',
      issuer: USDC_MAINNET_ISSUER,
      name: 'USD Coin',
      issuerName: 'Circle',
      homeDomain: 'circle.com',
      network: 'mainnet',
      kind: 'stablecoin',
      reserveXlm: 0.5,
    },
    NGNC: {
      code: 'NGNC',
      issuer: NGNC_MAINNET_ISSUER,
      name: 'Nigerian Naira',
      issuerName: 'Link.io',
      network: 'mainnet',
      kind: 'stablecoin',
      reserveXlm: 0.5,
    },
  },
  // There is no verified USDT0 on testnet: any holding of that code is unverified.
  testnet: {
    USDC: {
      code: 'USDC',
      issuer: USDC_TESTNET_ISSUER,
      name: 'USD Coin',
      issuerName: 'Circle',
      homeDomain: 'circle.com',
      network: 'testnet',
      kind: 'stablecoin',
      reserveXlm: 0.5,
    },
  },
}

/**
 * Every registered entry, flattened, so a test can assert over all of them
 * rather than over the handful that happen to be exported as constants.
 *
 * This exists because an invalid issuer has reached a PR four times. The
 * checks that should have caught it did not: the parity tests compare the
 * three copies of the registry to each other, so an address that is wrong
 * identically in all three passes, and the per-constant StrKey assertions
 * only cover the constants someone remembered to add. Iterating the registry
 * means a *new* asset is covered the moment it is added, by nobody's
 * discipline.
 */
export const ALL_REGISTERED_ASSETS: ReadonlyArray<{
  network: StellarNetwork
  asset: VerifiedAsset
}> = (Object.keys(REGISTRY) as StellarNetwork[]).flatMap((network) =>
  Object.values(REGISTRY[network]).map((asset) => ({ network, asset })),
)

/** Compatibility view for app consumers; values still come from REGISTRY. */
export const ASSET_REGISTRY: Record<string, RegisteredAsset> = Object.fromEntries(
  ALL_REGISTERED_ASSETS.flatMap(({ network, asset }) => [
    [`${asset.code}:${network}`, asset],
    ...(network === 'mainnet' ? [[asset.code, asset]] : []),
  ]),
)

/** Registered entry for a code on this network, if any. */
export function registeredAsset(code: string, network: StellarNetwork = DEFAULT_NETWORK): VerifiedAsset | null {
  return REGISTRY[network][code.trim().toUpperCase()] ?? null
}

export function getRegisteredAsset(
  code: string,
  issuerOrNetwork?: string,
  network?: AssetNetwork,
): RegisteredAsset | null {
  const argumentIsNetwork = issuerOrNetwork === 'mainnet' || issuerOrNetwork === 'testnet' || issuerOrNetwork === 'all'
  const issuer = argumentIsNetwork ? undefined : issuerOrNetwork
  const requestedNetwork = network ?? (argumentIsNetwork ? issuerOrNetwork : 'mainnet')
  const match = ALL_REGISTERED_ASSETS.find(({ network: candidateNetwork, asset }) =>
    asset.code.toUpperCase() === code.trim().toUpperCase() &&
    (!issuer || asset.issuer === issuer) &&
    (requestedNetwork === 'all' || candidateNetwork === requestedNetwork),
  )
  return match?.asset ?? null
}

export function getAssetIssuer(code: string, network: StellarNetwork = 'mainnet'): string | null {
  return registeredAsset(code, network)?.issuer ?? null
}

export function verifiedAsset(
  code: string,
  issuer: string | null | undefined,
  network: StellarNetwork,
): RegisteredAsset | null {
  if (!issuer) return null
  const registered = registeredAsset(code, network)
  if (!registered || registered.code !== code || registered.issuer !== issuer) return null
  return registered
}

export function isRegisteredIssuer(code: string, issuer: string, network?: AssetNetwork): boolean {
  return ALL_REGISTERED_ASSETS.some(
    ({ network: candidateNetwork, asset }) =>
      asset.code.toUpperCase() === code.trim().toUpperCase() &&
      asset.issuer === issuer &&
      (!network || network === 'all' || candidateNetwork === network),
  )
}

export interface HorizonIssuerFlags {
  auth_required?: boolean
  auth_revocable?: boolean
  auth_clawback_enabled?: boolean
  auth_immutable?: boolean
}

export function getAssetControlDisclosure(flags?: HorizonIssuerFlags | null): string | null {
  if (!flags) return null
  if (flags.auth_revocable && flags.auth_clawback_enabled) {
    return 'The issuer can freeze this balance or take it back, and this is a property of the asset, not of Veil.'
  }
  if (flags.auth_clawback_enabled) {
    return 'The issuer can take this balance back, and this is a property of the asset, not of Veil.'
  }
  if (flags.auth_revocable) {
    return 'The issuer can freeze this balance, and this is a property of the asset, not of Veil.'
  }
  return null
}

export async function fetchIssuerFlags(
  server: { loadAccount: (id: string) => Promise<any> },
  issuer: string,
): Promise<HorizonIssuerFlags | null> {
  try {
    const account = await server.loadAccount(issuer)
    return (account?.flags as HorizonIssuerFlags) ?? null
  } catch {
    return null
  }
}

export const KNOWN_SAC_CONTRACT_IDS: Record<'mainnet' | 'testnet', Record<string, string>> = {
  mainnet: {
    USDC: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
    USDT0: USDT0_MAINNET_SAC,
  },
  testnet: {
    USDC: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  },
}

export function sacContractIdForCode(code: string, network: StellarNetwork): string | null {
  const asset = getRegisteredAsset(code, network)
  if (!asset) return null
  if (asset.sacContractId && network === 'mainnet') return asset.sacContractId
  return KNOWN_SAC_CONTRACT_IDS[network][asset.code] ?? null
}

export const DISCLOSURE_UNAVAILABLE =
  'Could not check whether this issuer can freeze or claw back this balance. Try again before adding a trustline.'

export async function fetchAssetDisclosure(
  server: { loadAccount: (id: string) => Promise<any> },
  issuer: string,
): Promise<string | null> {
  try {
    const account = await server.loadAccount(issuer)
    return getAssetControlDisclosure((account?.flags as HorizonIssuerFlags) ?? null)
  } catch {
    return DISCLOSURE_UNAVAILABLE
  }
}

export type HoldingStatus =
  | 'verified' // code and issuer both match a registered asset
  | 'unverified' // the code is registered but this issuer is not the registered one
  | 'unlisted' // the code is not in the registry, so nothing is claimed about it

export interface Holding {
  code: string
  issuer: string
  balance: string
  status: HoldingStatus
  /** For verified and unverified holdings: the issuer the registry knows. */
  registeredIssuer?: string
  /** Plain-language line the agent should relay. */
  message: string
}

const short = (issuer: string) => `${issuer.slice(0, 6)}…${issuer.slice(-6)}`

/** Classify one issued-asset holding. The issuer is always named in the message. */
export function classifyHolding(
  code: string,
  issuer: string,
  balance: string,
  network: StellarNetwork = DEFAULT_NETWORK,
): Holding {
  const entry = registeredAsset(code, network)
  const upper = code.toUpperCase()
  if (!entry) {
    return {
      code,
      issuer,
      balance,
      status: 'unlisted',
      message: `${balance} ${code} from issuer ${issuer}. This asset is not in Veil's registry, so it is not verified.`,
    }
  }
  if (entry.issuer === issuer) {
    return {
      code,
      issuer,
      balance,
      status: 'verified',
      registeredIssuer: entry.issuer,
      message: `${balance} ${upper}, verified: issued by ${issuer}.`,
    }
  }
  return {
    code,
    issuer,
    balance,
    status: 'unverified',
    registeredIssuer: entry.issuer,
    message:
      `UNVERIFIED: ${balance} of an asset called ${upper} issued by ${issuer}. ` +
      `This is not the real ${upper} (the verified issuer is ${entry.issuer}); several issuers reuse the same code. ` +
      `Do not treat it as ${upper}.`,
  }
}

/**
 * Turn the `CODE:ISSUER` entries of a getBalances() result into classified
 * holdings. XLM entries (no issuer) are skipped. Never matches on code alone.
 */
export function classifyBalances(balances: Record<string, string>, network: StellarNetwork = DEFAULT_NETWORK): Holding[] {
  const holdings: Holding[] = []
  for (const [key, balance] of Object.entries(balances)) {
    const sep = key.indexOf(':')
    if (sep === -1) continue
    const code = key.slice(0, sep)
    const issuer = key.slice(sep + 1)
    if (!code || !StrKey.isValidEd25519PublicKey(issuer)) continue
    holdings.push(classifyHolding(code, issuer, balance, network))
  }
  return holdings
}

export interface AssetAnswer {
  asset: string
  status: HoldingStatus | 'unknown'
  issuer?: string
  sac?: string
  message: string
  issuerControls?: { clawback: boolean; freeze: boolean }
}

/**
 * Answer "what is <asset>?". Accepts `CODE` or `CODE:ISSUER`. With a bare code
 * it names the verified issuer and warns that the code alone proves nothing;
 * with an issuer it says whether that issuer is the registered one.
 */
export function describeAsset(input: string, network: StellarNetwork = DEFAULT_NETWORK): AssetAnswer {
  const [rawCode, rawIssuer] = input.trim().split(':')
  const code = rawCode.trim()
  const entry = registeredAsset(code, network)
  if (!entry) {
    return {
      asset: input,
      status: 'unknown',
      message: `${code} is not in Veil's asset registry on ${network}, so its issuer cannot be verified.`,
    }
  }
  const controls = entry.issuerControls
  const powers = controls
    ? [controls.freeze && 'freeze a trustline', controls.clawback && 'claw back a balance'].filter(Boolean)
    : []
  const controlsText = powers.length
    ? ` Its issuer can ${powers.join(' and ')}, so holdings are not censorship-resistant.`
    : ''
  const base = `The verified ${entry.code} on ${network} is issued by ${entry.issuer}${entry.sac ? ` (contract ${entry.sac})` : ''}.${controlsText} Other issuers publish assets with the same code; only this issuer is the real one.`
  if (rawIssuer) {
    const issuer = rawIssuer.trim()
    const holding = classifyHolding(entry.code, issuer, '', network)
    return {
      asset: input,
      status: holding.status,
      issuer,
      message:
        holding.status === 'verified'
          ? `${entry.code} from ${issuer} is the verified asset. ${base}`
          : `${entry.code} from ${issuer} is UNVERIFIED and is not the real ${entry.code}. ${base}`,
      issuerControls: controls,
    }
  }
  return {
    asset: input,
    status: 'verified',
    issuer: entry.issuer,
    ...(entry.sac ? { sac: entry.sac } : {}),
    message: base,
    issuerControls: controls,
  }
}

/** Derive the SAC for a registered asset, for tests to compare against the pinned id. */
export function deriveSac(asset: VerifiedAsset, passphrase: string = Networks.PUBLIC): string {
  return new Asset(asset.code, asset.issuer).contractId(passphrase)
}
