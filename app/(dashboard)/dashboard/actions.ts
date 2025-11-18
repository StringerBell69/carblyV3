'use server';

import { db } from '@/lib/db';
import { reservations, payments, vehicles } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { sql, and, eq, gte, lte, count } from 'drizzle-orm';

export async function getDashboardStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.currentTeamId) {
      return { error: 'Unauthorized' };
    }

    const teamId = session.user.currentTeamId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // CA du mois
    const revenueResult = await db
      .select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .innerJoin(reservations, eq(payments.reservationId, reservations.id))
      .where(
        and(
          eq(reservations.teamId, teamId),
          gte(payments.paidAt, startOfMonth),
          lte(payments.paidAt, endOfMonth),
          eq(payments.status, 'succeeded')
        )
      );

    const revenue = parseFloat(revenueResult[0]?.total || '0');

    // Réservations en cours
    const activeReservationsResult = await db
      .select({ count: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.teamId, teamId),
          eq(reservations.status, 'in_progress')
        )
      );

    const activeReservations = activeReservationsResult[0]?.count || 0;

    // Véhicules disponibles
    const availableVehiclesResult = await db
      .select({ count: count() })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.teamId, teamId),
          eq(vehicles.status, 'available')
        )
      );

    const availableVehicles = availableVehiclesResult[0]?.count || 0;

    // Total véhicules
    const totalVehiclesResult = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.teamId, teamId));

    const totalVehicles = totalVehiclesResult[0]?.count || 0;

    // Taux d'occupation
    const occupancyRate = totalVehicles > 0
      ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100)
      : 0;

    // Réservations à venir (confirmées et payées)
    const upcomingReservationsResult = await db
      .select({ count: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.teamId, teamId),
          sql`${reservations.status} IN ('paid', 'confirmed')`,
          gte(reservations.startDate, now)
        )
      );

    const upcomingReservations = upcomingReservationsResult[0]?.count || 0;

    return {
      revenue,
      activeReservations,
      availableVehicles,
      totalVehicles,
      occupancyRate,
      upcomingReservations,
    };
  } catch (error) {
    console.error('[getDashboardStats]', error);
    return { error: 'Failed to fetch dashboard stats' };
  }
}

export async function getRecentReservations() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.currentTeamId) {
      return { error: 'Unauthorized' };
    }

    const teamId = session.user.currentTeamId;

    const recentReservations = await db.query.reservations.findMany({
      where: eq(reservations.teamId, teamId),
      orderBy: (reservations, { desc }) => [desc(reservations.createdAt)],
      limit: 5,
      with: {
        vehicle: true,
        customer: true,
      },
    });

    return { reservations: recentReservations };
  } catch (error) {
    console.error('[getRecentReservations]', error);
    return { error: 'Failed to fetch recent reservations' };
  }
}

export async function getMonthlyRevenue() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.currentTeamId) {
      return { error: 'Unauthorized' };
    }

    const teamId = session.user.currentTeamId;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Get revenue by month for the last 6 months
    const monthlyData = await db
      .select({
        month: sql<string>`TO_CHAR(${payments.paidAt}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .innerJoin(reservations, eq(payments.reservationId, reservations.id))
      .where(
        and(
          eq(reservations.teamId, teamId),
          gte(payments.paidAt, sixMonthsAgo),
          eq(payments.status, 'succeeded')
        )
      )
      .groupBy(sql`TO_CHAR(${payments.paidAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${payments.paidAt}, 'YYYY-MM')`);

    const data = monthlyData.map((item) => ({
      month: item.month,
      revenue: parseFloat(item.total),
    }));

    return { data };
  } catch (error) {
    console.error('[getMonthlyRevenue]', error);
    return { error: 'Failed to fetch monthly revenue' };
  }
}
