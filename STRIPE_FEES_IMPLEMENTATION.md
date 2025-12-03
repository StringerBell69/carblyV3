# Implémentation des frais Stripe sur le loueur

## Problème résolu

Avant cette modification, **Carbly absorbait les frais de traitement Stripe** (environ 1,4% + 0,25€ par transaction), ce qui n'était pas soutenable économiquement.

## Solution implémentée

Les frais Stripe sont maintenant **déduits automatiquement du montant transféré au loueur** (propriétaire du véhicule).

### ⚠️ IMPORTANT : Test avec nouvelle réservation

Les changements de paiement nécessitent de **créer de nouvelles réservations** pour tester. Les anciennes réservations utilisent l'ancien système et ne fonctionneront plus correctement.

### Changements techniques

#### 1. Paiement initial / acompte ([lib/stripe.ts:264-302](lib/stripe.ts#L264-L302))

**AVANT :**
```typescript
transfer_data: {
  destination: connectedAccountId,
  amount: amountInCents, // Carbly absorbe les frais Stripe
}
```

**APRÈS :**
```typescript
// Le paiement est créé sur le compte Connect
{
  payment_intent_data: {
    application_fee_amount: platformFeeInCents, // Carbly prend seulement sa commission
  }
},
{
  stripeAccount: connectedAccountId, // Les frais Stripe sont déduits du loueur
}
```

#### 2. Paiement du solde ([app/api/reservations/public/[token]/balance/checkout/route.ts:96-151](app/api/reservations/public/[token]/balance/checkout/route.ts#L96-L151))

Même modification appliquée pour le paiement du solde.

## Flux de paiement

### Exemple avec une location de 100€ (plan Free - 5%)

| Composante | Montant |
|-----------|---------|
| **Client paie** | 100€ + 5€ = **105€** |
| **Frais Stripe** | ~1,73€ (1,4% + 0,25€) |
| **Commission Carbly** | 5€ |
| **Loueur reçoit** | 105€ - 1,73€ - 5€ = **98,27€** |

### Répartition des coûts

- **Client** : Paie le prix de location + commission Carbly
- **Carbly** : Reçoit uniquement sa commission (5%)
- **Loueur** : Reçoit le montant après déduction des frais Stripe ET de la commission Carbly
- **Stripe** : Prélève ses frais sur le compte du loueur

## Avantages

1. **Carbly ne subit plus les frais Stripe** - Modèle économique viable
2. **Transparent pour le client** - Le prix affiché inclut tous les frais
3. **Standard de l'industrie** - C'est le modèle utilisé par Airbnb, Uber, etc.
4. **Automatique** - Stripe gère tout via `application_fee_amount`

## Tests à effectuer

- [ ] Créer une réservation test avec paiement complet
- [ ] Créer une réservation test avec acompte + solde
- [ ] Vérifier les montants dans le dashboard Stripe du compte platform
- [ ] Vérifier les montants dans le dashboard Stripe du compte Connect
- [ ] Confirmer que le loueur reçoit bien le montant après déduction des frais Stripe
