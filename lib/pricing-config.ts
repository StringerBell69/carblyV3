export type PlanType = 'free' | 'starter' | 'pro' | 'business'

export interface PlanFeatures {
  stripeConnect: boolean
  deposits: boolean
  cautionOnline: boolean
  insurance: boolean
  contracts: boolean
  signature: boolean
  checkinCheckout: boolean
  sms: boolean
  identityVerification: boolean
  loyaltyProgram: boolean
  multiAgency: boolean
  api: boolean
  advancedAnalytics: boolean
  customReports?: boolean
  sso?: boolean
  whiteLabel?: boolean
  support: 'community' | 'email' | 'priority' | 'dedicated'
}

export interface PlanLimits {
  vehicles: number | null  // null = illimité
  users: number | null
  reservationsPerMonth: number | null
  emailTemplates: number | null
}

export interface PlatformFees {
  percentageFee: number  // En pourcentage (ex: 4.9)
  fixedFee: number       // En euros (ex: 0.50)
}

export interface PlanConfig {
  subscription: {
    monthly: number
    yearly: number
  }
  platformFees: PlatformFees
  limits: PlanLimits
  features: PlanFeatures
  stripePriceIds: {
    monthly: string
    yearly: string
  }
}

export const PLAN_PRICING: Record<PlanType, PlanConfig> = {
  free: {
    subscription: { monthly: 0, yearly: 0 },
    platformFees: { percentageFee: 4.9, fixedFee: 0.50 },
    limits: {
      vehicles: 3,
      users: 1,
      reservationsPerMonth: 10,
      emailTemplates: 1,
    },
    features: {
      stripeConnect: true,
      deposits: false,
      cautionOnline: false,
      insurance: false,  // Désactivé pour tous
      contracts: false,
      signature: false,
      checkinCheckout: false,
      sms: false,
      identityVerification: false,
      loyaltyProgram: false,
      multiAgency: false,
      api: false,
      advancedAnalytics: false,
      support: 'community',
    },
    stripePriceIds: { monthly: '', yearly: '' },
  },
  starter: {
    subscription: { monthly: 49, yearly: 490 },
    platformFees: { percentageFee: 2.9, fixedFee: 0.50 },
    limits: {
      vehicles: 10,
      users: 3,
      reservationsPerMonth: null,
      emailTemplates: null,
    },
    features: {
      stripeConnect: true,
      deposits: true,
      cautionOnline: false,
      insurance: false,  // Désactivé pour tous
      contracts: true,
      signature: true,
      checkinCheckout: true,
      sms: false,
      identityVerification: false,
      loyaltyProgram: false,
      multiAgency: false,
      api: false,
      advancedAnalytics: false,
      support: 'email',
    },
    stripePriceIds: {
      monthly: 'price_starter_monthly',
      yearly: 'price_starter_yearly',
    },
  },
  pro: {
    subscription: { monthly: 99, yearly: 990 },
    platformFees: { percentageFee: 1.9, fixedFee: 0.30 },
    limits: {
      vehicles: 25,
      users: 10,
      reservationsPerMonth: null,
      emailTemplates: null,
    },
    features: {
      stripeConnect: true,
      deposits: true,
      cautionOnline: true,
      insurance: false,  // Désactivé pour tous
      contracts: true,
      signature: true,
      checkinCheckout: true,
      sms: true,
      identityVerification: true,
      loyaltyProgram: true,
      multiAgency: false,
      api: false,
      advancedAnalytics: true,
      support: 'priority',
    },
    stripePriceIds: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly',
    },
  },
  business: {
    subscription: { monthly: 199, yearly: 1990 },
    platformFees: { percentageFee: 0.9, fixedFee: 0.30 },
    limits: {
      vehicles: null,
      users: null,
      reservationsPerMonth: null,
      emailTemplates: null,
    },
    features: {
      stripeConnect: true,
      deposits: true,
      cautionOnline: true,
      insurance: false,  // Désactivé pour tous
      contracts: true,
      signature: true,
      checkinCheckout: true,
      sms: true,
      identityVerification: true,
      loyaltyProgram: true,
      multiAgency: true,
      api: true,
      advancedAnalytics: true,
      customReports: true,
      sso: true,
      whiteLabel: true,
      support: 'dedicated',
    },
    stripePriceIds: {
      monthly: 'price_business_monthly',
      yearly: 'price_business_yearly',
    },
  },
}

// Fonction de calcul des frais
export function calculatePlatformFees(
  amount: number,
  plan: PlanType
) {
  const config = PLAN_PRICING[plan].platformFees

  const percentageFee = (amount * config.percentageFee) / 100
  const totalFee = percentageFee + config.fixedFee

  return {
    amount,
    percentageFee: Number(percentageFee.toFixed(2)),
    fixedFee: config.fixedFee,
    totalFee: Number(totalFee.toFixed(2)),
    netAmount: Number((amount - totalFee).toFixed(2)),
  }
}

// Helper pour vérifier si une feature est disponible
export function hasFeature(plan: PlanType, feature: keyof PlanFeatures): boolean {
  return PLAN_PRICING[plan].features[feature] as boolean
}

// Helper pour récupérer les limites
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_PRICING[plan].limits
}
