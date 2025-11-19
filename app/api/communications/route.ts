import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communications, customers } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentTeamId } from '@/lib/session';

// GET /api/communications - Get all communications for current team
export async function GET() {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comms = await db.query.communications.findMany({
      where: eq(communications.teamId, teamId),
      orderBy: desc(communications.createdAt),
      with: {
        customer: true,
      },
    });

    return NextResponse.json(comms);
  } catch (error) {
    console.error('[GET /api/communications]', error);
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}

// POST /api/communications - Send new communication
export async function POST(req: NextRequest) {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, type, subject, message } = body;

    if (!customerId || !type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type === 'email' && !subject) {
      return NextResponse.json(
        { error: 'Subject is required for emails' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create communication record
    const [comm] = await db
      .insert(communications)
      .values({
        teamId,
        customerId,
        type,
        subject: type === 'email' ? subject : null,
        message,
        status: 'pending',
      })
      .returning();

    // TODO: Implement actual email/SMS sending logic here
    // For now, we'll just mark it as sent
    // In a real implementation, you'd integrate with services like:
    // - Resend/SendGrid for emails
    // - Twilio for SMS

    // Simulate sending
    await db
      .update(communications)
      .set({
        status: 'sent',
        sentAt: new Date(),
      })
      .where(eq(communications.id, comm.id));

    const updatedComm = await db.query.communications.findFirst({
      where: eq(communications.id, comm.id),
      with: {
        customer: true,
      },
    });

    return NextResponse.json(updatedComm, { status: 201 });
  } catch (error) {
    console.error('[POST /api/communications]', error);
    return NextResponse.json(
      { error: 'Failed to send communication' },
      { status: 500 }
    );
  }
}
