'use client'

import { useQuery } from '@tanstack/react-query'
import { PLAN_PRICING, type PlanType } from '@/lib/pricing-config'

interface PlanUsage {
  plan: PlanType
  limits: typeof PLAN_PRICING.free.limits
  usage: {
    vehicles: { current: number; limit: number | null; percentage: number }
    users: { current: number; limit: number | null; percentage: number }
    reservations: { current: number; limit: number | null; percentage: number }
  }
}

interface PlanFeatures {
  plan: PlanType
  features: typeof PLAN_PRICING.free.features
  limits: typeof PLAN_PRICING.free.limits
}

export function usePlanLimits(teamId: string) {
  return useQuery<PlanUsage>({
    queryKey: ['plan-usage', teamId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/plan-usage`)
      if (!res.ok) throw new Error('Failed to fetch plan usage')
      return res.json()
    },
  })
}

export function usePlanFeatures(teamId: string) {
  return useQuery<PlanFeatures>({
    queryKey: ['plan-features', teamId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/plan-features`)
      if (!res.ok) throw new Error('Failed to fetch plan features')
      return res.json()
    },
  })
}

export function useCanAccessFeature(teamId: string, feature: string) {
  const { data } = usePlanFeatures(teamId)
  return data?.features?.[feature as keyof typeof PLAN_PRICING.free.features] ?? false
}
