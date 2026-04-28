// lib/qb/client.ts
import { redis } from '@/lib/kv'
import { refreshAccessToken } from './auth'
import type { QBTokens } from '@/types/dashboard'

const KV_KEY = 'qb_tokens'
const QB_BASE = 'https://quickbooks.api.intuit.com'

export async function getTokens(): Promise<QBTokens | null> {
  try {
    const tokens = await redis.get<QBTokens>(KV_KEY)
    return tokens
  } catch {
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
      expires_at: nowMs + refreshed.expires_in * 1000,
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
