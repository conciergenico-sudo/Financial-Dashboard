// app/api/auth/quickbooks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/qb/auth'
import { saveTokens } from '@/lib/qb/client'
import type { QBTokens } from '@/types/dashboard'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const realmId = searchParams.get('realmId')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, req.url))
  }

  if (!code || !realmId) {
    return NextResponse.redirect(new URL('/?error=missing_params', req.url))
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('QB OAuth: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set')
    return NextResponse.redirect(
      new URL('/?error=Redis+not+configured.+Add+UPSTASH_REDIS_REST_URL+and+UPSTASH_REDIS_REST_TOKEN+to+Vercel+env+vars.', req.url)
    )
  }

  try {
    console.log('QB OAuth: exchanging code for tokens, realmId:', realmId)
    const tokens = await exchangeCodeForTokens(code)

    const qbTokens: QBTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      realm_id: realmId,
      expires_at: Date.now() + (typeof tokens.expires_in === 'number' ? tokens.expires_in : 3600) * 1000,
    }

    console.log('QB OAuth: saving tokens to Redis under key qb_tokens')
    await saveTokens(qbTokens)

    console.log('QB OAuth: token save succeeded — redirecting to dashboard')
    return NextResponse.redirect(new URL('/', req.url))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('QB OAuth callback error:', message)
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(message)}`, req.url)
    )
  }
}
