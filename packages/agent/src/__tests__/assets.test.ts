import { Asset, Networks, StrKey } from '@stellar/stellar-sdk'
import {
  ASSET_REGISTRY,
  getAssetIssuer,
  getRegisteredAsset,
  isRegisteredIssuer,
  USDC_MAINNET_ISSUER,
  USDC_TESTNET_ISSUER,
  USDT0_MAINNET_ISSUER,
} from '../assets.js'

describe('shared issuer registry', () => {
  it('contains only valid issuers and derived contract addresses', () => {
    for (const [key, registered] of Object.entries(ASSET_REGISTRY)) {
      expect(key).toBe(`${registered.code}:${registered.network}`)
      expect(StrKey.isValidEd25519PublicKey(registered.issuer)).toBe(true)
      if (registered.sacContractId) {
        expect(StrKey.isValidContract(registered.sacContractId)).toBe(true)
        expect(registered.sacContractId).toBe(
          new Asset(registered.code, registered.issuer).contractId(Networks.PUBLIC),
        )
      }
    }
  })

  it('keeps duplicate USDC codes distinct by issuer and network', () => {
    expect(getAssetIssuer('USDC', 'mainnet')).toBe(USDC_MAINNET_ISSUER)
    expect(getAssetIssuer('USDC', 'testnet')).toBe(USDC_TESTNET_ISSUER)
    expect(getRegisteredAsset('USDC', USDC_MAINNET_ISSUER)?.network).toBe('mainnet')
    expect(getRegisteredAsset('USDC', USDC_TESTNET_ISSUER)?.network).toBe('testnet')
    expect(getRegisteredAsset('USDC', USDC_MAINNET_ISSUER, 'testnet')).toBeNull()
    expect(getRegisteredAsset('USDC', 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF')).toBeNull()
  })

  it('rejects an unregistered issuer even when the asset code is registered', () => {
    expect(isRegisteredIssuer('USDT0', USDT0_MAINNET_ISSUER, 'mainnet')).toBe(true)
    expect(isRegisteredIssuer('USDT0', USDC_MAINNET_ISSUER, 'mainnet')).toBe(false)
    expect(getRegisteredAsset('USDT0', USDC_MAINNET_ISSUER)).toBeNull()
  })
})