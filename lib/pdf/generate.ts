'use server';

import { renderToBuffer } from '@react-pdf/renderer';
import { ContractPDF } from './contract';
import { uploadToR2 } from '../r2';
import { db } from '../db';
import { reservations } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function generateContractPDF(reservationId: string): Promise<{
  pdfUrl?: string;
  error?: string;
}> {
  try {
    // Fetch reservation with all related data
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.id, reservationId),
      with: {
        vehicle: true,
        customer: true,
        team: {
          with: {
            organization: true,
          },
        },
      },
    });

    if (!reservation) {
      return { error: 'Reservation not found' };
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <ContractPDF
        reservation={reservation}
        vehicle={reservation.vehicle}
        customer={reservation.customer}
        team={reservation.team}
        organization={reservation.team.organization}
      />
    );

    // Upload to R2
    const path = `contracts/${reservation.teamId}/${reservationId}.pdf`;
    const pdfUrl = await uploadToR2({
      file: Buffer.from(pdfBuffer),
      path,
      contentType: 'application/pdf',
    });

    return { pdfUrl };
  } catch (error) {
    console.error('[generateContractPDF]', error);
    return { error: 'Failed to generate contract PDF' };
  }
}
