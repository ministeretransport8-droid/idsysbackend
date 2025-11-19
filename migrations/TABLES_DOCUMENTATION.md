# Documentation des Tables de la Base de Données

## 📊 Vue d'ensemble

La base de données IdTrack contient les tables suivantes :

### Tables Principales

#### 1. `agents`
Table principale contenant toutes les informations des agents terrain.

**Colonnes principales :**
- `id` : Identifiant unique
- `matricule` : Matricule unique de l'agent (ex: MPTMU-KIN-000001)
- `nom`, `prenom` : Nom et prénom
- `sexe`, `date_naissance`, `lieu_naissance`, `nationalite` : Informations personnelles
- `telephone`, `email`, `adresse` : Coordonnées
- `photo` : Photo d'identité (BLOB)
- `categorie` : Catégorie de l'agent
- `bureau`, `cellule` : Affectation
- `grade` : Grade professionnel
- `empreinte_digitale` : Empreinte biométrique
- `document_cni`, `document_carte_electeur` : Documents d'identification (BLOB)
- `qr_code` : Code QR sécurisé
- `uuid` : Identifiant unique universel
- `statut` : Statut (actif/inactif)
- `date_enregistrement` : Date d'enregistrement

**Index :**
- `idx_matricule`, `idx_uuid`, `idx_nom_prenom`, `idx_bureau`, `idx_cellule`, `idx_statut`

---

#### 2. `bureaux`
Normalisation des bureaux pour éviter les doublons.

**Colonnes principales :**
- `id` : Identifiant unique
- `nom` : Nom du bureau (unique)
- `code` : Code du bureau (unique, optionnel)
- `description` : Description
- `adresse`, `telephone`, `email` : Coordonnées
- `responsable` : Nom du responsable
- `statut` : Statut (actif/inactif)
- `date_creation`, `date_modification` : Dates de création/modification

**Index :**
- `idx_nom`, `idx_code`, `idx_statut`

---

#### 3. `cellules`
Normalisation des cellules avec relation aux bureaux.

**Colonnes principales :**
- `id` : Identifiant unique
- `nom` : Nom de la cellule
- `code` : Code de la cellule (optionnel)
- `bureau_id` : Référence au bureau (clé étrangère)
- `description` : Description
- `adresse`, `telephone`, `email` : Coordonnées
- `responsable` : Nom du responsable
- `statut` : Statut (actif/inactif)
- `date_creation`, `date_modification` : Dates de création/modification

**Index :**
- `idx_nom`, `idx_code`, `idx_bureau_id`, `idx_statut`

**Clés étrangères :**
- `bureau_id` → `bureaux(id)`

**Contraintes :**
- `unique_cellule_bureau` : Une cellule ne peut avoir le même nom dans un même bureau

---

#### 4. `categories`
Normalisation des catégories d'agents.

**Colonnes principales :**
- `id` : Identifiant unique
- `nom` : Nom de la catégorie (unique)
- `code` : Code de la catégorie (unique, optionnel)
- `description` : Description
- `niveau_hierarchique` : Niveau hiérarchique (1 = plus haut)
- `statut` : Statut (actif/inactif)
- `date_creation`, `date_modification` : Dates de création/modification

**Index :**
- `idx_nom`, `idx_code`, `idx_statut`

**Catégories par défaut :**
- Chef de bureau (niveau 1)
- Chef de cellule (niveau 2)
- Superviseur (niveau 3)
- Inspecteur (niveau 3)
- Relais terrain (niveau 4)
- Taxateur (niveau 5)
- Contrôleur (niveau 5)

---

### Tables de Support

#### 5. `audit_logs`
Journalisation des actions importantes pour audit et sécurité.

**Colonnes principales :**
- `id` : Identifiant unique
- `action` : Type d'action (CREATE, UPDATE, DELETE, EXPORT, etc.)
- `table_name` : Nom de la table concernée
- `record_id` : ID de l'enregistrement concerné
- `user_ip` : Adresse IP de l'utilisateur
- `user_agent` : User agent du navigateur
- `old_values` : Valeurs avant modification (JSON)
- `new_values` : Valeurs après modification (JSON)
- `description` : Description de l'action
- `created_at` : Date et heure de l'action

**Index :**
- `idx_action`, `idx_table_record`, `idx_created_at`

---

#### 6. `exports`
Suivi des exports de données (CSV, backups, etc.).

**Colonnes principales :**
- `id` : Identifiant unique
- `type_export` : Type d'export (CSV, DATABASE, CARDS, etc.)
- `format` : Format du fichier (CSV, JSON, AES, PDF, etc.)
- `file_path` : Chemin du fichier exporté
- `file_size` : Taille du fichier en octets
- `nombre_enregistrements` : Nombre d'enregistrements exportés
- `statut` : Statut (en_cours, termine, erreur)
- `message_erreur` : Message d'erreur si échec
- `created_by` : Utilisateur qui a créé l'export
- `created_at` : Date de création
- `completed_at` : Date de complétion

**Index :**
- `idx_type_export`, `idx_statut`, `idx_created_at`

---

#### 7. `sessions`
Gestion des sessions utilisateurs pour l'authentification.

**Colonnes principales :**
- `id` : Identifiant unique
- `session_token` : Token de session (unique)
- `user_ip` : Adresse IP de l'utilisateur
- `user_agent` : User agent du navigateur
- `is_active` : Session active ou non
- `expires_at` : Date d'expiration de la session
- `created_at` : Date de création
- `last_activity` : Dernière activité

**Index :**
- `idx_session_token`, `idx_expires_at`, `idx_is_active`

---

#### 8. `migrations`
Table de suivi des migrations (gérée automatiquement).

**Colonnes principales :**
- `id` : Identifiant unique
- `name` : Nom du fichier de migration (unique)
- `executed_at` : Date d'exécution

**Index :**
- `idx_name`

---

## 🔗 Relations entre Tables

```
bureaux (1) ──< (N) cellules
bureaux (1) ──< (N) agents (via champ bureau)
cellules (1) ──< (N) agents (via champ cellule)
categories (1) ──< (N) agents (via champ categorie)
```

## 📝 Notes Importantes

1. **Normalisation** : Les tables `bureaux`, `cellules` et `categories` permettent de normaliser les données et d'éviter les doublons.

2. **Audit** : La table `audit_logs` permet de tracer toutes les actions importantes pour la sécurité et la conformité.

3. **Sessions** : La table `sessions` peut être utilisée pour implémenter un système d'authentification plus robuste avec gestion des sessions.

4. **Exports** : La table `exports` permet de suivre tous les exports effectués, ce qui est utile pour la traçabilité.

5. **Migration future** : Pour utiliser les relations avec `bureaux` et `cellules`, il faudra créer une migration qui ajoute des colonnes `bureau_id` et `cellule_id` à la table `agents` et migrer les données existantes.

## 🚀 Prochaines Étapes Recommandées

1. **Migration des données** : Créer une migration pour migrer les données existantes de `agents.bureau` et `agents.cellule` vers les tables normalisées.

2. **Ajout de clés étrangères** : Ajouter des colonnes `bureau_id` et `cellule_id` à la table `agents` avec des clés étrangères.

3. **Implémentation de l'audit** : Créer des triggers ou des fonctions pour enregistrer automatiquement les actions dans `audit_logs`.

4. **Gestion des sessions** : Implémenter un système d'authentification basé sur la table `sessions`.

