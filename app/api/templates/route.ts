import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messageTemplates } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentTeamId } from '@/lib/session';

// GET /api/templates - Get all templates for current team
export async function GET() {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await db.query.messageTemplates.findMany({
      where: eq(messageTemplates.teamId, teamId),
      orderBy: desc(messageTemplates.createdAt),
    });

    return NextResponse.json(templates);
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
