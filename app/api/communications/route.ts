import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communications, customers } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentTeamId, getCurrentOrganizationId } from '@/lib/session';
import { sendEmail, sendSMS } from '@/lib/communications';

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

    // Verify customer exists and belongs to current organization
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, customerId),
        eq(customers.organizationId, organizationId)
      ),
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found or does not belong to your organization' }, { status: 404 });
    }

    // Validate contact information
    if (type === 'email' && !customer.email) {
      return NextResponse.json(
        { error: 'Customer does not have an email address' },
        { status: 400 }
      );
    }

    if (type === 'sms' && !customer.phone) {
      return NextResponse.json(
        { error: 'Customer does not have a phone number' },
        { status: 400 }
      );
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

    // Send the message
    let sendResult: { success: boolean; error?: string; messageId?: string };

    if (type === 'email') {
      sendResult = await sendEmail({
        to: customer.email,
        subject: subject!,
        message,
      });
    } else {
      sendResult = await sendSMS({
        to: customer.phone!,
        message,
      });
    }

    // Update communication record based on send result
    if (sendResult.success) {
      await db
        .update(communications)
        .set({
          status: 'sent',
          sentAt: new Date(),
        })
        .where(eq(communications.id, comm.id));
    } else {
      await db
        .update(communications)
        .set({
          status: 'failed',
          errorMessage: sendResult.error,
        })
        .where(eq(communications.id, comm.id));
    }

    const updatedComm = await db.query.communications.findFirst({
      where: eq(communications.id, comm.id),
      with: {
        customer: true,
      },
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || 'Failed to send message', communication: updatedComm },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedComm, { status: 201 });
  } catch (error) {
    console.error('[POST /api/communications]', error);
    return NextResponse.json(
      { error: 'Failed to send communication' },
      { status: 500 }
    );
  }
}
