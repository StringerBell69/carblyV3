# Flux de Paiement Stripe Connect - Carbly

## Comment fonctionne le système ACTUEL (CORRIGÉ)

### Stripe Connect avec `transfer_data.amount` (sans `application_fee_amount`)

Quand un client paie pour une réservation, voici comment l'argent circule :

#### Exemple : Réservation de 70€ avec frais Carbly de 3.95€

**Checkout affiché au client :**
- Location de véhicule : 70.00€
- Frais Carbly : 3.95€
- **Total à payer : 73.95€**

**Configuration Stripe (NOUVELLE - CORRECTE) :**
```typescript
stripe.checkout.sessions.create({
  line_items: [
    { amount: 7000 }, // 70€ en centimes
    { amount: 395 },  // 3.95€ en centimes
  ],
  payment_intent_data: {
    transfer_data: {
      destination: connectedAccountId,
      amount: 7000, // Transfère UNIQUEMENT 70€ au compte Connect
    }
  }
})
```

**Résultat du transfert :**
1. Client paie **73.95€** à Stripe
2. Stripe transfère **70.00€** → au **compte Connect de l'agence** ✅
3. Reste sur le compte principal : **3.95€** (frais Carbly) ✅
4. Frais Stripe (~2.64€) sont déduits du compte principal Carbly

**Avantage de cette approche :**
- L'argent arrive d'abord sur votre compte principal
- Vous gardez le contrôle total des frais
- Votre solde ne peut jamais être négatif

## Fichiers concernés

### 1. Paiement initial (acompte ou total)
- **Fichier :** `lib/stripe.ts` → `createReservationCheckoutSession()`
- **Ligne 263 :** `application_fee_amount: platformFeeInCents`
- **Ligne 264-266 :** `transfer_data: { destination: connectedAccountId }`

### 2. Paiement du solde
- **Fichier :** `app/api/reservations/public/[token]/balance/checkout/route.ts`
- **Ligne 114 :** `application_fee_amount: applicationFeeInCents`
- **Ligne 115-117 :** `transfer_data: { destination: connectedAccountId }`

## Vérification

Pour vérifier que les frais sont bien retenus :
1. Aller dans le Dashboard Stripe (compte principal Carbly)
2. Regarder les "Application fees" dans les paiements
3. Vérifier que chaque paiement a bien l'`application_fee` correspondant

## Frais Minimum pour Couvrir les Frais Stripe

### Pourquoi un minimum ?

Les frais Stripe sont : **1.5% + 0.25€** par transaction pour les cartes européennes.

Pour les petites transactions, le pourcentage de commission Carbly pourrait être inférieur aux frais Stripe, ce qui mettrait la plateforme en perte.

### Configuration des Minimums par Plan

| Plan | Commission | Minimum | Maximum | Exemple 30€ | Exemple 100€ |
|------|-----------|---------|---------|-------------|--------------|
| Free | 5% | 2.50€ | - | 2.50€ (min) | 5.00€ |
| Starter | 2% | 2.00€ | - | 2.00€ (min) | 2.00€ |
| Pro | 1% | 1.50€ | 15€ | 1.50€ (min) | 1.00€ |
| Business | 0.5% | 1.00€ | 5€ | 1.00€ (min) | 0.50€ |

### Affichage au Client

Le minimum est clairement affiché dans le checkout :
- `"5% (minimum 2.50€ appliqué)"` - quand le minimum est utilisé
- `"2%"` - quand le pourcentage normal s'applique

## Modifications Apportées Aujourd'hui

### 1. ✅ Correction du flux de paiement Stripe Connect
- **Avant** : Utilisait `application_fee_amount` (compte pouvait devenir négatif)
- **Après** : Utilise `transfer_data.amount` (l'argent arrive sur le compte principal d'abord)

### 2. ✅ Ajout de frais minimum
- Configuration de minimums pour tous les plans
- Calcul automatique dans `calculatePlatformFees()`
- Affichage transparent au client

### 3. ✅ Amélioration de l'affichage
- Tooltip explicatif sur les cartes de pricing
- Ligne "Minimum" visible dans les détails des frais
- Exemples avec et sans minimum appliqué
- Description des frais mise à jour dans lib/stripe.ts

### 4. ✅ Variable d'environnement YouSign
- Ajout de `YOUSIGN_ENABLED=false` pour activer/désactiver la signature électronique
- Interface mise à jour avec bandeau "Prochainement"
- Protection des actions serveur contre l'utilisation quand désactivé
