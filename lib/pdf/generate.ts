'use server';

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ContractPDF } from './contract';
import { uploadToR2 } from '../r2';
import { db } from '../db';
import { reservations, contracts } from '@/drizzle/schema';
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
      React.createElement(ContractPDF, {
        reservation: reservation as any,
        vehicle: reservation.vehicle as any,
        customer: reservation.customer as any,
        team: reservation.team as any,
        organization: reservation.team.organization as any,
      }) as any
    );

    // Upload to R2
    const path = `contracts/${reservation.teamId}/${reservationId}.pdf`;
    const pdfUrl = await uploadToR2({
      file: Buffer.from(pdfBuffer),
      path,
      contentType: 'application/pdf',
    });

    // Check if contract already exists
    const existingContract = await db.query.contracts.findFirst({
      where: eq(contracts.reservationId, reservationId),
    });

    if (existingContract) {
      // Update existing contract
      await db
        .update(contracts)
        .set({
          pdfUrl,
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, existingContract.id));
    } else {
      // Create new contract record
      await db.insert(contracts).values({
        reservationId,
        pdfUrl,
      });
    }

    return { pdfUrl };
  } catch (error) {
    console.error('[generateContractPDF]', error);
    return { error: 'Failed to generate contract PDF' };
  }
}
