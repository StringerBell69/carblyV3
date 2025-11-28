# 📝 Flux de Signature Électronique des Contrats

## Vue d'ensemble

Le système de signature électronique est maintenant **entièrement fonctionnel** avec Yousign. Après la génération du contrat, le client reçoit automatiquement un email avec un lien pour signer électroniquement le contrat.

## 🔄 Flux complet

### 1️⃣ Génération du contrat (Dashboard)

**Fichier**: `app/(dashboard)/reservations/actions.ts:463`

Lorsque l'agence clique sur "Générer le contrat" :

1. ✅ Vérification que la réservation est payée
2. ✅ Génération du PDF du contrat (via `lib/pdf/generate.ts`)
3. ✅ Upload du PDF sur Cloudflare R2
4. ✅ Le contrat est créé et visible dans la base de données

**Important** : À ce stade, le contrat est généré mais **pas encore envoyé** au client. Cela permet à l'agence de vérifier le contrat avant envoi.

### 2️⃣ Vérification du contrat par l'agence

L'agence peut :
- ✅ Télécharger et lire le PDF du contrat
- ✅ Vérifier que toutes les informations sont correctes
- ✅ Décider quand envoyer le contrat pour signature

### 3️⃣ Envoi du contrat pour signature (Dashboard)

**Fichier**: `app/(dashboard)/reservations/actions.ts:505`

Lorsque l'agence clique sur "Envoyer pour signature électronique" :

1. ✅ Vérification que le contrat a été généré
2. ✅ **Création d'une demande de signature Yousign** (`lib/yousign.ts:40`)
   - Étape 1 : Upload du PDF vers Yousign (récupération de l'ID du document)
   - Étape 2 : Création de la signature request avec l'ID du document
   - Étape 3 : Ajout du client comme signataire
   - Étape 4 : Configuration de l'authentification (OTP par SMS ou email)
   - Étape 5 : Activation de la demande de signature
3. ✅ Envoi d'un email au client avec le **lien de signature Yousign**

### 4️⃣ Email envoyé au client

**Fichier**: `lib/resend.ts:64`

Le client reçoit un email contenant :
- ✅ Confirmation du paiement
- ✅ Détails du véhicule
- ✅ **Bouton "Signer mon contrat maintenant"** avec le lien Yousign
- ✅ Explications sur la sécurité de la signature électronique
- ✅ Information sur le code OTP (SMS ou email)

### 5️⃣ Signature du contrat par le client

Le client clique sur le lien et :
1. ✅ Accède à l'interface Yousign sécurisée
2. ✅ Lit le contrat
3. ✅ Reçoit un code OTP (par SMS si numéro de téléphone fourni, sinon par email)
4. ✅ Entre le code OTP
5. ✅ Signe électroniquement le contrat

### 6️⃣ Webhook Yousign (Après signature)

**Fichier**: `app/api/webhooks/yousign/route.ts`

Lorsque le client signe :
1. ✅ Yousign envoie un webhook `signature_request.done`
2. ✅ Le système télécharge le PDF signé depuis Yousign
3. ✅ Upload du PDF signé sur Cloudflare R2
4. ✅ Mise à jour du contrat avec :
   - `signedAt`: date de signature
   - `signedPdfUrl`: lien vers le PDF signé
5. ✅ Mise à jour du statut de la réservation → `confirmed`
6. ✅ **Envoi d'un email de confirmation** au client

### 7️⃣ Email de confirmation après signature

**Fichier**: `lib/resend.ts:132`

Le client reçoit un email contenant :
- ✅ Félicitations pour la signature
- ✅ Récapitulatif complet de la réservation
- ✅ Informations de retrait (date, adresse)
- ✅ Checklist des documents à apporter
- ✅ **Bouton pour télécharger le contrat signé**

## 🔧 Configuration requise

### Variables d'environnement (.env.local)

```env
# Yousign API
YOUSIGN_API_KEY=f2NO6GYB9a3zi1db1SKJJRPX2oCbmUPL
YOUSIGN_WEBHOOK_SECRET=53480fbe3b7b8346780b4d9b9dc1a13c

# Email
RESEND_API_KEY=re_J5tde3fP_DV4GmpAFnP9tmpjVspFwNXoD
RESEND_FROM_EMAIL=noreply_carbly@sumbo.fr
```

### Webhook Yousign

**URL à configurer dans Yousign** :
```
https://votre-domaine.com/api/webhooks/yousign
```

**Secret** : `53480fbe3b7b8346780b4d9b9dc1a13c`

**Événements à écouter** :
- ✅ `signature_request.done` - Contrat signé
- ✅ `signature_request.declined` - Signature refusée
- ✅ `signature_request.expired` - Signature expirée

## 📊 Schéma de données

### Table `contracts`

```typescript
{
  id: string;
  reservationId: string;
  yousignSignatureRequestId: string | null;  // ID de la demande Yousign
  pdfUrl: string | null;                      // URL du PDF non signé
  signedAt: Date | null;                      // Date de signature
  signedPdfUrl: string | null;                // URL du PDF signé
  createdAt: Date;
  updatedAt: Date;
}
```

### Statuts de réservation

- `pending_payment` → Paiement en attente
- `paid` → Payé, en attente de signature
- `confirmed` → **Contrat signé**, réservation confirmée
- `in_progress` → Location en cours
- `completed` → Location terminée
- `cancelled` → Annulée

## 🎯 Points clés

### ✅ Ce qui fonctionne

1. **Génération du contrat PDF** avec vérification avant envoi
2. **Séparation génération / envoi** : l'agence peut vérifier le contrat avant de l'envoyer
3. **Création de la demande de signature Yousign** au moment choisi par l'agence
4. **Email automatique** au client avec lien de signature sécurisé
5. **Authentification OTP** (SMS ou email) pour validation
6. **Webhook Yousign** qui traite la signature automatiquement
7. **Téléchargement et stockage** du PDF signé
8. **Email de confirmation** avec le contrat signé
9. **Mise à jour automatique** du statut de réservation

### 🔒 Sécurité

- ✅ Signature électronique **100% légale** (eIDAS)
- ✅ Authentification OTP obligatoire
- ✅ Traçabilité complète (horodatage, IP, etc.)
- ✅ PDFs stockés de manière sécurisée sur Cloudflare R2
- ✅ Webhook sécurisé avec secret

## 🧪 Test du flux

### 1. En développement (avec Yousign Sandbox)

L'API key configurée est pour le **mode sandbox** de Yousign :
```
YOUSIGN_API_KEY=f2NO6GYB9a3zi1db1SKJJRPX2oCbmUPL
```

**Pour tester** :
1. Créer une réservation
2. Effectuer le paiement (mode test Stripe)
3. Cliquer sur "Générer le contrat"
4. Vérifier l'email reçu
5. Cliquer sur le lien de signature
6. Signer avec le code OTP
7. Vérifier le webhook et l'email de confirmation

### 2. En production

**Important** : Avant de passer en production :
1. Obtenir une clé API Yousign **production**
2. Configurer le webhook sur le domaine de production
3. Tester avec des vraies signatures

## 📧 Templates d'emails

### Email 1 : Demande de signature
- Sujet : `✅ Paiement confirmé - Signez votre contrat de location`
- Contient : Lien de signature Yousign + explications

### Email 2 : Confirmation après signature
- Sujet : `🎉 Contrat signé - Votre location est confirmée !`
- Contient : Récapitulatif + lien vers PDF signé + checklist

## 🚀 Améliorations possibles

1. **Relances automatiques** si le client ne signe pas sous 24h/48h
2. **Dashboard agence** : voir le statut de signature en temps réel
3. **Notifications SMS** en plus des emails
4. **Multi-signataires** si besoin (ex: co-locataire)
5. **Templates de contrat personnalisables** par agence

## 📞 Support

En cas de problème :
- Logs dans la console : `[Yousign]` et `[generateReservationContract]`
- Webhook Yousign : vérifier les événements reçus
- Base de données : vérifier les champs `yousignSignatureRequestId`, `signedAt`, `signedPdfUrl`
