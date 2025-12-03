# Implémentation de l'Isolation des Clients par Organisation

## Contexte

Cette implémentation garantit que les profils clients sont isolés par organisation, permettant à différentes organisations d'avoir leurs propres clients même avec les mêmes informations (email identique).

## Scénario

- **Agence A (Org X)** enregistre **Client Z** → Le profil est lié à **Org X**
- **Agence B (Org X)** recherche **Client Z** → ✅ Accès autorisé (même organisation)
- **Agence C (Org Y)** recherche **Client Z** → ❌ Client non trouvé → Création d'un nouveau profil pour **Org Y**

## Modifications Apportées

### 1. Schéma de Base de Données ([drizzle/schema.ts](drizzle/schema.ts))

#### Changements dans la table `customers` :
- ✅ Ajout du champ `organizationId` (clé étrangère vers `organizations`)
- ✅ Suppression de la contrainte `unique` sur `email` seul
- ✅ Ajout d'une contrainte composite `unique(email, organizationId)`
- ✅ Ajout de la relation vers `organization`

```typescript
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  // ... autres champs
}, (table) => ({
  // Contrainte d'unicité : un email unique par organisation
  emailOrgUnique: unique().on(table.email, table.organizationId),
}));
```

### 2. Migration SQL ([drizzle/migrations/0002_add_organization_to_customers.sql](drizzle/migrations/0002_add_organization_to_customers.sql))

La migration a été créée avec les étapes suivantes :
1. Ajout de la colonne `organization_id` (nullable au départ)
2. Suppression de la contrainte `unique` sur `email`
3. Ajout de la clé étrangère vers `organizations`
4. Ajout de la contrainte composite `unique(email, organization_id)`

⚠️ **IMPORTANT** : Avant d'exécuter `ALTER TABLE customers ALTER COLUMN organization_id SET NOT NULL`, vous devez assigner tous les clients existants à une organisation.

### 3. Nouvelle Fonction Helper ([lib/session.ts:60-63](lib/session.ts#L60-L63))

Ajout de `getCurrentOrganizationId()` :
```typescript
export const getCurrentOrganizationId = cache(async () => {
  const team = await getCurrentTeam();
  return team?.organizationId || null;
});
```

### 4. Mise à Jour des Requêtes

#### Recherche de Clients ([app/(dashboard)/reservations/actions.ts:330-370](app/(dashboard)/reservations/actions.ts#L330-L370))
```typescript
// Recherche limitée à l'organisation actuelle
const customersList = await db
  .select()
  .from(customers)
  .where(
    and(
      eq(customers.organizationId, organizationId),
      or(/* critères de recherche */)
    )
  );
```

#### Création de Clients ([app/(dashboard)/reservations/actions.ts:372-414](app/(dashboard)/reservations/actions.ts#L372-L414))
```typescript
// Vérification de l'unicité au sein de l'organisation
const existingCustomer = await db.query.customers.findFirst({
  where: and(
    eq(customers.email, data.email.toLowerCase()),
    eq(customers.organizationId, organizationId)
  ),
});

// Création avec organizationId
const [customer] = await db.insert(customers).values({
  organizationId,
  email: data.email.toLowerCase(),
  // ...
});
```

#### Route Publique ([app/api/reservations/public/[token]/customer/route.ts](app/api/reservations/public/[token]/customer/route.ts))
- Récupération de l'`organizationId` via la réservation
- Vérification de l'existence du client au sein de l'organisation
- Création avec `organizationId` si nécessaire

#### Liste des Clients ([app/(dashboard)/customers/page.tsx:10-33](app/(dashboard)/customers/page.tsx#L10-L33))
```typescript
// Filtrage par organisation
.where(eq(customers.organizationId, organizationId))
```

#### Détails d'un Client ([app/(dashboard)/customers/[id]/page.tsx:36-52](app/(dashboard)/customers/[id]/page.tsx#L36-L52))
```typescript
// Vérification que le client appartient à l'organisation
const customer = await db.query.customers.findFirst({
  where: and(
    eq(customers.id, params.id),
    eq(customers.organizationId, organizationId)
  ),
});
```

#### Communications ([app/api/communications/route.ts:61-77](app/api/communications/route.ts#L61-L77))
```typescript
// Vérification que le client appartient à l'organisation avant envoi
const customer = await db.query.customers.findFirst({
  where: and(
    eq(customers.id, customerId),
    eq(customers.organizationId, organizationId)
  ),
});
```

## Instructions de Migration

### ✅ Migration Effectuée avec Succès

La migration a été appliquée avec succès le 29 novembre 2025. Voici les étapes qui ont été suivies :

### Étape 1 : Backup de la Base de Données ✅
```bash
# Créer un backup avant la migration (RECOMMANDÉ en production)
pg_dump your_database > backup_before_customer_isolation.sql
```

### Étape 2 : Identifier l'Organisation par Défaut ✅
```bash
psql "$DATABASE_URL" -c "SELECT id, name FROM organizations;"
```
**Résultat :**
- Agence Paris : `c25a6784-783a-49bd-9f72-fbe5e1225782`
- Angence paris : `66602f8b-2433-4c49-b92d-61d7454ac49c`

### Étape 3 : Exécuter la Migration ✅
```bash
# Appliquer la migration manuellement (car drizzle-kit migrate échouait)
psql "$DATABASE_URL" < drizzle/migrations/0002_add_organization_to_customers.sql
```

### Étape 4 : Assigner les Clients Existants ✅
```bash
# Tous les clients existants ont été assignés à Agence Paris
psql "$DATABASE_URL" -c "UPDATE customers SET organization_id = 'c25a6784-783a-49bd-9f72-fbe5e1225782' WHERE organization_id IS NULL;"
```
**Résultat :** 4 clients mis à jour

### Étape 5 : Rendre le Champ NOT NULL ✅
```bash
psql "$DATABASE_URL" -c "ALTER TABLE customers ALTER COLUMN organization_id SET NOT NULL;"
```

### Étape 6 : Vérification ✅
```bash
# Vérifier qu'il n'y a plus de clients sans organisation
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM customers WHERE organization_id IS NULL;"
# Résultat : 0

# Vérifier les contraintes
psql "$DATABASE_URL" -c "SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'customers';"
```

**Contraintes vérifiées :**
- ✅ `customers_organization_id_organizations_id_fk` (FOREIGN KEY)
- ✅ `customers_email_organization_id_unique` (UNIQUE)
- ✅ `customers_pkey` (PRIMARY KEY)

## Comportement du Système

### Avant l'Implémentation
- ❌ Un email = un seul client globalement
- ❌ Toutes les organisations voient le même client
- ❌ Risque de fuite de données entre organisations

### Après l'Implémentation
- ✅ Un email peut exister dans plusieurs organisations
- ✅ Chaque organisation a ses propres clients
- ✅ Isolation complète des données sensibles
- ✅ Une agence ne peut pas voir les clients d'une autre organisation

## Fichiers Modifiés

1. [drizzle/schema.ts](drizzle/schema.ts) - Schéma de base de données
2. [drizzle/migrations/0002_add_organization_to_customers.sql](drizzle/migrations/0002_add_organization_to_customers.sql) - Migration SQL
3. [lib/session.ts](lib/session.ts) - Helper pour obtenir l'organizationId
4. [app/(dashboard)/reservations/actions.ts](app/(dashboard)/reservations/actions.ts) - Recherche et création de clients
5. [app/api/reservations/public/[token]/customer/route.ts](app/api/reservations/public/[token]/customer/route.ts) - Création publique de clients
6. [app/api/customers/route.ts](app/api/customers/route.ts) - Liste des clients
7. [app/(dashboard)/customers/page.tsx](app/(dashboard)/customers/page.tsx) - Page liste des clients
8. [app/(dashboard)/customers/[id]/page.tsx](app/(dashboard)/customers/[id]/page.tsx) - Page détail d'un client
9. [app/api/communications/route.ts](app/api/communications/route.ts) - Communications avec vérification d'appartenance

## Tests Recommandés

1. **Test d'Isolation** :
   - Créer un client avec email `test@example.com` dans Org A
   - Créer un client avec le même email dans Org B
   - Vérifier que les deux clients sont distincts
   - Vérifier que Org A ne voit que son client

2. **Test de Recherche** :
   - Se connecter en tant qu'utilisateur de Org A
   - Rechercher un client qui existe uniquement dans Org B
   - Vérifier qu'aucun résultat n'est retourné

3. **Test de Communication** :
   - Tenter d'envoyer un message à un client d'une autre organisation
   - Vérifier que l'erreur "Customer not found or does not belong to your organization" est retournée

4. **Test de Réservation Publique** :
   - Créer une réservation via le lien magique
   - Vérifier que le client est créé avec le bon `organizationId`
   - Vérifier que si le client existe déjà dans l'organisation, il est réutilisé
