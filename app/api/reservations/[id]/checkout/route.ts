import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations, vehicles } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.currentTeamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mileage, fuelLevel, notes, photos } = body;

    // Get reservation
    const reservation = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.id, params.id),
        eq(reservations.teamId, session.user.currentTeamId)
      ),
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Reservation must be in progress' },
        { status: 400 }
      );
    }

    // Update reservation with check-out data
    await db
      .update(reservations)
      .set({
        checkoutAt: new Date(),
        checkoutMileage: mileage,
        checkoutFuelLevel: fuelLevel,
        checkoutNotes: notes,
        checkoutPhotos: photos,
        status: 'completed',
      })
      .where(eq(reservations.id, params.id));

    // Update vehicle status back to available
    await db
      .update(vehicles)
      .set({ status: 'available', mileage })
      .where(eq(vehicles.id, reservation.vehicleId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/reservations/[id]/checkout]', error);
    return NextResponse.json(
      { error: 'Failed to process check-out' },
      { status: 500 }
    );
  }
}
