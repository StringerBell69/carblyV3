'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createOrganization, createTeam, createStripeCheckoutSession } from './actions';

type Plan = 'starter' | 'pro' | 'business';
type BillingInterval = 'monthly' | 'yearly';

const PLANS = [
  {
    id: 'starter' as Plan,
    name: 'Starter',
    monthlyPrice: 49,
    yearlyPrice: 490, // 10 mois au prix de 12 (2 mois offerts)
    maxVehicles: 5,
    features: [
      '5 véhicules maximum',
      'Réservations illimitées',
      'Lien de paiement',
      'Signature électronique',
      'Support email',
    ],
  },
  {
    id: 'pro' as Plan,
    name: 'Pro',
    monthlyPrice: 99,
    yearlyPrice: 990, // 10 mois au prix de 12 (2 mois offerts)
    maxVehicles: 20,
    features: [
      '20 véhicules maximum',
      'Tout Starter +',
      'Pré-autorisation caution',
      'Vérification identité Stripe',
      'Notifications SMS',
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
      'API accès',
      'Tableau de bord avancé',
      'Support dédié',
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [organizationName, setOrganizationName] = useState('');
  const [organizationId, setOrganizationId] = useState('');

  const [teamName, setTeamName] = useState('');
  const [teamAddress, setTeamAddress] = useState('');
  const [teamId, setTeamId] = useState('');

  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Étape {step} sur 4</span>
            <span className="text-sm text-gray-500">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
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
                  <label htmlFor="orgName" className="text-sm font-medium">
                    Nom de l'organisation
                  </label>
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
                  <label htmlFor="teamName" className="text-sm font-medium">
                    Nom de l'agence
                  </label>
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
                  <label htmlFor="teamAddress" className="text-sm font-medium">
                    Adresse (optionnel)
                  </label>
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
              <button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('yearly')}
                className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  billingInterval === 'yearly'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Annuel
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                  2 mois offerts
                </span>
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
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
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
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

              <div className="space-y-2 text-sm text-gray-600">
                <p>✓ Annulez à tout moment</p>
                <p>✓ 14 jours d'essai gratuit</p>
                <p>✓ Aucun engagement</p>
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
