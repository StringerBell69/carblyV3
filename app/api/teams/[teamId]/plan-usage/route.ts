import { NextRequest, NextResponse } from 'next/server'
import { getPlanUsage } from '@/lib/plan-limits'

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const usage = await getPlanUsage(params.teamId)
    return NextResponse.json(usage)
  } catch (error) {
    console.error('Failed to fetch plan usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plan usage' },
      { status: 500 }
    )
  }
}
