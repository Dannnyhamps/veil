import { Asset, Networks } from '@stellar/stellar-sdk'

export type AssetNetwork = 'mainnet' | 'testnet' | 'all'

export interface RegisteredAsset {
  code: string
  issuer: string
  name: string
  issuerName: string
  homeDomain?: string
  network: AssetNetwork
  kind: 'treasury' | 'fund' | 'equity' | 'stablecoin' | 'native'
  reserveXlm?: number
  sacContractId?: string
}

function asset(
  code: string,
  issuer: string,
  name: string,
  issuerName: string,
  homeDomain: string | undefined,
  network: AssetNetwork,
  kind: RegisteredAsset['kind'],
  sacNetworkPassphrase?: string,
): RegisteredAsset {
  return {
    code,
    issuer,
    name,
    issuerName,
    ...(homeDomain ? { homeDomain } : {}),
    network,
    kind,
    reserveXlm: 0.5,
    ...(sacNetworkPassphrase
      ? { sacContractId: new Asset(code, issuer).contractId(sacNetworkPassphrase) }
      : {}),
  }
}

/** The sole issuer registry. Keys are unique per network when a code is reused. */
export const ASSET_REGISTRY: Record<string, RegisteredAsset> = {
  'USDY:mainnet': asset(
    'USDY',
    'GAJMPX5NBOG6TQFPQGRABJEEB2YE7RFRLUKJDZAZGAD5GFX4J7TADAZ6',
    'Ondo US Dollar Yield',
    'Ondo Finance',
    'ondo.finance',
    'mainnet',
    'treasury',
  ),
  'USDC:mainnet': asset(
    'USDC',
    'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    'USD Coin',
    'Circle',
    'circle.com',
    'mainnet',
    'stablecoin',
  ),
  'USDC:testnet': asset(
    'USDC',
    'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    'USD Coin',
    'Circle',
    'circle.com',
    'testnet',
    'stablecoin',
  ),
  'USDT0:mainnet': asset(
    'USDT0',
    'GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q',
    'Tether USD',
    'Tether',
    undefined,
    'mainnet',
    'stablecoin',
    Networks.PUBLIC,
  ),
  'NGNC:mainnet': asset(
    'NGNC',
    'GASBV6W7GGED66MXEVC7YZHTWWYMSVYEY35USF2HJZBLABLYIFQGXZY6',
    'Nigerian Naira',
    'Link.io',
    undefined,
    'mainnet',
    'stablecoin',
  ),
}

export const USDY_MAINNET_ISSUER = ASSET_REGISTRY['USDY:mainnet'].issuer
export const USDC_MAINNET_ISSUER = ASSET_REGISTRY['USDC:mainnet'].issuer
export const USDC_TESTNET_ISSUER = ASSET_REGISTRY['USDC:testnet'].issuer
export const USDT0_MAINNET_ISSUER = ASSET_REGISTRY['USDT0:mainnet'].issuer
export const USDT0_MAINNET_SAC = ASSET_REGISTRY['USDT0:mainnet'].sacContractId!

const registeredAssets = Object.values(ASSET_REGISTRY)

export function getRegisteredAsset(
  code: string,
  issuer: string,
  network?: Exclude<AssetNetwork, 'all'>,
): RegisteredAsset | null {
  return registeredAssets.find(
    (candidate) =>
      candidate.code.toUpperCase() === code.toUpperCase() &&
      candidate.issuer === issuer &&
      (!network || candidate.network === 'all' || candidate.network === network),
  ) ?? null
}

export function getAssetIssuer(
  code: string,
  network: Exclude<AssetNetwork, 'all'> = 'mainnet',
): string | null {
  return registeredAssets.find(
    (candidate) =>
      candidate.code.toUpperCase() === code.toUpperCase() &&
      (candidate.network === 'all' || candidate.network === network),
  )?.issuer ?? null
}

export function isRegisteredIssuer(
  code: string,
  issuer: string,
  network?: Exclude<AssetNetwork, 'all'>,
): boolean {
  return getRegisteredAsset(code, issuer, network) !== null
}