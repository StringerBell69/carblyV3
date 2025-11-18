import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations } from '@/drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { sendReturnReminderEmail } from '@/lib/resend';
import { sendReturnReminderSMS } from '@/lib/twilio';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find reservations ending tomorrow (J-1)
    const endingReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.status, 'in_progress'),
        gte(reservations.endDate, tomorrow),
        lte(reservations.endDate, dayAfterTomorrow)
      ),
      with: {
        vehicle: true,
        customer: true,
        team: true,
      },
    });

    console.log(`[Cron Reminders] Found ${endingReservations.length} reservations ending tomorrow`);

    let successCount = 0;
    let errorCount = 0;

    for (const reservation of endingReservations) {
      try {
        // Send email reminder
        await sendReturnReminderEmail({
          to: reservation.customer.email,
          customerName: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
          vehicle: {
            brand: reservation.vehicle.brand,
            model: reservation.vehicle.model,
          },
          returnDate: reservation.endDate.toLocaleDateString('fr-FR'),
          returnAddress: reservation.team.address || reservation.team.name,
        });

        // Send SMS reminder if enabled and phone available
        if (reservation.team.smsNotificationsEnabled && reservation.customer.phone) {
          await sendReturnReminderSMS({
            to: reservation.customer.phone,
            customerName: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
            vehicle: {
              brand: reservation.vehicle.brand,
              model: reservation.vehicle.model,
            },
            returnDate: reservation.endDate.toLocaleDateString('fr-FR'),
          });
        }

        successCount++;
        console.log(`[Cron Reminders] Sent reminder for reservation ${reservation.id}`);
      } catch (error) {
        errorCount++;
        console.error(`[Cron Reminders] Failed to send reminder for ${reservation.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: endingReservations.length,
      successCount,
      errorCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron Reminders] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
