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

  try {
    const tokens = await exchangeCodeForTokens(code, realmId)
    const qbTokens: QBTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      realm_id: realmId,
      expires_at: Date.now() + (typeof tokens.expires_in === 'number' ? tokens.expires_in : 3600) * 1000,
    }
    await saveTokens(qbTokens)
    return NextResponse.redirect(new URL('/?connected=true', req.url))
  } catch (err) {
    console.error('QB OAuth callback error:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }
}
