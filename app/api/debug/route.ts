// app/api/debug/route.ts
import { NextResponse } from 'next/server'
import { getTokens, qbFetch } from '@/lib/qb/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const redisConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
  const qbConfigured = !!(
    process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET
  )
  const qbEndpoint = process.env.QUICKBOOKS_ENVIRONMENT === 'sandbox'
    ? 'sandbox-quickbooks.api.intuit.com'
    : 'quickbooks.api.intuit.com'

  const tokens = await getTokens()

  if (!tokens) {
    return NextResponse.json({
      redisConfigured,
      qbConfigured,
      qbEndpoint,
      hasToken: false,
    })
  }

  let companyInfo: unknown = null
  let companyError: string | null = null

  try {
    companyInfo = await qbFetch(`/companyinfo/${tokens.realm_id}`)
  } catch (err) {
    companyError = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json({
    redisConfigured,
    qbConfigured,
    qbEndpoint,
    hasToken: true,
    realmId: tokens.realm_id,
    tokenExpiresAt: new Date(tokens.expires_at).toISOString(),
    tokenExpired: tokens.expires_at < Date.now(),
    companyInfo,
    companyError,
  })
}
