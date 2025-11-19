import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { generateContractPDF } from '@/lib/pdf/generate';
import { sendPaymentConfirmedEmail } from '@/lib/resend';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find reservation by token
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.magicLinkToken, token),
      with: {
        vehicle: true,
        customer: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check if reservation is paid
    if (reservation.status === 'pending_payment' || reservation.status === 'draft') {
      return NextResponse.json(
        { error: 'Reservation must be paid first' },
        { status: 400 }
      );
    }

    // Generate contract PDF
    const contractResult = await generateContractPDF(reservation.id);

    if (contractResult.error) {
      console.error('[Generate Contract] Failed:', contractResult.error);
      return NextResponse.json(
        { error: 'Failed to generate contract' },
        { status: 500 }
      );
    }

    // Send email with contract link if it wasn't sent before
    try {
      await sendPaymentConfirmedEmail({
        to: reservation.customer.email,
        customerName: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
        vehicle: {
          brand: reservation.vehicle.brand,
          model: reservation.vehicle.model,
        },
        yousignLink: contractResult.pdfUrl,
      });
    } catch (emailError) {
      console.error('[Generate Contract] Failed to send email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      contractUrl: contractResult.pdfUrl,
    });
  } catch (error) {
    console.error('[POST /api/reservations/public/[token]/generate-contract]', error);
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}
