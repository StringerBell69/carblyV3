'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Sparkles, ArrowLeft } from 'lucide-react';
import { changePlan } from '../actions';
import Link from 'next/link';

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
    yearlyPrice: 490,
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
    yearlyPrice: 990,
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
    yearlyPrice: 1990,
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

interface ChangePlanClientProps {
  currentPlan: Plan;
}

export function ChangePlanClient({ currentPlan }: ChangePlanClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const handleChangePlan = async (newPlan: Plan) => {
    if (newPlan === currentPlan) {
      router.push('/settings?tab=billing');
      return;
    }

    setLoading(true);

    try {
      const result = await changePlan({
        newPlan,
        billingInterval,
      });

      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        // Plan changed successfully (free plan)
        router.push('/settings?tab=billing&plan_changed=true');
      }
    } catch (error) {
      alert('Erreur lors du changement de plan');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings?tab=billing">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Changer de plan</h1>
          <p className="text-muted-foreground mt-1">
            Sélectionnez le plan adapté à la taille de votre flotte
          </p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          onClick={() => setBillingInterval('monthly')}
          variant={billingInterval === 'monthly' ? 'default' : 'secondary'}
        >
          Mensuel
        </Button>
        <Button
          type="button"
          onClick={() => setBillingInterval('yearly')}
          variant={billingInterval === 'yearly' ? 'default' : 'secondary'}
          className="flex items-center gap-2"
        >
          Annuel
          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
            2 mois offerts
          </span>
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const price = billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const savings = billingInterval === 'yearly' ? (plan.monthlyPrice * 12 - plan.yearlyPrice) : 0;
          const isCurrentPlan = plan.id === currentPlan;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                isCurrentPlan ? 'ring-2 ring-primary' : ''
              } ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Populaire
                  </Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary">Plan actuel</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-4xl font-bold">
                    {price}€
                    <span className="text-lg font-normal text-gray-500">
                      {billingInterval === 'monthly' ? '/mois' : '/an'}
                    </span>
                  </div>
                  {billingInterval === 'yearly' && savings > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      Économisez {savings}€/an
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleChangePlan(plan.id)}
                  disabled={loading || isCurrentPlan}
                  className="w-full"
                  variant={isCurrentPlan ? 'secondary' : 'default'}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : isCurrentPlan ? (
                    'Plan actuel'
                  ) : (
                    'Choisir ce plan'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
