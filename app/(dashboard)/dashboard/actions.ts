'use server';

import { db } from '@/lib/db';
import { reservations, payments, vehicles } from '@/drizzle/schema';
import { getCurrentTeamId } from '@/lib/session';
import { sql, and, eq, gte, lte, count } from 'drizzle-orm';

export async function getDashboardStats() {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // CA du mois en cours (jusqu'à aujourd'hui)
    const revenueResult = await db
      .select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .innerJoin(reservations, eq(payments.reservationId, reservations.id))
      .where(
        and(
          eq(reservations.teamId, teamId),
          gte(payments.paidAt, startOfMonth),
          lte(payments.paidAt, now),
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
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

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
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }
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

export async function getDashboardTrends() {
  try {
    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    const now = new Date();
    const dayOfMonth = now.getDate();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sameDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, Math.min(dayOfMonth, new Date(now.getFullYear(), now.getMonth(), 0).getDate()));
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Revenue trend - même période (jour du mois) ce mois vs mois dernier
    const currentMonthRevenue = await db
      .select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .innerJoin(reservations, eq(payments.reservationId, reservations.id))
      .where(
        and(
          eq(reservations.teamId, teamId),
          gte(payments.paidAt, startOfCurrentMonth),
          lte(payments.paidAt, now),
          eq(payments.status, 'succeeded')
        )
      );

    const lastMonthRevenue = await db
      .select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .innerJoin(reservations, eq(payments.reservationId, reservations.id))
      .where(
        and(
          eq(reservations.teamId, teamId),
          gte(payments.paidAt, startOfLastMonth),
          lte(payments.paidAt, sameDayLastMonth),
          eq(payments.status, 'succeeded')
        )
      );

    const currentRev = parseFloat(currentMonthRevenue[0]?.total || '0');
    const lastRev = parseFloat(lastMonthRevenue[0]?.total || '0');
    const revenueTrend = lastRev > 0 ? ((currentRev - lastRev) / lastRev) * 100 : 0;

    // Réservations actives - comparaison avec le mois dernier
    const currentMonthReservations = await db
      .select({ count: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.teamId, teamId),
          gte(reservations.createdAt, startOfCurrentMonth),
          sql`${reservations.status} IN ('confirmed', 'in_progress', 'paid')`
        )
      );

    const lastMonthReservations = await db
      .select({ count: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.teamId, teamId),
          gte(reservations.createdAt, startOfLastMonth),
          lte(reservations.createdAt, endOfLastMonth),
          sql`${reservations.status} IN ('confirmed', 'in_progress', 'paid')`
        )
      );

    const currentRes = currentMonthReservations[0]?.count || 0;
    const lastRes = lastMonthReservations[0]?.count || 0;
    const reservationsTrend = lastRes > 0 ? ((currentRes - lastRes) / lastRes) * 100 : 0;

    // Taux de disponibilité des véhicules - ce mois vs mois dernier
    // Calcul : nombre de véhicules disponibles / total véhicules
    const totalVehicles = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.teamId, teamId));

    const total = totalVehicles[0]?.count || 0;

    if (total === 0) {
      return {
        revenueTrend: Math.round(revenueTrend * 10) / 10,
        reservationsTrend: Math.round(reservationsTrend * 10) / 10,
        vehiclesTrend: 0,
        occupancyTrend: 0,
      };
    }

    // Réservations actives ce mois (en cours maintenant)
    const currentActiveReservations = await db
      .select({ count: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.teamId, teamId),
          eq(reservations.status, 'in_progress'),
          lte(reservations.startDate, now),
          gte(reservations.endDate, now)
        )
      );

    // Réservations actives il y a un mois
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, dayOfMonth);
    const lastMonthActiveReservations = await db
      .select({ count: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.teamId, teamId),
          eq(reservations.status, 'in_progress'),
          lte(reservations.startDate, oneMonthAgo),
          gte(reservations.endDate, oneMonthAgo)
        )
      );

    const currentActive = currentActiveReservations[0]?.count || 0;
    const lastActive = lastMonthActiveReservations[0]?.count || 0;

    // Taux d'occupation = (véhicules en cours de location / total véhicules) * 100
    const currentOccupancy = total > 0 ? (currentActive / total) * 100 : 0;
    const lastOccupancy = total > 0 ? (lastActive / total) * 100 : 0;

    // Tendance d'occupation : différence en points de pourcentage
    const occupancyTrend = currentOccupancy - lastOccupancy;

    // Taux de disponibilité = 100 - taux d'occupation
    const currentAvailability = 100 - currentOccupancy;
    const lastAvailability = 100 - lastOccupancy;

    // Tendance de disponibilité : différence en points de pourcentage
    // Note : plus de disponibilité = tendance positive pour le client
    const vehiclesTrend = currentAvailability - lastAvailability;

    return {
      revenueTrend: Math.round(revenueTrend * 10) / 10,
      reservationsTrend: Math.round(reservationsTrend * 10) / 10,
      vehiclesTrend: Math.round(vehiclesTrend * 10) / 10,
      occupancyTrend: Math.round(occupancyTrend * 10) / 10,
    };
  } catch (error) {
    console.error('[getDashboardTrends]', error);
    return {
      revenueTrend: 0,
      reservationsTrend: 0,
      vehiclesTrend: 0,
      occupancyTrend: 0,
    };
  }
}
