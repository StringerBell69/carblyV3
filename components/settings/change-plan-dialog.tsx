'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Sparkles } from 'lucide-react';
import { changePlan } from '@/app/(dashboard)/settings/actions';

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
    monthlyPrice: 20,
    yearlyPrice: 200,
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
    monthlyPrice: 49,
    yearlyPrice: 490,
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
    monthlyPrice: 100,
    yearlyPrice: 1000,
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

interface ChangePlanDialogProps {
  currentPlan: Plan;
}

export function ChangePlanDialog({ currentPlan }: ChangePlanDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const handleChangePlan = async (newPlan: Plan) => {
    if (newPlan === currentPlan) {
      setOpen(false);
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
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      alert('Erreur lors du changement de plan');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Changer de plan</Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choisissez votre nouveau plan</DialogTitle>
          <DialogDescription>
            Sélectionnez le plan adapté à la taille de votre flotte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              onClick={() => setBillingInterval('monthly')}
              variant={billingInterval === 'monthly' ? 'default' : 'secondary'}
              size="sm"
            >
              Mensuel
            </Button>
            <Button
              type="button"
              onClick={() => setBillingInterval('yearly')}
              variant={billingInterval === 'yearly' ? 'default' : 'secondary'}
              size="sm"
              className="flex items-center gap-2"
            >
              Annuel
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                2 mois offerts
              </span>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const price = billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
              const savings = billingInterval === 'yearly' ? (plan.monthlyPrice * 12 - plan.yearlyPrice) : 0;
              const isCurrentPlan = plan.id === currentPlan;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    isCurrentPlan ? 'ring-2 ring-primary' : ''
                  } ${plan.popular ? 'border-primary' : ''}`}
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
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold">
                        {price}€
                        <span className="text-base font-normal text-gray-500">
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
                  <CardContent>
                    <ul className="space-y-2 mb-4">
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
      </DialogContent>
    </Dialog>
  );
}
