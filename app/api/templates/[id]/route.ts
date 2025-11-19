import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messageTemplates, hiddenTemplates } from '@/drizzle/schema';
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

    // Cannot edit default templates
    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot edit default templates. Create a copy instead.' },
        { status: 403 }
      );
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

// DELETE /api/templates/[id] - Delete or hide template
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

    // Check if template exists
    const template = await db.query.messageTemplates.findFirst({
      where: eq(messageTemplates.id, id),
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // If it's a default template, hide it instead of deleting
    if (template.isDefault) {
      // Check if already hidden
      const existing = await db.query.hiddenTemplates.findFirst({
        where: and(
          eq(hiddenTemplates.teamId, teamId),
          eq(hiddenTemplates.templateId, id)
        ),
      });

      if (!existing) {
        await db.insert(hiddenTemplates).values({
          teamId,
          templateId: id,
        });
      }

      return NextResponse.json({ success: true, hidden: true });
    }

    // For team templates, verify ownership
    if (template.teamId !== teamId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this template' },
        { status: 403 }
      );
    }

    // Delete team template
    await db.delete(messageTemplates).where(eq(messageTemplates.id, id));

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error('[DELETE /api/templates/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
