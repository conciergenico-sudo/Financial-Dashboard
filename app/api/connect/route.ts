// app/api/connect/route.ts
import { NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/qb/auth'

export async function GET() {
  const url = buildAuthUrl()
  return NextResponse.redirect(url)
}
