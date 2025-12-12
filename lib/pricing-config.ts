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
  percentageFee: number  // En pourcentage (ex: 5)
  minFee: number  // Frais minimum en euros pour couvrir les frais Stripe
  maxCap: number | null  // Plafond maximum en euros (null = pas de plafond)
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
    platformFees: { percentageFee: 5, minFee: 2.5, maxCap: null },  // 5%, minimum 2.50€, pas de plafond
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
    subscription: { monthly: 20, yearly: 200 },
    platformFees: { percentageFee: 2, minFee: 2, maxCap: null },  // 2%, minimum 2€, pas de plafond
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
    subscription: { monthly: 49, yearly: 490 },
    platformFees: { percentageFee: 1, minFee: 1.5, maxCap: 15 },  // 1%, minimum 1.50€, max 15€
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
    subscription: { monthly: 100, yearly: 1000 },
    platformFees: { percentageFee: 0.5, minFee: 1, maxCap: 5 },  // 0.5%, minimum 1€, max 5€
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

  // Calculer le pourcentage
  let calculatedFee = (amount * config.percentageFee) / 100

  // Appliquer le minimum
  let isMinimumApplied = false
  if (calculatedFee < config.minFee) {
    calculatedFee = config.minFee
    isMinimumApplied = true
  }

  // Appliquer le plafond si défini
  let isCapped = false
  if (config.maxCap !== null && calculatedFee > config.maxCap) {
    calculatedFee = config.maxCap
    isCapped = true
  }

  const totalFee = Number(calculatedFee.toFixed(2))

  return {
    amount,
    percentageFee: config.percentageFee,
    minFee: config.minFee,
    maxCap: config.maxCap,
    calculatedFee: Number(calculatedFee.toFixed(2)),
    totalFee,
    netAmount: Number((amount - totalFee).toFixed(2)),
    isCapped,
    isMinimumApplied,
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
