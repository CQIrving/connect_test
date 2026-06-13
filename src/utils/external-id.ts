import { md5 } from 'js-md5'

export const RESOURCE_FIXED_KEY = 'dpt-demo-fixed-key'
export const MD5_LENGTH = 32

export function generateExternalId(plaintext: string, key = RESOURCE_FIXED_KEY): string {
  const normalized = String(plaintext || '')
  return `${md5(normalized + key)}${normalized}`
}

export function parseExternalId(externalId: string): string {
  const normalized = String(externalId || '')
  if (normalized.length <= MD5_LENGTH) return ''
  return normalized.slice(MD5_LENGTH)
}

export function validateExternalId(externalId: string, key = RESOURCE_FIXED_KEY): boolean {
  const normalized = String(externalId || '')
  if (normalized.length <= MD5_LENGTH) return false
  const digest = normalized.slice(0, MD5_LENGTH)
  const plaintext = parseExternalId(normalized)
  return digest === md5(plaintext + key)
}
