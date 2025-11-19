# Système de Migrations

Ce dossier contient les migrations SQL pour gérer l'évolution du schéma de la base de données.

## 📋 Structure

Les fichiers de migration sont nommés avec un numéro séquentiel suivi d'une description :
- `001_create_migrations_table.sql` - Crée la table de suivi des migrations
- `002_create_agents_table.sql` - Crée la table agents

## 🚀 Utilisation

### Exécuter toutes les migrations en attente

```bash
npm run migrate
```

### Vérifier l'état des migrations

```bash
npm run migrate:status
```

## 📝 Créer une nouvelle migration

1. Créer un nouveau fichier SQL dans le dossier `migrations/` avec le format :
   ```
   XXX_description.sql
   ```
   où `XXX` est le numéro séquentiel suivant le dernier fichier.

2. Écrire le SQL de la migration dans le fichier :
   ```sql
   -- Migration: Description de la migration
   -- Date: YYYY-MM-DD

   -- Votre SQL ici
   ALTER TABLE agents ADD COLUMN nouvelle_colonne VARCHAR(255);
   ```

3. Exécuter les migrations :
   ```bash
   npm run migrate
   ```

## ⚠️ Bonnes Pratiques

1. **Ne jamais modifier** une migration déjà exécutée
2. **Toujours créer** une nouvelle migration pour les modifications
3. **Tester** les migrations sur une base de données de test avant la production
4. **Sauvegarder** la base de données avant d'exécuter des migrations en production
5. **Utiliser des transactions** dans les migrations complexes (géré automatiquement)

## 🔄 Rollback

Le système actuel ne gère pas automatiquement le rollback. Pour annuler une migration :

1. Créer une nouvelle migration qui inverse les changements
2. Ou restaurer depuis une sauvegarde

## 📊 Table de Suivi

Le système utilise une table `migrations` pour suivre les migrations exécutées :

```sql
CREATE TABLE migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Cette table est créée automatiquement lors de la première exécution des migrations.

