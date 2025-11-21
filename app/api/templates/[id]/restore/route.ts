import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messageTemplates, hiddenTemplates } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentTeamId } from '@/lib/session';

// POST /api/templates/[id]/restore - Restore (unhide) a hidden default template
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify template exists and is a default template
    const template = await db.query.messageTemplates.findFirst({
      where: eq(messageTemplates.id, id),
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (!template.isDefault) {
      return NextResponse.json(
        { error: 'Only default templates can be restored' },
        { status: 400 }
      );
    }

    // Remove from hidden templates
    await db
      .delete(hiddenTemplates)
      .where(
        and(eq(hiddenTemplates.teamId, teamId), eq(hiddenTemplates.templateId, id))
      );

    return NextResponse.json({ success: true, restored: true });
  } catch (error) {
    console.error('[POST /api/templates/[id]/restore]', error);
    return NextResponse.json(
      { error: 'Failed to restore template' },
      { status: 500 }
    );
  }
}
