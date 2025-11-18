'use server';

import { db } from '@/lib/db';
import { vehicles } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getVehicles(filters?: {
  status?: string;
  brand?: string;
  search?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.currentTeamId) {
      return { error: 'Unauthorized' };
    }

    const teamId = session.user.currentTeamId;

    let query = db.query.vehicles.findMany({
      where: and(
        eq(vehicles.teamId, teamId),
        filters?.status ? eq(vehicles.status, filters.status as any) : undefined,
        filters?.brand ? eq(vehicles.brand, filters.brand) : undefined,
        filters?.search
          ? sql`LOWER(${vehicles.brand} || ' ' || ${vehicles.model} || ' ' || ${vehicles.plate}) LIKE ${`%${filters.search.toLowerCase()}%`}`
          : undefined
      ),
      orderBy: (vehicles, { desc }) => [desc(vehicles.createdAt)],
    });

    const vehiclesList = await query;

    return { vehicles: vehiclesList };
  } catch (error) {
    console.error('[getVehicles]', error);
    return { error: 'Failed to fetch vehicles' };
  }
}

export async function getVehicle(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.currentTeamId) {
      return { error: 'Unauthorized' };
    }

    const vehicle = await db.query.vehicles.findFirst({
      where: and(
        eq(vehicles.id, id),
        eq(vehicles.teamId, session.user.currentTeamId)
      ),
    });

    if (!vehicle) {
      return { error: 'Vehicle not found' };
    }

    return { vehicle };
  } catch (error) {
    console.error('[getVehicle]', error);
    return { error: 'Failed to fetch vehicle' };
  }
}

export async function createVehicle(data: {
  brand: string;
  model: string;
  year?: number;
  plate: string;
  vin?: string;
  dailyRate: string;
  depositAmount?: string;
  fuelType?: string;
  transmission?: string;
  seats?: number;
  mileage?: number;
  images?: string[];
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.currentTeamId) {
      return { error: 'Unauthorized' };
    }

    const teamId = session.user.currentTeamId;

    // Check vehicle limit
    const team = await db.query.teams.findFirst({
      where: (teams, { eq }) => eq(teams.id, teamId),
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    const vehicleCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(vehicles)
      .where(eq(vehicles.teamId, teamId));

    if (Number(vehicleCount[0]?.count || 0) >= team.maxVehicles) {
      return { error: `Limite de véhicules atteinte (${team.maxVehicles} max)` };
    }

    // Create vehicle
    const [vehicle] = await db
      .insert(vehicles)
      .values({
        teamId,
        brand: data.brand,
        model: data.model,
        year: data.year,
        plate: data.plate,
        vin: data.vin,
        dailyRate: data.dailyRate,
        depositAmount: data.depositAmount,
        fuelType: data.fuelType,
        transmission: data.transmission,
        seats: data.seats,
        mileage: data.mileage,
        images: data.images || [],
        status: 'available',
      })
      .returning();

    revalidatePath('/vehicles');

    return { vehicle };
  } catch (error) {
    console.error('[createVehicle]', error);
    if (error instanceof Error && error.message.includes('unique')) {
      return { error: 'Cette plaque d\'immatriculation existe déjà' };
    }
    return { error: 'Failed to create vehicle' };
  }
}

export async function updateVehicle(
  id: string,
  data: {
    brand?: string;
    model?: string;
    year?: number;
    plate?: string;
    vin?: string;
    status?: 'available' | 'rented' | 'maintenance' | 'out_of_service';
    dailyRate?: string;
    depositAmount?: string;
    fuelType?: string;
    transmission?: string;
    seats?: number;
    mileage?: number;
    images?: string[];
  }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.currentTeamId) {
      return { error: 'Unauthorized' };
    }

    const [vehicle] = await db
      .update(vehicles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(vehicles.id, id),
          eq(vehicles.teamId, session.user.currentTeamId)
        )
      )
      .returning();

    if (!vehicle) {
      return { error: 'Vehicle not found' };
    }

    revalidatePath('/vehicles');
    revalidatePath(`/vehicles/${id}`);

    return { vehicle };
  } catch (error) {
    console.error('[updateVehicle]', error);
    if (error instanceof Error && error.message.includes('unique')) {
      return { error: 'Cette plaque d\'immatriculation existe déjà' };
    }
    return { error: 'Failed to update vehicle' };
  }
}

export async function deleteVehicle(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.currentTeamId) {
      return { error: 'Unauthorized' };
    }

    await db
      .delete(vehicles)
      .where(
        and(
          eq(vehicles.id, id),
          eq(vehicles.teamId, session.user.currentTeamId)
        )
      );

    revalidatePath('/vehicles');

    return { success: true };
  } catch (error) {
    console.error('[deleteVehicle]', error);
    if (error instanceof Error && error.message.includes('foreign key')) {
      return { error: 'Impossible de supprimer ce véhicule car il a des réservations associées' };
    }
    return { error: 'Failed to delete vehicle' };
  }
}

export async function getPresignedUrl(data: {
  fileName: string;
  fileType: string;
  vehicleId?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.currentTeamId) {
      return { error: 'Unauthorized' };
    }

    const { uploadToR2, getPresignedUploadUrl } = await import('@/lib/r2');

    // Generate a unique file path
    const timestamp = Date.now();
    const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `vehicles/${session.user.currentTeamId}/${data.vehicleId || 'temp'}/${timestamp}-${sanitizedFileName}`;

    const url = await getPresignedUploadUrl({
      path,
      contentType: data.fileType,
    });

    return {
      uploadUrl: url,
      finalUrl: `${process.env.R2_PUBLIC_URL}/${path}`,
    };
  } catch (error) {
    console.error('[getPresignedUrl]', error);
    return { error: 'Failed to generate upload URL' };
  }
}
