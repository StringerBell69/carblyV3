import { NextRequest, NextResponse } from 'next/server'
import { getPlanFeatures } from '@/lib/plan-limits'

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const features = await getPlanFeatures(params.teamId)
    return NextResponse.json(features)
  } catch (error) {
    console.error('Failed to fetch plan features:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plan features' },
      { status: 500 }
    )
  }
}
