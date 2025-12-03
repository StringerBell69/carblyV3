import { NextRequest, NextResponse } from 'next/server'
import { getPlanUsage } from '@/lib/plan-limits'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const usage = await getPlanUsage(teamId)
    return NextResponse.json(usage)
  } catch (error) {
    console.error('Failed to fetch plan usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plan usage' },
      { status: 500 }
    )
  }
}
