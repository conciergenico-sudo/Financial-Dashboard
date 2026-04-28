// lib/qb/client.ts
import { redis } from '@/lib/kv'
import { refreshAccessToken } from './auth'
import type { QBTokens } from '@/types/dashboard'

const KV_KEY = 'qb_tokens'
const QB_BASE = 'https://quickbooks.api.intuit.com'

export async function getTokens(): Promise<QBTokens | null> {
  try {
    const raw = await redis.get('qb_tokens')
    if (raw === null || raw === undefined) return null
    // Upstash may return the stored value as a raw JSON string instead of a parsed object
    if (typeof raw === 'string') return JSON.parse(raw) as QBTokens
    return raw as QBTokens
  } catch (err) {
    console.error('getTokens error:', err)
    return null
  }
}

export async function saveTokens(tokens: QBTokens): Promise<void> {
  await redis.set(KV_KEY, tokens)
}

async function getValidAccessToken(): Promise<{ accessToken: string; realmId: string } | null> {
  const tokens = await getTokens()
  if (!tokens) return null

  const nowMs = Date.now()
  if (tokens.expires_at - nowMs < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(tokens.refresh_token)
    const updated: QBTokens = {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      realm_id: tokens.realm_id,
      expires_at: nowMs + (typeof refreshed.expires_in === 'number' ? refreshed.expires_in : 3600) * 1000,
    }
    await saveTokens(updated)
    return { accessToken: updated.access_token, realmId: updated.realm_id }
  }

  return { accessToken: tokens.access_token, realmId: tokens.realm_id }
}

export async function qbFetch(path: string): Promise<unknown> {
  const auth = await getValidAccessToken()
  if (!auth) throw new Error('NOT_CONNECTED')

  const url = `${QB_BASE}/v3/company/${auth.realmId}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`QB API error ${res.status}: ${err}`)
  }

  return res.json()
}

export async function isConnected(): Promise<boolean> {
  const tokens = await getTokens()
  return tokens !== null
}
