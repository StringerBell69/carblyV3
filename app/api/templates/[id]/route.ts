import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messageTemplates } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentTeamId } from '@/lib/session';

// PUT /api/templates/[id] - Update template
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, subject, message } = body;

    // Verify template exists and belongs to team
    const template = await db.query.messageTemplates.findFirst({
      where: and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.teamId, teamId)
      ),
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (type === 'email' && !subject) {
      return NextResponse.json(
        { error: 'Subject is required for email templates' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(messageTemplates)
      .set({
        name: name ?? template.name,
        type: type ?? template.type,
        subject: type === 'email' ? subject : null,
        message: message ?? template.message,
        updatedAt: new Date(),
      })
      .where(eq(messageTemplates.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PUT /api/templates/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify template exists and belongs to team
    const template = await db.query.messageTemplates.findFirst({
      where: and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.teamId, teamId)
      ),
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await db.delete(messageTemplates).where(eq(messageTemplates.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/templates/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
