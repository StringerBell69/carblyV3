import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations, vehicles } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentTeamId } from '@/lib/session';

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

    const body = await req.json();
    const { mileage, fuelLevel, notes, photos } = body;

    // Get reservation
    const reservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, id),
        eq(reservations.teamId, teamId)
      ),
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.status !== 'paid' && reservation.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Reservation must be paid or confirmed' },
        { status: 400 }
      );
    }

    // Update reservation with check-in data
    await db
      .update(reservations)
      .set({
        checkinAt: new Date(),
        checkinMileage: mileage,
        checkinFuelLevel: fuelLevel,
        checkinNotes: notes,
        checkinPhotos: photos,
        status: 'in_progress',
      })
      .where(eq(reservations.id, id));

    // Update vehicle status to rented
    await db
      .update(vehicles)
      .set({ status: 'rented' })
      .where(eq(vehicles.id, reservation.vehicleId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/reservations/[id]/checkin]', error);
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    );
  }
}
