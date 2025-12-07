# CARBLY - Documentation d'implémentation MVP

## 🎯 État actuel du projet

Ce projet a été initialisé avec **Next.js 15**, **TypeScript**, **Drizzle ORM**, **Better-auth**, et toutes les dépendances nécessaires pour créer une plateforme SaaS B2B de gestion de flotte de location de véhicules.

---

## ✅ CE QUI A ÉTÉ FAIT

### 1. Configuration de base du projet

#### Structure créée :
```
carblyV3/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── vehicles/
│   │   ├── reservations/
│   │   ├── customers/
│   │   └── settings/
│   ├── (public)/
│   │   └── reservation/
│   ├── admin/
│   ├── api/
│   │   ├── auth/
│   │   ├── webhooks/
│   │   │   ├── stripe/
│   │   │   └── yousign/
│   │   ├── cron/
│   │   └── upload/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx (Landing Page)
├── components/
│   ├── ui/ (Button, Card, Input)
│   ├── dashboard/
│   ├── vehicles/
│   ├── reservations/
│   └── emails/
├── drizzle/
│   └── schema.ts (Schema complet)
├── lib/
│   ├── auth.ts (Better-auth config)
│   ├── db.ts (Drizzle client)
│   ├── stripe.ts (Configuration Stripe)
│   ├── r2.ts (Cloudflare R2)
│   ├── resend.ts (Email templates)
│   ├── twilio.ts (SMS)
│   └── utils.ts (Helpers)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── drizzle.config.ts
├── .env.example
└── .gitignore
```

### 2. Schema de base de données (Drizzle ORM)

✅ **Tables créées** :
- `organizations` - Comptes facturables Stripe
- `teams` - Agences de location (1 par plan)
- `users` - Employés des agences
- `teamMembers` - Relation users <-> teams
- `vehicles` - Véhicules de la flotte
- `customers` - Clients finaux
- `reservations` - Locations
- `contracts` - Contrats signés Yousign
- `payments` - Paiements Stripe

✅ **Enums définis** :
- `plan` : starter, pro, business
- `vehicle_status` : available, rented, maintenance, out_of_service
- `reservation_status` : draft, pending_payment, paid, confirmed, in_progress, completed, cancelled
- `payment_type` : deposit, total, caution, insurance
- `payment_status` : pending, succeeded, failed, refunded

✅ **Relations configurées** avec Drizzle ORM

### 3. Services externes configurés

✅ **Stripe** (`lib/stripe.ts`) :
- Configuration client Stripe
- Helpers pour créer des checkouts d'abonnement
- Helpers pour paiements de réservation
- Pré-autorisation caution (Pro+)
- Stripe Identity (Pro+)
- Plans définis (Starter €49, Pro €99, Business €199)

✅ **Cloudflare R2** (`lib/r2.ts`) :
- Upload de fichiers (images, PDFs)
- Génération de presigned URLs
- Download et suppression

✅ **Resend** (`lib/resend.ts`) :
- Templates emails pour :
  - Lien de paiement réservation
  - Confirmation paiement
  - Contrat signé
  - Rappel restitution (J-1)

✅ **Twilio** (`lib/twilio.ts`) :
- Envoi SMS pour notifications critiques
- Templates pour paiement confirmé, contrat signé, rappel restitution

✅ **Better-auth** (`lib/auth.ts`) :
- Configuration authentification session-based
- Multi-tenant avec `currentTeamId`
- Support SuperAdmin

### 4. Pages créées

✅ **Landing Page** (`app/page.tsx`) :
- Hero section
- Features
- Pricing (avec les 3 plans)
- CTA
- Footer
- Mobile-first, responsive

✅ **Pages Auth** :
- `app/(auth)/login/page.tsx` - Connexion
- `app/(auth)/signup/page.tsx` - Inscription
- Formulaires avec validation
- Gestion erreurs
- Redirection selon rôle (SuperAdmin → /admin, User → /dashboard ou /onboarding)

### 5. Composants UI (shadcn/ui style)

✅ **Composants créés** :
- `components/ui/button.tsx` - Bouton avec variants
- `components/ui/card.tsx` - Card avec Header, Content, Footer
- `components/ui/input.tsx` - Input avec styles

### 6. Utilitaires

✅ **lib/utils.ts** :
- `cn()` - Merge classes Tailwind
- `formatDate()` - Formater dates (français)
- `formatCurrency()` - Formater montants (EUR)
- `generateRandomToken()` - Tokens aléatoires
- `calculateDays()` - Calcul jours entre dates
- `calculateRentalPrice()` - Calcul prix location

### 7. Configuration

✅ Fichiers de configuration :
- `package.json` - Scripts npm (dev, build, db:push, etc.)
- `tsconfig.json` - TypeScript strict mode
- `tailwind.config.ts` - Thème personnalisé (bleu #3B82F6)
- `next.config.js` - Images remote patterns (R2)
- `drizzle.config.ts` - Configuration Drizzle
- `postcss.config.js` - PostCSS
- `.env.example` - Variables d'environnement documentées
- `.gitignore` - Fichiers à ignorer

---

## 🚧 CE QUI RESTE À FAIRE

### PHASE 1 - CORE MVP (PRIORITÉ HAUTE)

#### 1. API Routes d'authentification
**Fichiers à créer** :
- `app/api/auth/signup/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`

**Instructions** :
```typescript
// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash,
    }).returning();

    // TODO: Create session with Better-auth

    return NextResponse.json({ user: newUser });
  } catch (error) {
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
}
```

Répéter pour login et logout.

#### 2. Flow Onboarding complet
**Page à créer** : `app/onboarding/page.tsx`

**Étapes** :
1. Créer organization (nom)
2. Créer première team (nom agence)
3. Choisir plan (Starter/Pro/Business)
4. Setup paiement Stripe (SEPA ou carte)
5. Confirmation → Redirect /dashboard

**Instructions** :
- Utiliser un state machine (étapes 1-5)
- Server Actions pour créer org, team
- Stripe Checkout pour paiement
- Stocker `stripeSubscriptionId` dans `teams`

#### 3. Middleware de sécurité
**Fichier à créer** : `middleware.ts`

**Instructions** :
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { getSession } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  // const session = await getSession(req);

  // Routes publiques
  if (req.nextUrl.pathname.startsWith('/reservation/')) {
    return NextResponse.next();
  }

  // SuperAdmin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // if (!session?.user?.isSuperAdmin) {
    //   return NextResponse.redirect(new URL('/dashboard', req.url));
    // }
  }

  // Protected routes
  // if (!session && !req.nextUrl.pathname.startsWith('/login')) {
  //   return NextResponse.redirect(new URL('/login', req.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

#### 4. Dashboard avec KPIs
**Fichier à créer** : `app/(dashboard)/dashboard/page.tsx`

**Server Actions à créer** : `app/(dashboard)/dashboard/actions.ts`

**KPIs à afficher** :
- CA du mois (€)
- Réservations en cours (nombre)
- Taux d'occupation (%)
- Véhicules disponibles

**Graphiques** :
- CA des 6 derniers mois (line chart avec recharts)
- Réservations par véhicule (bar chart)

**Instructions** :
```typescript
// actions.ts
'use server';
import { db } from '@/lib/db';
import { reservations, payments, vehicles } from '@/drizzle/schema';
import { sql, and, eq, gte } from 'drizzle-orm';

export async function getDashboardStats(teamId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // CA du mois
  const revenue = await db
    .select({ total: sql<number>`SUM(${payments.amount})` })
    .from(payments)
    .innerJoin(reservations, eq(payments.reservationId, reservations.id))
    .where(
      and(
        eq(reservations.teamId, teamId),
        gte(payments.paidAt, startOfMonth),
        eq(payments.status, 'succeeded')
      )
    );

  // ... autres KPIs

  return { revenue: revenue[0]?.total || 0, ... };
}
```

#### 5. CRUD Véhicules
**Fichiers à créer** :
- `app/(dashboard)/vehicles/page.tsx` - Liste véhicules
- `app/(dashboard)/vehicles/new/page.tsx` - Ajouter véhicule
- `app/(dashboard)/vehicles/[id]/page.tsx` - Éditer véhicule
- `app/(dashboard)/vehicles/actions.ts` - Server Actions

**Features** :
- Liste/Grid avec filtres (statut, marque)
- Form ajout : Marque, Modèle, Année, Immat, VIN, Prix, etc.
- Upload images vers R2 (4 angles + intérieur + carte grise)
- Édition, suppression

**Instructions upload images** :
1. Client obtient presigned URL via Server Action
2. Client upload direct vers R2 avec fetch()
3. Client envoie URL finale au serveur
4. Serveur stocke dans `vehicle.images` (jsonb)

#### 6. Système de Réservations
**Fichiers à créer** :
- `app/(dashboard)/reservations/page.tsx` - Liste réservations
- `app/(dashboard)/reservations/new/page.tsx` - Créer réservation (5 steps)
- `app/(dashboard)/reservations/[id]/page.tsx` - Détails réservation
- `app/(dashboard)/reservations/actions.ts` - Server Actions

**Flow création réservation** :
1. Choisir véhicule (+ vérifier dispo)
2. Dates (start/end) + calcul prix auto
3. Client (search ou créer nouveau)
4. Options (acompte, assurance, caution si Pro+)
5. Confirmation → Créer résa + envoyer email avec magic link

**Server Action** :
```typescript
'use server';
export async function createReservation(data) {
  // 1. Vérifier conflit dates
  // 2. Créer customer si nouveau
  // 3. Générer magicLinkToken
  // 4. Créer reservation (status: pending_payment)
  // 5. Envoyer email via Resend
}
```

#### 7. Lien magique client avec paiement
**Fichier à créer** : `app/(public)/reservation/[token]/page.tsx`

**Flow** :
1. Récupérer résa via token
2. Afficher détails (véhicule, dates, montant)
3. Si client nouveau + plan ≥ Pro : Bouton "Vérifier identité" (Stripe Identity)
4. Stripe Checkout Session (montant + fee 0.99€)
5. Si caution activée : Créer payment_intent manual capture
6. Après paiement : Générer contrat PDF + envoyer à Yousign

**Instructions Stripe Checkout** :
```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card', 'sepa_debit'],
  line_items: [
    { price_data: { ... }, quantity: 1 }, // Montant résa
    { price_data: { ... }, quantity: 1 }, // Fee 0.99€
  ],
  metadata: { reservationId, teamId },
  success_url: `${process.env.NEXT_PUBLIC_URL}/reservation/${token}/success`,
  cancel_url: `${process.env.NEXT_PUBLIC_URL}/reservation/${token}`,
});
```

#### 8. Génération contrats PDF
**Fichier à créer** : `lib/pdf/contract.tsx`

**Instructions** :
```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export const ContractPDF = ({ reservation, vehicle, customer, team }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>CONTRAT DE LOCATION</Text>
        <Text>{team.name}</Text>
      </View>
      {/* Parties, dates, montants, conditions */}
    </Page>
  </Document>
);

// Server Action
export async function generateContract(reservationId: string) {
  const data = await fetchReservationData(reservationId);
  const pdfBlob = await pdf(<ContractPDF {...data} />).toBlob();
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
  const pdfUrl = await uploadToR2({ file: pdfBuffer, path: `contracts/${reservationId}.pdf`, ... });
  return pdfUrl;
}
```

#### 9. Intégration Yousign
**Fichier à créer** : `lib/yousign.ts`

**Instructions** :
```typescript
// npm install @yousign/yousign-api
import { Yousign } from '@yousign/yousign-api';

const yousign = new Yousign(process.env.YOUSIGN_API_KEY);

export async function createSignatureRequest(contractPdfUrl, customer) {
  const signatureRequest = await yousign.signatureRequests.create({
    name: `Contrat location`,
    delivery_mode: 'email',
    documents: [{ url: contractPdfUrl }],
    signers: [{
      info: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
      },
      signature_level: 'electronic_signature',
      signature_authentication_mode: 'otp_sms',
      phone_number: customer.phone,
    }],
  });

  return signatureRequest;
}
```

#### 10. Check-in / Check-out
**Ajouts dans** : `app/(dashboard)/reservations/[id]/page.tsx`

**Features** :
- Bouton "Check-in" (si status = paid)
- Modal avec upload photos (R2), kilométrage, carburant
- Update reservation : checkinAt, checkinPhotos, checkinMileage, checkinFuelLevel
- Status → in_progress

Similaire pour Check-out.

#### 11. Webhooks Stripe
**Fichier à créer** : `app/api/webhooks/stripe/route.ts`

**Événements à écouter** :
- `checkout.session.completed` → Update résa status → Générer contrat
- `payment_intent.succeeded` → Confirmation
- `customer.subscription.created/updated/deleted` → Gérer abonnements teams

**Instructions** :
```typescript
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Handle payment success
      break;
    // ...
  }

  return new Response('OK');
}
```

#### 12. Webhooks Yousign
**Fichier à créer** : `app/api/webhooks/yousign/route.ts`

**Événement** : `signature_request.done`
- Télécharger PDF signé depuis Yousign
- Upload sur R2
- Update contract (signedAt, signedPdfUrl)
- Update reservation status → confirmed
- Envoyer email confirmation

---

### PHASE 2 - FEATURES AVANCÉES (PRIORITÉ MOYENNE)

#### 13. Page Clients
**Fichier** : `app/(dashboard)/customers/page.tsx`

- Liste clients (email, nom, nb locations)
- Filtres (verified, loyalty points)
- Fiche client détaillée

#### 14. Page Paramètres
**Fichier** : `app/(dashboard)/settings/page.tsx`

Sections :
- Mon compte (email, password)
- Mon agence (nom, logo, plan)
- Facturation (Stripe Portal)
- Notifications (toggle email/SMS)

#### 15. Backoffice SuperAdmin
**Fichiers** : `app/admin/*`

- Dashboard global (nb orgs, teams, CA total)
- Liste organizations
- Liste teams avec détails
- Analytics (MRR, churn)

#### 16. Cron jobs
**Fichier** : `app/api/cron/reminders/route.ts`

- Rappel restitution J-1 (email + SMS)
- Run quotidien via Vercel Cron

#### 17. Composants UI manquants
À créer dans `components/ui/` :
- `dialog.tsx` - Modals
- `dropdown-menu.tsx` - Dropdowns
- `select.tsx` - Select inputs
- `textarea.tsx` - Textareas
- `badge.tsx` - Badges de statut
- `calendar.tsx` - Date picker
- `table.tsx` - Tableaux

#### 18. Layout Dashboard
**Fichier** : `app/(dashboard)/layout.tsx`

- Sidebar avec navigation
- Header avec user menu
- Badge plan actuel
- Mobile : bottom nav + hamburger

---

## 🔧 CONFIGURATION REQUISE AVANT DE LANCER

### 1. Base de données NeonDB
1. Créer un compte sur [Neon](https://neon.tech)
2. Créer un projet
3. Copier `DATABASE_URL` dans `.env`
4. Exécuter migrations :
```bash
npm run db:push
```

### 2. Stripe
1. Créer compte [Stripe](https://stripe.com)
2. Mode test : Copier clés API dans `.env`
3. Créer 3 Products dans Dashboard :
   - Starter (€49/mois)
   - Pro (€99/mois)
   - Business (€199/mois)
4. Copier Price IDs dans `.env`
5. Configurer webhooks :
   - URL : `https://votre-domaine.com/api/webhooks/stripe`
   - Événements : `checkout.session.completed`, `payment_intent.succeeded`, `customer.subscription.*`

### 3. Cloudflare R2
1. Créer compte [Cloudflare](https://cloudflare.com)
2. Créer bucket R2 "carbly-uploads"
3. Générer API tokens (R2 Read & Write)
4. Copier credentials dans `.env`

### 4. Resend
1. Créer compte [Resend](https://resend.com)
2. Ajouter domaine (ex: carbly.com)
3. Configurer DNS (SPF, DKIM)
4. Copier API key dans `.env`

### 5. Twilio
1. Créer compte [Twilio](https://twilio.com)
2. Acheter numéro français
3. Copier Account SID, Auth Token dans `.env`

### 6. Yousign
1. Créer compte [Yousign](https://yousign.com)
2. Mode sandbox : Copier API key dans `.env`
3. Configurer webhook : `https://votre-domaine.com/api/webhooks/yousign`

### 7. Variables d'environnement
Créer `.env` à partir de `.env.example` :
```bash
cp .env.example .env
```

Remplir toutes les variables.

---

## 🚀 LANCER LE PROJET EN DEV

```bash
# Installer dépendances
npm install

# Appliquer migrations DB
npm run db:push

# Lancer dev server
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 📦 DÉPLOIEMENT VERCEL

1. Push code sur GitHub
2. Importer projet sur [Vercel](https://vercel.com)
3. Configurer variables d'environnement
4. Déployer

**Vercel Cron** :
Créer `vercel.json` :
```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 10 * * *"
  }]
}
```

---

## 🎨 DESIGN SYSTEM

### Couleurs
- Primary : `#3B82F6` (bleu)
- Success : `#10B981` (vert)
- Destructive : `#EF4444` (rouge)

### Typographie
- Font : Inter (Geist possible)
- Tailles : text-sm, text-base, text-lg, text-xl, text-2xl

### Spacing
- Mobile-first
- Container : max-w-7xl
- Padding : p-4 (mobile), p-6 (desktop)

---

## 📝 CONVENTIONS DE CODE

### Server Actions
- Toujours `'use server';` en haut
- Vérifier session au début
- Filter par `teamId` (RLS)
- Gestion erreurs try/catch

### Client Components
- Seulement si interactivité nécessaire
- `'use client';` en haut
- Loading states
- Error boundaries

### Naming
- Components : PascalCase
- Files : kebab-case
- Variables : camelCase
- Constants : UPPER_SNAKE_CASE

---

## 🐛 DEBUGGING

### Logs
```typescript
console.log('[DEBUG]', variable);
```

### Drizzle Studio
```bash
npm run db:studio
```
Ouvrir [https://local.drizzle.studio](https://local.drizzle.studio)

### Stripe CLI (webhook local)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 📚 RESSOURCES

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better-auth](https://better-auth.com)
- [Stripe Docs](https://stripe.com/docs)
- [Yousign API](https://developers.yousign.com)
- [Resend](https://resend.com/docs)
- [Twilio](https://www.twilio.com/docs)

---

## ✅ CHECKLIST AVANT PRODUCTION

- [ ] Configurer toutes les variables d'environnement
- [ ] Tester flow complet (signup → onboarding → dashboard → créer réservation → paiement → signature)
- [ ] Vérifier webhooks Stripe et Yousign
- [ ] Configurer domaine custom
- [ ] Activer SSL
- [ ] Setup Sentry pour monitoring erreurs
- [ ] Activer mode production Stripe
- [ ] RGPD : Mentions légales, politique confidentialité
- [ ] Limiter rate limiting (Vercel ou Upstash)
- [ ] Backup BDD (Neon)

---

## 🎯 ORDRE DE PRIORITÉ RECOMMANDÉ

1. **Auth complète** (API routes + middleware) ← CRITIQUE
2. **Onboarding** (org → team → plan → Stripe) ← CRITIQUE
3. **Dashboard** (KPIs) ← IMPORTANT
4. **CRUD Véhicules** ← IMPORTANT
5. **Créer réservation** (agence) ← IMPORTANT
6. **Lien magique client + paiement** ← IMPORTANT
7. **Génération contrat PDF** ← IMPORTANT
8. **Yousign signature** ← IMPORTANT
9. **Webhooks Stripe/Yousign** ← IMPORTANT
10. **Check-in/out** ← MOYEN
11. **Page Clients** ← MOYEN
12. **Page Paramètres** ← MOYEN
13. **SuperAdmin** ← BAS
14. **Cron jobs** ← BAS

---

## 💡 CONSEILS

1. **Tester au fur et à mesure** : Ne pas attendre d'avoir tout fini pour tester
2. **Commencer simple** : MVP d'abord, features avancées ensuite
3. **Logs partout** : console.log est votre ami
4. **Stripe test mode** : Utiliser cartes de test (4242 4242 4242 4242)
5. **Webhooks locaux** : Utiliser Stripe CLI ou ngrok
6. **DB migrations** : Toujours sauvegarder avant de modifier le schema
7. **Git commit souvent** : Petits commits fréquents

---

## 🤝 SUPPORT

Pour toute question sur l'implémentation :
1. Vérifier la documentation officielle
2. Chercher sur Stack Overflow
3. Tester avec des données de test
4. Utiliser Drizzle Studio pour inspecter la DB

---

**Bon courage pour l'implémentation ! 🚀**

Ce projet est ambitieux mais la structure de base est solide. Suivez l'ordre de priorité et testez chaque feature avant de passer à la suivante.
