# Configuration avec Variables d'Environnement

Le backend utilise maintenant des variables d'environnement pour la configuration, ce qui est plus sécurisé et flexible.

## 📋 Fichiers de Configuration

- **`.env`** : Fichier de configuration local (non versionné, créé à partir de `.env.example`)
- **`.env.example`** : Template de configuration (versionné)
- **`config.json`** : Configuration de fallback (optionnel, pour compatibilité)

## 🚀 Démarrage Rapide

1. **Copier le fichier d'exemple** :
   ```bash
   cp .env.example .env
   ```

2. **Modifier les variables dans `.env`** selon votre environnement :
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=idtrack_db
   ```

3. **Installer les dépendances** (si pas déjà fait) :
   ```bash
   npm install
   ```

4. **Démarrer le serveur** :
   ```bash
   npm start
   # ou pour le développement
   npm run dev
   ```

## 🔐 Variables d'Environnement

### Application
- `NODE_ENV` : Environnement (development, production)
- `PORT` : Port du serveur (défaut: 3001)

### Base de Données MySQL
- `DB_HOST` : Adresse du serveur MySQL (défaut: localhost)
- `DB_USER` : Utilisateur MySQL (défaut: root)
- `DB_PASSWORD` : Mot de passe MySQL
- `DB_NAME` : Nom de la base de données (défaut: idtrack_db)
- `DB_PORT` : Port MySQL (défaut: 3306)

### Sécurité
- `ADMIN_PASSWORD` : Mot de passe administrateur pour l'authentification
- `DB_ENCRYPTION_KEY` : Clé de chiffrement pour les exports (32+ caractères recommandés)

### Format ID
- `ID_PREFIX` : Préfixe du matricule (défaut: MPTMU-KIN)
- `ID_START_NUMBER` : Numéro de départ (défaut: 1)
- `ID_PADDING` : Nombre de zéros pour le padding (défaut: 6)

### Chemins d'Export
- `EXPORT_CARTES_PATH` : Chemin pour les cartes PDF
- `EXPORT_CSV_PATH` : Chemin pour les exports CSV
- `EXPORT_BACKUP_PATH` : Chemin pour les backups

## 🔄 Priorité de Configuration

Les variables sont chargées dans cet ordre de priorité :

1. **Variables d'environnement** (`.env` ou variables système) - **Priorité la plus haute**
2. **config.json** - Fallback si variable d'environnement absente
3. **Valeurs par défaut** - Si aucune des deux précédentes n'est définie

## ⚠️ Sécurité

- **Ne jamais commiter** le fichier `.env` dans Git
- Le fichier `.env.example` est versionné et sert de template
- En production, utilisez des variables d'environnement système ou un gestionnaire de secrets
- Changez les mots de passe par défaut en production

## 📝 Exemple de Configuration Production

```env
NODE_ENV=production
PORT=3001

DB_HOST=mysql.production.com
DB_USER=idtrack_user
DB_PASSWORD=secure_password_here
DB_NAME=idtrack_prod
DB_PORT=3306

ADMIN_PASSWORD=StrongPassword123!
DB_ENCRYPTION_KEY=VeryLongAndSecureEncryptionKeyForProduction2024

ID_PREFIX=MPTMU-KIN
ID_START_NUMBER=1
ID_PADDING=6
```

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifiez que le fichier `.env` existe
- Vérifiez que toutes les variables requises sont définies
- Vérifiez les logs d'erreur

### Erreur de connexion MySQL
- Vérifiez que MySQL est en cours d'exécution
- Vérifiez les credentials dans `.env`
- Vérifiez que la base de données existe ou peut être créée

### Variables non prises en compte
- Assurez-vous que `dotenv` est installé : `npm install dotenv`
- Vérifiez que `require('dotenv').config()` est appelé au début de `server.js`
- Redémarrez le serveur après modification de `.env`

