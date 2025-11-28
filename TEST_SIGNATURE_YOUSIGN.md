# 🧪 Guide de Test - Signature Électronique Yousign

## Correction apportée

✅ **Problème résolu** : L'API Yousign v3 nécessite d'inclure le document directement lors de la création de la signature request, et non via un endpoint séparé.

## Configuration de test

### 1. Variables d'environnement

Vérifiez que votre `.env.local` contient :

```env
# Yousign (mode sandbox pour les tests)
YOUSIGN_API_KEY=f2NO6GYB9a3zi1db1SKJJRPX2oCbmUPL
YOUSIGN_WEBHOOK_SECRET=53480fbe3b7b8346780b4d9b9dc1a13c

# Resend pour les emails
RESEND_API_KEY=re_J5tde3fP_DV4GmpAFnP9tmpjVspFwNXoD

# URL de l'application
NEXT_PUBLIC_URL=http://localhost:3000
```

### 2. Webhook Yousign (mode sandbox)

**URL de développement** : Utilisez un tunnel comme ngrok pour tester les webhooks localement

```bash
# Installer ngrok si nécessaire
brew install ngrok

# Créer un tunnel vers votre app locale
ngrok http 3000
```

**Configurer dans Yousign** :
- URL webhook : `https://votre-tunnel-ngrok.app/api/webhooks/yousign`
- Secret : `53480fbe3b7b8346780b4d9b9dc1a13c`
- Événements : `signature_request.done`, `signature_request.declined`, `signature_request.expired`

## 🚀 Procédure de test

### Étape 1 : Créer une réservation de test

1. Connectez-vous au dashboard
2. Créez un nouveau client de test avec votre email personnel
3. Créez une nouvelle réservation :
   - Sélectionnez un véhicule
   - Choisissez des dates
   - Associez le client de test
   - **Renseignez le numéro de téléphone** si vous voulez tester l'OTP par SMS (sinon ce sera par email)

### Étape 2 : Effectuer le paiement (mode test Stripe)

1. Utilisez la carte de test Stripe :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel code à 3 chiffres
2. Complétez le paiement
3. Vérifiez que le statut passe à `paid`

### Étape 3 : Générer le contrat

1. Dans le dashboard, accédez à la réservation
2. Cliquez sur **"Générer le contrat"**
3. Attendez la génération (quelques secondes)
4. **Vérifiez l'interface** :
   ```
   ⚠️ Contrat généré
   Vérifiez le contrat puis envoyez-le au client pour signature

   📄 Télécharger et vérifier le contrat PDF

   [Envoyer pour signature électronique]
   ```

### Étape 4 : Vérifier le contrat

1. Cliquez sur "Télécharger et vérifier le contrat PDF"
2. Ouvrez le PDF
3. Vérifiez que toutes les informations sont correctes :
   - Informations du client
   - Détails du véhicule
   - Dates de location
   - Montants
4. Fermez le PDF

### Étape 5 : Envoyer pour signature

1. Retournez sur le dashboard
2. Cliquez sur **"Envoyer pour signature électronique"**
3. Attendez la confirmation : "Contrat envoyé au client pour signature par email"
4. **Vérifiez l'interface** :
   ```
   ✉️ En attente de signature du client
   Le contrat a été envoyé par email avec un lien de signature Yousign

   Le client doit :
   1. Cliquer sur le lien dans l'email
   2. Lire le contrat
   3. Entrer le code OTP reçu
   4. Signer électroniquement
   ```

### Étape 6 : Email de demande de signature

1. Consultez votre boîte mail (l'email du client de test)
2. Vous devriez recevoir un email avec :
   - Sujet : "✅ Paiement confirmé - Signez votre contrat de location"
   - Un bouton "📝 Signer mon contrat maintenant"
3. **NE CLIQUEZ PAS ENCORE** - continuez la vérification

### Étape 7 : Logs de développement

Vérifiez les logs dans votre terminal où tourne `bun run dev` :

```
[Yousign] Signature request created: sig_XXXXXXXXX
[sendContractForSignature] Contract sent successfully
```

Si vous voyez des erreurs, vérifiez :
- La clé API Yousign est correcte
- Le PDF a bien été uploadé sur R2
- La connexion réseau est stable

### Étape 8 : Signer le contrat

1. Cliquez sur le bouton "📝 Signer mon contrat maintenant" dans l'email
2. Vous serez redirigé vers l'interface Yousign
3. Lisez le contrat
4. Cliquez sur "Signer"
5. **Authentification OTP** :
   - Si numéro de téléphone renseigné : vous recevrez un SMS
   - Sinon : vous recevrez un email avec le code
6. Entrez le code OTP
7. Validez la signature

### Étape 9 : Webhook et traitement automatique

Après la signature, Yousign envoie un webhook. Vérifiez les logs :

```
[Yousign Webhook] Event received: signature_request.done
[Yousign Webhook] Contract signed and processed: cont_XXXXXXXXX
```

Le système effectue automatiquement :
- ✅ Téléchargement du PDF signé depuis Yousign
- ✅ Upload sur Cloudflare R2
- ✅ Mise à jour du contrat dans la BDD
- ✅ Changement du statut de réservation → `confirmed`
- ✅ Envoi de l'email de confirmation

### Étape 10 : Email de confirmation

Vérifiez votre boîte mail, vous devriez recevoir :

- Sujet : "🎉 Contrat signé - Votre location est confirmée !"
- Contenu :
  - Félicitations
  - Récapitulatif de la réservation
  - Informations de retrait
  - Checklist des documents à apporter
  - Bouton "📄 Télécharger mon contrat signé"

### Étape 11 : Vérifier le dashboard

Retournez sur le dashboard :

1. Rafraîchissez la page de la réservation
2. **Vérifiez l'interface** :
   ```
   ✅ Contrat signé
   Le contrat a été signé électroniquement par le client

   📄 Télécharger le contrat signé
   ```
3. Le statut de la réservation doit être `confirmed`
4. Cliquez sur "Télécharger le contrat signé"
5. Vérifiez que le PDF contient la signature électronique

## ✅ Checklist de validation

- [ ] Génération du contrat PDF
- [ ] Bouton "Envoyer pour signature" actif
- [ ] Contrat téléchargeable avant envoi
- [ ] Création de la signature request Yousign
- [ ] Email de demande de signature reçu
- [ ] Lien Yousign fonctionnel
- [ ] Interface Yousign s'affiche correctement
- [ ] Code OTP reçu (SMS ou email)
- [ ] Signature électronique réussie
- [ ] Webhook Yousign reçu et traité
- [ ] PDF signé téléchargé et stocké
- [ ] Statut réservation mis à jour → `confirmed`
- [ ] Email de confirmation reçu
- [ ] PDF signé téléchargeable depuis le dashboard

## 🐛 Dépannage

### Erreur : "Failed to create signature request"

**Causes possibles** :
- Clé API Yousign invalide ou expirée
- Mode sandbox vs production (vérifiez l'URL de l'API)
- Quota dépassé sur le compte Yousign sandbox

**Solution** :
- Vérifiez `YOUSIGN_API_KEY` dans `.env.local`
- Consultez les logs Yousign pour voir le message d'erreur exact
- Vérifiez votre compte Yousign sandbox

### Erreur : "Failed to upload document"

**Causes possibles** :
- PDF corrompu ou trop volumineux
- Format de base64 incorrect

**Solution** :
- Vérifiez que le PDF se génère correctement
- Vérifiez les logs de génération du PDF

### Webhook non reçu

**Causes possibles** :
- URL webhook incorrecte dans Yousign
- Ngrok tunnel fermé
- Secret webhook incorrect

**Solution** :
- Vérifiez que ngrok tourne : `ngrok http 3000`
- Vérifiez l'URL dans Yousign
- Vérifiez le secret : `53480fbe3b7b8346780b4d9b9dc1a13c`
- Consultez les logs Yousign pour voir si le webhook a été envoyé

### Email non reçu

**Causes possibles** :
- Clé API Resend invalide
- Email dans les spams
- Limite de quota Resend atteinte

**Solution** :
- Vérifiez `RESEND_API_KEY` dans `.env.local`
- Consultez les logs Resend
- Vérifiez le dossier spam
- Consultez le dashboard Resend pour voir les emails envoyés

## 📊 Logs utiles

Pour suivre le flux complet, surveillez ces logs dans votre terminal :

```bash
# Génération du contrat
[generateReservationContract] Contract generated successfully

# Envoi pour signature
[sendContractForSignature] Sending contract to Yousign
[Yousign] Signature request created: sig_XXX

# Email envoyé
[Resend] Email sent to customer

# Webhook reçu
[Yousign Webhook] Event received: signature_request.done
[Yousign Webhook] Downloading signed document
[Yousign Webhook] Uploading to R2
[Yousign Webhook] Contract signed and processed
```

## 🎯 Prochaines étapes

Une fois le test validé en mode sandbox :

1. **Obtenir une clé API Yousign production**
   - Créer un compte Yousign production
   - Générer une clé API
   - Mettre à jour `.env.local`

2. **Changer l'URL de l'API**
   ```typescript
   const YOUSIGN_API_URL = 'https://api.yousign.app/v3'; // Production
   ```

3. **Configurer le webhook en production**
   - URL : `https://votre-domaine.com/api/webhooks/yousign`
   - Générer un nouveau secret sécurisé
   - Mettre à jour `YOUSIGN_WEBHOOK_SECRET`

4. **Tester en production avec un vrai client**

## 📚 Ressources

- [Documentation Yousign API v3](https://developers.yousign.com/)
- [Guide webhook Yousign](https://developers.yousign.com/docs/webhooks)
- [Resend Documentation](https://resend.com/docs)
