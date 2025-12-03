# Test de l'Isolation des Clients par Organisation

## Résultat de la Migration

✅ **Migration appliquée avec succès !**

### État Actuel de la Base de Données

#### Organisations
- **Agence Paris** (ID: `c25a6784-783a-49bd-9f72-fbe5e1225782`)
- **Angence paris** (ID: `66602f8b-2433-4c49-b92d-61d7454ac49c`)

#### Clients Existants
Tous les 4 clients existants ont été assignés à **Agence Paris** :
- `dspro699+1@gmail.com` - Daniel Sumbo
- `daniel@smsbsystem.me` - DAneil erg
- `dspro699@gmail.com` - Daniel Daniel
- `daniel@smbsystem.me` - Daniel Sumbo

#### Contraintes de la Table `customers`
✅ Contrainte de clé étrangère : `customers_organization_id_organizations_id_fk`
✅ Contrainte d'unicité composite : `customers_email_organization_id_unique`
✅ Colonne `organization_id` : **NOT NULL**

## Test Manuel de l'Isolation

### Test 1 : Créer le même client dans deux organisations différentes

```sql
-- Créer un client test dans Agence Paris
INSERT INTO customers (email, first_name, last_name, organization_id)
VALUES ('test@example.com', 'John', 'Doe', 'c25a6784-783a-49bd-9f72-fbe5e1225782');

-- Créer le MÊME client dans Angence paris (devrait réussir)
INSERT INTO customers (email, first_name, last_name, organization_id)
VALUES ('test@example.com', 'John', 'Doe', '66602f8b-2433-4c49-b92d-61d7454ac49c');

-- Vérifier qu'il y a bien 2 clients distincts
SELECT c.email, c.first_name, o.name as organization
FROM customers c
JOIN organizations o ON c.organization_id = o.id
WHERE c.email = 'test@example.com';
```

**Résultat attendu :** 2 lignes retournées, une pour chaque organisation

### Test 2 : Tenter de créer un doublon dans la même organisation

```sql
-- Tenter de créer un doublon dans Agence Paris (devrait échouer)
INSERT INTO customers (email, first_name, last_name, organization_id)
VALUES ('test@example.com', 'Jane', 'Smith', 'c25a6784-783a-49bd-9f72-fbe5e1225782');
```

**Résultat attendu :** Erreur de violation de contrainte unique

### Test 3 : Recherche de clients via l'API

#### Préparation
1. Connectez-vous en tant qu'utilisateur de **Agence Paris**
2. Créez une réservation et ajoutez le client `test@example.com`

#### Test
```bash
# Faire une recherche de client (devrait retourner uniquement le client de Agence Paris)
curl -X GET http://localhost:3000/api/customers \
  -H "Cookie: your-session-cookie"
```

**Résultat attendu :** Le client `test@example.com` de Agence Paris uniquement

### Test 4 : Création de client via le formulaire de réservation

#### Scénario
1. Utilisateur de **Agence Paris** crée une réservation
2. Recherche `test@example.com` dans le sélecteur de client
3. Le client existe déjà dans Agence Paris → devrait être trouvé
4. Le client existe aussi dans Angence paris → ne devrait PAS apparaître

#### Scénario 2
1. Utilisateur de **Angence paris** crée une réservation
2. Recherche `test@example.com`
3. Devrait trouver uniquement le client de Angence paris

## Nettoyage des Tests

```sql
-- Supprimer les clients de test
DELETE FROM customers WHERE email = 'test@example.com';
```

## Checklist de Vérification

- [x] Migration SQL appliquée
- [x] Colonne `organization_id` ajoutée à `customers`
- [x] Contrainte unique `(email, organization_id)` créée
- [x] Contrainte de clé étrangère vers `organizations` créée
- [x] Clients existants assignés à leur organisation
- [x] Colonne `organization_id` rendue NOT NULL
- [ ] Tests manuels de l'isolation effectués
- [ ] Tests de l'API effectués
- [ ] Tests du frontend effectués

## Prochaines Étapes

1. **Tester l'application** : Démarrer le serveur et tester la création/recherche de clients
2. **Vérifier les logs** : S'assurer qu'aucune erreur ne se produit
3. **Tester la création de réservation publique** : Via le lien magique
4. **Déployer en production** : Une fois tous les tests validés

## Commandes Utiles

```bash
# Vérifier les clients par organisation
psql "$DATABASE_URL" -c "
  SELECT o.name, COUNT(c.id) as customer_count
  FROM organizations o
  LEFT JOIN customers c ON o.id = c.organization_id
  GROUP BY o.id, o.name;
"

# Vérifier les contraintes
psql "$DATABASE_URL" -c "
  SELECT constraint_name, constraint_type
  FROM information_schema.table_constraints
  WHERE table_name = 'customers';
"

# Chercher des clients orphelins (ne devrait rien retourner)
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) FROM customers WHERE organization_id IS NULL;
"
```
