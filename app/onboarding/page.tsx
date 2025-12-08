'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Building2, Users, CreditCard, Check, Loader2, Info, LogOut } from 'lucide-react';
import { createOrganization, createTeam, createStripeCheckoutSession, checkExistingTeam, updateTeamPlan } from './actions';
import { createTeamConnectAccount, getConnectOnboardingLink } from './connect-actions';
import { signOut } from '@/lib/auth-client';

type Plan = 'free' | 'starter' | 'pro' | 'business';
type BillingInterval = 'monthly' | 'yearly';

const PLANS = [
  {
    id: 'free' as Plan,
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxVehicles: 3,
    features: [
      '3 véhicules maximum',
      '10 réservations/mois',
      'Paiements Stripe Connect',
      'Frais: 5%',
      'Contrats PDF',
      'Support communauté',
    ],
  },
  {
    id: 'starter' as Plan,
    name: 'Starter',
    monthlyPrice: 49,
    yearlyPrice: 490, // 10 mois au prix de 12 (2 mois offerts)
    maxVehicles: 10,
    features: [
      '10 véhicules maximum',
      'Réservations illimitées',
      'Acomptes configurables',
      'Signature électronique (très prochainement)',
      'Frais: 2%',
      'Support email',
    ],
  },
  {
    id: 'pro' as Plan,
    name: 'Pro',
    monthlyPrice: 99,
    yearlyPrice: 990, // 10 mois au prix de 12 (2 mois offerts)
    maxVehicles: 25,
    features: [
      '25 véhicules maximum',
      'Tout Starter +',
      'Pré-autorisation caution',
      'Vérification identité (prochainement)',
      'Notifications SMS',
      'Frais: 1% (max 15€)',
      'Support prioritaire',
    ],
    popular: true,
  },
  {
    id: 'business' as Plan,
    name: 'Business',
    monthlyPrice: 199,
    yearlyPrice: 1990, // 10 mois au prix de 12 (2 mois offerts)
    maxVehicles: 100,
    features: [
      '100 véhicules maximum',
      'Tout Pro +',
      'Multi-agences',
      // 'API accès',
      // 'Tableau de bord avancé',
      'Frais: 0.5% (max 5€)',
      'Support dédié',
    ],
  },
];

function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [existingTeamStatus, setExistingTeamStatus] = useState<any>(null);

  const [organizationName, setOrganizationName] = useState('');
  const [organizationId, setOrganizationId] = useState('');

  const [teamName, setTeamName] = useState('');
  const [teamAddress, setTeamAddress] = useState('');
  const [teamId, setTeamId] = useState('');

  const [selectedPlan, setSelectedPlan] = useState<Plan>('free');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  // Check if user already has a team
  useEffect(() => {
    checkForExistingTeam();
  }, []);

  // Handle URL parameters (e.g., ?step=payment when returning from Stripe)
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'payment' && existingTeamStatus) {
      // Force display of payment step (step 3)
      setStep(3);
    }
  }, [searchParams, existingTeamStatus]);

  // Sync state with existing team and restore progress
  useEffect(() => {
    if (existingTeamStatus) {
      setOrganizationId(existingTeamStatus.organizationId);
      setTeamId(existingTeamStatus.id);
      setOrganizationName(existingTeamStatus.organization?.name || '');
      setTeamName(existingTeamStatus.name || '');
      setTeamAddress(existingTeamStatus.address || '');
      
      // Pre-select the plan they chose
      if (['free', 'starter', 'pro', 'business'].includes(existingTeamStatus.plan)) {
        setSelectedPlan(existingTeamStatus.plan as Plan);
      }
      
      // Determine which step to resume from
      const isFree = existingTeamStatus.plan === 'free';
      const hasActiveSubscription = existingTeamStatus.stripeSubscriptionId && existingTeamStatus.subscriptionStatus === 'active';
      const needsPayment = !isFree && !hasActiveSubscription;
      
      // Resume at the correct step:
      // - If paid plan but no subscription: go to step 3 (payment)
      // - Otherwise stay at step 1 (will redirect to dashboard or connect if needed)
      if (needsPayment) {
        setStep(3);
      }
    }
  }, [existingTeamStatus]);

  // Redirect to dashboard only if everything is complete
  // Never redirect to connect-refresh from here - always show plan selection
  useEffect(() => {
    const stepParam = searchParams.get('step');
    
    if (existingTeamStatus && !loading) {
      const isFree = existingTeamStatus.plan === 'free';
      const hasActiveSubscription = existingTeamStatus.stripeSubscriptionId && existingTeamStatus.subscriptionStatus === 'active';
      const needsPayment = !isFree && !hasActiveSubscription;
      const needsConnect = !existingTeamStatus.stripeConnectOnboarded;

      // Only redirect to dashboard if EVERYTHING is complete
      if (!needsPayment && !needsConnect) {
        router.push('/dashboard');
      }
      // Otherwise, stay on this page and show step 3 (plan selection)
      // The user can choose a plan and complete the flow
    }
  }, [existingTeamStatus, loading, router, searchParams]);

  const checkForExistingTeam = async () => {
    try {
      const result = await checkExistingTeam();
      if (result.team) {
        setExistingTeamStatus(result.team);
      }
    } catch (err) {
      console.error('Error checking existing team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createOrganization(organizationName);

      if (result.error) {
        throw new Error(result.error);
      }

      setOrganizationId(result.organization!.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // If team already exists (user came back from payment), update the plan
      if (teamId) {
        const result = await updateTeamPlan({
          teamId,
          plan: selectedPlan,
        });

        if (result.error) {
          throw new Error(result.error);
        }
      } else {
        // Create new team
        const result = await createTeam({
          organizationId,
          name: teamName,
          address: teamAddress,
          plan: selectedPlan,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setTeamId(result.team!.id);
      }

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = () => {
    setStep(4);
  };

  const handleStep4 = async () => {
    setLoading(true);
    setError('');

    try {
      // If FREE plan, create Connect account and redirect to onboarding
      if (selectedPlan === 'free') {
        // Create Connect account
        const connectResult = await createTeamConnectAccount({
          teamId,
        });

        if (connectResult.error) {
          throw new Error(connectResult.error);
        }

        // Get onboarding link
        const linkResult = await getConnectOnboardingLink(teamId);

        if (linkResult.error || !linkResult.url) {
          throw new Error(linkResult.error || 'Failed to get onboarding link');
        }

        // Redirect to Connect onboarding
        window.location.href = linkResult.url;
        return;
      }

      const result = await createStripeCheckoutSession({
        organizationId,
        teamId,
        plan: selectedPlan,
        billingInterval,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      setLoading(false);
    }
  };

  // Show loading while checking for existing team
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <p className="text-gray-600">Vérification de votre compte...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show existing team status if found AND payment is complete
  // If payment is needed, fall through to show the stepper
  if (existingTeamStatus) {
    const isFree = existingTeamStatus.plan === 'free';
    const needsPayment = !isFree && (!existingTeamStatus.stripeSubscriptionId || existingTeamStatus.subscriptionStatus !== 'active');
    const needsConnect = !existingTeamStatus.stripeConnectOnboarded;

    // If free plan and needs Connect, show plan selection instead
    // This allows users to upgrade or confirm their choice before Connect setup
    if (isFree && needsConnect) {
      // Fall through to stepper - will show plan selection (step 3)
    } else if (!needsPayment && needsConnect) {
      // Paid plan with active subscription but needs Connect
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Finalisation de votre compte</CardTitle>
                <CardDescription>
                  Votre équipe existe déjà. Complétez les étapes restantes pour accéder au tableau de bord.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Organisation créée</p>
                      <p className="text-sm text-green-700">{existingTeamStatus.organization?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Agence créée</p>
                      <p className="text-sm text-green-700">{existingTeamStatus.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Abonnement actif</p>
                      <p className="text-sm text-green-700">Plan {existingTeamStatus.plan}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900">Configuration Stripe Connect requise</p>
                      <p className="text-sm text-yellow-700">Pour recevoir les paiements de vos clients</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/onboarding/connect-refresh')}
                    className="w-full"
                  >
                    Configurer les paiements
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Logout button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                await signOut();
                router.push('/login');
              }
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
        
        {/* Visual Stepper */}
        <div className="mb-6 sm:mb-12">
          <div className="flex items-center justify-between mb-8">
            {[
              { num: 1, label: 'Organisation', icon: Building2 },
              { num: 2, label: 'Agence', icon: Users },
              { num: 3, label: 'Plan', icon: CreditCard },
              { num: 4, label: 'Paiement', icon: Check },
            ].map((s, idx, arr) => {
              const StepIcon = s.icon;
              const isCompleted = step > s.num;
              const isActive = step === s.num;

              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-400 border-2 border-gray-200'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium text-center ${
                        isActive
                          ? 'text-primary'
                          : isCompleted
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress percentage */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Étape {step} sur 4</span>
            <span className="text-gray-500">{Math.round((step / 4) * 100)}%</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Organization */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Créer votre organisation</CardTitle>
              <CardDescription>
                Donnez un nom à votre entreprise de location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">
                    Nom de l'organisation
                  </Label>
                  <Input
                    id="orgName"
                    type="text"
                    placeholder="Ex: Location Auto Pro"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    C'est le nom qui apparaîtra sur vos factures
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Création...' : 'Continuer'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Team */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Créer votre première agence</CardTitle>
              <CardDescription>
                Configurez votre agence de location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">
                    Nom de l'agence
                  </Label>
                  <Input
                    id="teamName"
                    type="text"
                    placeholder="Ex: Agence Paris Centre"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamAddress">
                    Adresse (optionnel)
                  </Label>
                  <Input
                    id="teamAddress"
                    type="text"
                    placeholder="Ex: 123 Rue de la Location, 75001 Paris"
                    value={teamAddress}
                    onChange={(e) => setTeamAddress(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Retour
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Création...' : 'Continuer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Plan Selection */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Choisissez votre plan</h2>
              <p className="text-gray-600">
                Sélectionnez le plan adapté à la taille de votre flotte
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                variant={billingInterval === 'monthly' ? 'default' : 'secondary'}
                className="px-6"
              >
                Mensuel
              </Button>
              <Button
                type="button"
                onClick={() => setBillingInterval('yearly')}
                variant={billingInterval === 'yearly' ? 'default' : 'secondary'}
                className="px-6 flex items-center gap-2"
              >
                Annuel
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                  2 mois offerts
                </span>
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
              {PLANS.map((plan) => {
                const price = billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                const savings = billingInterval === 'yearly' ? (plan.monthlyPrice * 12 - plan.yearlyPrice) : 0;

                return (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'ring-2 ring-primary'
                        : 'hover:shadow-lg'
                    } ${plan.popular ? 'md:scale-105' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <CardHeader>
                      {plan.popular && (
                        <div className="text-xs font-semibold text-primary mb-2">
                          ⭐ POPULAIRE
                        </div>
                      )}
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold">
                          {price}€
                          <span className="text-base font-normal text-gray-500">
                            {billingInterval === 'monthly' ? '/mois' : '/an'}
                          </span>
                        </div>
                        {billingInterval === 'yearly' && (
                          <div className="text-sm text-green-600 font-medium">
                            Économisez {savings}€/an
                          </div>
                        )}
                        {billingInterval === 'monthly' && (
                          <div className="text-xs text-gray-500">
                            ou {plan.yearlyPrice}€/an
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => {
                          const isFeeFeature = feature.startsWith('Frais:');
                          const feeInfo = {
                            free: { percentage: 5, min: 1 },
                            starter: { percentage: 2, min: 1 },
                            pro: { percentage: 1, min: 1, max: 15 },
                            business: { percentage: 0.5, min: 0.5, max: 5 },
                          }[plan.id];

                          return (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-green-500">✓</span>
                              {isFeeFeature && feeInfo ? (
                                <div className="flex items-center gap-1">
                                  <span>{feature}</span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="text-xs font-semibold mb-1">
                                          Comment sont calculés les frais ?
                                        </p>
                                        <p className="text-xs">
                                          {feeInfo.percentage}% du montant de la transaction, avec un minimum de {feeInfo.min}€
                                          {feeInfo.max ? ` et un plafond de ${feeInfo.max}€` : ''}.
                                        </p>
                                        <p className="text-xs mt-1 text-muted-foreground">
                                          Ex: location 100€ → frais {Math.max(100 * feeInfo.percentage / 100, feeInfo.min)}€
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              ) : (
                                <span>{feature}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={loading}
              >
                Retour
              </Button>
              <Button onClick={handleStep3} disabled={loading} className="flex-1">
                Continuer avec {PLANS.find(p => p.id === selectedPlan)?.name}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Configurer le paiement</CardTitle>
              <CardDescription>
                Dernière étape avant de commencer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Plan sélectionné:</span>
                  <span className="font-bold">
                    {PLANS.find(p => p.id === selectedPlan)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">
                    {billingInterval === 'monthly' ? 'Prix mensuel:' : 'Prix annuel:'}
                  </span>
                  <span className="font-bold">
                    {billingInterval === 'monthly'
                      ? `${PLANS.find(p => p.id === selectedPlan)?.monthlyPrice}€/mois`
                      : `${PLANS.find(p => p.id === selectedPlan)?.yearlyPrice}€/an`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Facturation:</span>
                  <span>{billingInterval === 'monthly' ? 'Mensuelle' : 'Annuelle'}</span>
                </div>
                {billingInterval === 'yearly' && (
                  <div className="flex justify-between text-sm text-green-600 font-medium border-t pt-2">
                    <span>Économie:</span>
                    <span>
                      {(() => {
                        const plan = PLANS.find(p => p.id === selectedPlan);
                        return plan ? (plan.monthlyPrice * 12 - plan.yearlyPrice) : 0;
                      })()}€ (2 mois offerts)
                    </span>
                  </div>
                )}
              </div>

             

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(3)}
                  disabled={loading}
                >
                  Retour
                </Button>
                <Button
                  onClick={handleStep4}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Redirection...' : 'Procéder au paiement'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Wrapper with Suspense to handle useSearchParams
export default function OnboardingPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <p className="text-gray-600">Chargement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <OnboardingPage />
    </Suspense>
  );
}
