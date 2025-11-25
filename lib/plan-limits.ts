import { db } from '@/lib/db'
import { PLAN_PRICING, type PlanType } from './pricing-config'

export class PlanLimitError extends Error {
  constructor(
    message: string,
    public limitType: string,
    public currentPlan: PlanType,
    public suggestedPlan?: PlanType
  ) {
    super(message)
    this.name = 'PlanLimitError'
  }
}

// Helper to get plan type (handle free plan)
function getPlanType(plan: string | null | undefined): PlanType {
  if (!plan) return 'free'
  return plan as PlanType
}

// Vérifier la limite de véhicules
export async function checkVehicleLimit(teamId: string) {
  const team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
    with: {
      vehicles: true,
      members: true,
    }
  })

  if (!team) throw new Error('Team not found')

  const plan = getPlanType(team.plan)
  const limits = PLAN_PRICING[plan].limits

  // Si null = illimité
  if (limits.vehicles === null) return true

  const vehicleCount = team.vehicles.length

  if (vehicleCount >= limits.vehicles) {
    const suggestedPlan = plan === 'free' ? 'starter' :
                          plan === 'starter' ? 'pro' : 'business'

    throw new PlanLimitError(
      `Limite de ${limits.vehicles} véhicules atteinte. Passez au plan ${suggestedPlan.toUpperCase()}.`,
      'vehicles',
      plan,
      suggestedPlan
    )
  }

  return true
}

// Vérifier la limite d'utilisateurs
export async function checkUserLimit(teamId: string) {
  const team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
    with: {
      members: true,
    }
  })

  if (!team) throw new Error('Team not found')

  const plan = getPlanType(team.plan)
  const limits = PLAN_PRICING[plan].limits

  if (limits.users === null) return true

  const userCount = team.members.length

  if (userCount >= limits.users) {
    const suggestedPlan = plan === 'free' ? 'starter' : 'pro'

    throw new PlanLimitError(
      `Limite de ${limits.users} utilisateur(s) atteinte. Passez au plan ${suggestedPlan.toUpperCase()}.`,
      'users',
      plan,
      suggestedPlan
    )
  }

  return true
}

// Vérifier la limite de réservations mensuelles
export async function checkReservationLimit(teamId: string) {
  const team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
  })

  if (!team) throw new Error('Team not found')

  const plan = getPlanType(team.plan)
  const limits = PLAN_PRICING[plan].limits

  if (limits.reservationsPerMonth === null) return true

  // Compter les réservations du mois en cours
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const reservations = await db.query.reservations.findMany({
    where: (reservations, { eq, and, gte }) => and(
      eq(reservations.teamId, teamId),
      gte(reservations.createdAt, startOfMonth)
    )
  })

  const reservationCount = reservations.length

  if (reservationCount >= limits.reservationsPerMonth) {
    throw new PlanLimitError(
      `Limite de ${limits.reservationsPerMonth} réservations/mois atteinte. Passez au plan STARTER.`,
      'reservations',
      plan,
      'starter'
    )
  }

  return true
}

// Vérifier si une feature est disponible
export async function checkFeatureAccess(
  teamId: string,
  feature: keyof typeof PLAN_PRICING.free.features
) {
  const team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
  })

  if (!team) throw new Error('Team not found')

  const plan = getPlanType(team.plan)
  const hasAccess = PLAN_PRICING[plan].features[feature]

  if (!hasAccess) {
    // Trouver le plan minimum qui a cette feature
    const plansWithFeature = (['starter', 'pro', 'business'] as PlanType[])
      .find(p => PLAN_PRICING[p].features[feature])

    throw new PlanLimitError(
      `La fonctionnalité "${feature}" n'est pas disponible sur le plan ${plan.toUpperCase()}. Passez au plan ${plansWithFeature?.toUpperCase() || 'supérieur'}.`,
      feature,
      plan,
      plansWithFeature
    )
  }

  return true
}

// Helper pour récupérer l'usage actuel
export async function getPlanUsage(teamId: string) {
  const team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
    with: {
      vehicles: true,
      members: true,
    }
  })

  if (!team) throw new Error('Team not found')

  const plan = getPlanType(team.plan)
  const limits = PLAN_PRICING[plan].limits

  // Réservations du mois
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const reservations = await db.query.reservations.findMany({
    where: (reservations, { eq, and, gte }) => and(
      eq(reservations.teamId, teamId),
      gte(reservations.createdAt, startOfMonth)
    )
  })

  const reservationsThisMonth = reservations.length

  return {
    plan,
    limits,
    usage: {
      vehicles: {
        current: team.vehicles.length,
        limit: limits.vehicles,
        percentage: limits.vehicles ? (team.vehicles.length / limits.vehicles) * 100 : 0
      },
      users: {
        current: team.members.length,
        limit: limits.users,
        percentage: limits.users ? (team.members.length / limits.users) * 100 : 0
      },
      reservations: {
        current: reservationsThisMonth,
        limit: limits.reservationsPerMonth,
        percentage: limits.reservationsPerMonth ? (reservationsThisMonth / limits.reservationsPerMonth) * 100 : 0
      }
    }
  }
}

// Helper pour récupérer les features
export async function getPlanFeatures(teamId: string) {
  const team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
  })

  if (!team) throw new Error('Team not found')

  const plan = getPlanType(team.plan)

  return {
    plan,
    features: PLAN_PRICING[plan].features,
    limits: PLAN_PRICING[plan].limits,
  }
}
