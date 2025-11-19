import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hiddenTemplates } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getCurrentTeamId } from '@/lib/session';

// GET /api/templates/hidden - Get all hidden templates for current team
export async function GET() {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hidden = await db.query.hiddenTemplates.findMany({
      where: eq(hiddenTemplates.teamId, teamId),
      with: {
        template: true,
      },
    });

    // Return just the templates
    const templates = hidden.map((h) => h.template);

    return NextResponse.json(templates);
  } catch (error) {
    console.error('[GET /api/templates/hidden]', error);
    return NextResponse.json(
      { error: 'Failed to fetch hidden templates' },
      { status: 500 }
    );
  }
}
