import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messageTemplates, hiddenTemplates } from '@/drizzle/schema';
import { eq, and, desc, isNull, or, inArray, notInArray } from 'drizzle-orm';
import { getCurrentTeamId } from '@/lib/session';
import { seedDefaultTemplates } from '@/lib/seed/default-templates';

// GET /api/templates - Get all templates for current team (including non-hidden defaults)
export async function GET() {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure default templates exist
    await seedDefaultTemplates();

    // Get team's custom templates
    const teamTemplates = await db.query.messageTemplates.findMany({
      where: eq(messageTemplates.teamId, teamId),
      orderBy: desc(messageTemplates.createdAt),
    });

    // Get hidden template IDs for this team
    const hidden = await db.query.hiddenTemplates.findMany({
      where: eq(hiddenTemplates.teamId, teamId),
    });
    const hiddenIds = hidden.map((h) => h.templateId);

    // Get default templates (not hidden by this team)
    let defaultTemplates;
    if (hiddenIds.length > 0) {
      defaultTemplates = await db.query.messageTemplates.findMany({
        where: and(
          eq(messageTemplates.isDefault, true),
          notInArray(messageTemplates.id, hiddenIds)
        ),
        orderBy: desc(messageTemplates.createdAt),
      });
    } else {
      defaultTemplates = await db.query.messageTemplates.findMany({
        where: eq(messageTemplates.isDefault, true),
        orderBy: desc(messageTemplates.createdAt),
      });
    }

    // Combine and return (team templates first, then defaults)
    const allTemplates = [...teamTemplates, ...defaultTemplates];

    return NextResponse.json(allTemplates);
  } catch (error) {
    console.error('[GET /api/templates]', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create new template
export async function POST(req: NextRequest) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, subject, message } = body;

    if (!name || !type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type === 'email' && !subject) {
      return NextResponse.json(
        { error: 'Subject is required for email templates' },
        { status: 400 }
      );
    }

    const [template] = await db
      .insert(messageTemplates)
      .values({
        teamId,
        name,
        type,
        subject: type === 'email' ? subject : null,
        message,
        isDefault: false, // Team templates are not defaults
      })
      .returning();

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('[POST /api/templates]', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
