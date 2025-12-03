# Fonctionnalité d'annulation de réservation

## Vue d'ensemble

Cette fonctionnalité permet aux agences d'annuler une réservation avec gestion automatique des remboursements Stripe et notification par email au client.

## Fonctionnalités implémentées

### 1. API d'annulation ([app/api/reservations/[id]/cancel/route.ts](app/api/reservations/[id]/cancel/route.ts))

**Endpoint:** `POST /api/reservations/[id]/cancel`

**Paramètres:**
```json
{
  "reason": "string",           // Raison de l'annulation (obligatoire)
  "refundAmount": "full" | "partial" | "none"  // Type de remboursement
}
```

**Fonctionnement:**
1. ✅ Vérification de l'autorisation (utilisateur connecté)
2. ✅ Vérification que la réservation appartient à l'équipe de l'utilisateur
3. ✅ Vérification que la réservation n'est pas déjà annulée
4. ✅ Vérification que la réservation n'a pas déjà commencé (check-in)
5. ✅ Traitement des remboursements Stripe automatiques
6. ✅ Mise à jour du statut de la réservation
7. ✅ Envoi de l'email de confirmation au client

**Types de remboursement:**
- **`full`** : Remboursement intégral (100%)
- **`partial`** : Remboursement partiel (50%)
- **`none`** : Aucun remboursement

### 2. Interface utilisateur

**Composant:** [app/(dashboard)/reservations/[id]/components/cancel-reservation-button.tsx](app/(dashboard)/reservations/[id]/components/cancel-reservation-button.tsx)

**Fonctionnalités UI:**
- ✅ Bouton "Annuler la réservation" dans la page de détails
- ✅ Dialog de confirmation avec alerte de sécurité
- ✅ Sélection du type de remboursement
- ✅ Champ de raison obligatoire
- ✅ Gestion des erreurs et du loading
- ✅ Le bouton n'apparaît pas si la réservation est déjà annulée

### 3. Email de notification

**Fonction:** `sendCancellationEmail()` dans [lib/resend.ts](lib/resend.ts)

**Contenu de l'email:**
- ✅ Confirmation de l'annulation
- ✅ Détails de la réservation annulée
- ✅ Information sur le remboursement (montant et délai)
- ✅ Raison de l'annulation (si fournie)
- ✅ Design adapté au type de remboursement

### 4. Gestion Stripe

**Remboursement automatique:**
- Les remboursements sont créés sur le compte Connect approprié
- Le montant remboursé inclut les frais de platform si nécessaire
- Les frais Stripe sont gérés automatiquement par Stripe
- Les erreurs de remboursement sont loggées mais n'empêchent pas l'annulation

## Flux d'utilisation

### Pour l'agence (dashboard)

1. Accéder à la page de détails d'une réservation
2. Cliquer sur "Annuler la réservation"
3. Sélectionner le type de remboursement
4. Saisir la raison de l'annulation
5. Confirmer l'annulation

### Pour le client

1. Réception d'un email de confirmation d'annulation
2. Information sur le remboursement éventuel
3. Délai de remboursement : 5 à 10 jours ouvrés

## Sécurité et validations

✅ **Authentification requise** - Seuls les utilisateurs connectés peuvent annuler
✅ **Autorisation par équipe** - Chaque équipe ne peut annuler que ses réservations
✅ **Protection contre les annulations multiples** - Impossible d'annuler deux fois
✅ **Protection temporelle** - Impossible d'annuler après le check-in
✅ **Validation des données** - Raison obligatoire

## Améliorations futures possibles

- [ ] Politique d'annulation configurable par agence
- [ ] Calcul automatique du remboursement selon la date d'annulation
- [ ] Historique des annulations dans un onglet dédié
- [ ] Notifications push pour les annulations
- [ ] Statistiques d'annulation dans le dashboard

## Tests recommandés

### Test 1 : Annulation avec remboursement complet
1. Créer une réservation payée
2. Annuler avec `refundAmount: 'full'`
3. Vérifier :
   - Statut = 'cancelled'
   - Remboursement créé dans Stripe
   - Email envoyé au client
   - Notes internes mises à jour

### Test 2 : Annulation sans remboursement
1. Créer une réservation payée
2. Annuler avec `refundAmount: 'none'`
3. Vérifier :
   - Statut = 'cancelled'
   - Aucun remboursement créé
   - Email envoyé avec mention "aucun remboursement"

### Test 3 : Tentative d'annulation après check-in
1. Créer une réservation avec check-in effectué
2. Tenter d'annuler
3. Vérifier : Erreur 400 "Impossible d'annuler une réservation déjà commencée"

### Test 4 : Annulation multiple
1. Annuler une réservation
2. Tenter de l'annuler à nouveau
3. Vérifier : Erreur 400 "Cette réservation est déjà annulée"

## Notes techniques

- Les remboursements Stripe sont créés avec `reason: 'requested_by_customer'`
- Les metadata Stripe incluent `reservationId` et `cancelReason`
- Le webhook Stripe `charge.refunded` peut être utilisé pour tracker les remboursements
- Les notes internes incluent un timestamp, la raison et le type de remboursement
