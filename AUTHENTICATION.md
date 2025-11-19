# 🔐 Système d'Authentification

## Vue d'ensemble

Le système d'authentification utilise **JWT (JSON Web Tokens)** pour sécuriser l'API. Les utilisateurs s'authentifient avec leur username/email et mot de passe, et reçoivent un token JWT valide pendant 24 heures.

## 📋 Endpoints d'Authentification

### 1. **POST `/api/auth/login`** - Connexion

Authentifie un utilisateur et retourne un token JWT.

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin2024!"
}
```

ou

```json
{
  "email": "admin@mptmu-kinshasa.cd",
  "password": "Admin2024!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Authentification réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@mptmu-kinshasa.cd",
      "nom": "Administrateur",
      "prenom": "Système",
      "role": "admin",
      "telephone": "+243 999 000 000",
      "statut": "actif"
    }
  }
}
```

### 2. **POST `/api/auth/verify`** - Vérifier un token

Vérifie si un token JWT est valide.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@mptmu-kinshasa.cd",
      "nom": "Administrateur",
      "prenom": "Système",
      "role": "admin"
    }
  }
}
```

### 3. **GET `/api/auth/me`** - Informations de l'utilisateur connecté

Récupère les informations de l'utilisateur actuellement authentifié.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@mptmu-kinshasa.cd",
    "nom": "Administrateur",
    "prenom": "Système",
    "role": "admin",
    "telephone": "+243 999 000 000",
    "statut": "actif",
    "date_creation": "2025-11-08T12:14:21.000Z",
    "derniere_connexion": "2025-11-08T12:20:00.000Z"
  }
}
```

## 🔒 Utilisation du Token

Pour accéder aux routes protégées, incluez le token dans le header `Authorization` :

```
Authorization: Bearer <votre_token_jwt>
```

**Exemple avec curl:**
```bash
curl -X GET http://localhost:5003/api/utilisateurs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🛡️ Middleware d'Authentification

### `authenticate`
Vérifie que l'utilisateur est authentifié et ajoute les informations de l'utilisateur à `req.user`.

**Utilisation:**
```javascript
const { authenticate } = require('../middleware/auth');

router.get('/protected', authenticate, (req, res) => {
  // req.user contient les informations de l'utilisateur
  res.json({ user: req.user });
});
```

### `requireAdmin`
Vérifie que l'utilisateur est authentifié ET a le rôle `admin`.

**Utilisation:**
```javascript
const { authenticate, requireAdmin } = require('../middleware/auth');

router.delete('/admin-only', authenticate, requireAdmin, (req, res) => {
  // Seuls les admins peuvent accéder
});
```

### `requireRole(...roles)`
Vérifie que l'utilisateur a l'un des rôles spécifiés.

**Utilisation:**
```javascript
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/manager-only', authenticate, requireRole('admin', 'manager'), (req, res) => {
  // Seuls les admins et managers peuvent accéder
});
```

## 📊 Routes Protégées

### Routes Utilisateurs

- **POST `/api/utilisateurs`** - Créer un utilisateur (Admin uniquement)
- **GET `/api/utilisateurs`** - Liste des utilisateurs (Authentifié)
- **GET `/api/utilisateurs/:id`** - Détails d'un utilisateur (Authentifié)
- **PUT `/api/utilisateurs/:id`** - Mettre à jour (Admin ou propriétaire)
- **PATCH `/api/utilisateurs/:id`** - Mettre à jour partielle (Admin ou propriétaire)
- **DELETE `/api/utilisateurs/:id`** - Supprimer (Admin uniquement)

### Permissions

- **Admin** : Accès complet à toutes les fonctionnalités
- **User** : Peut modifier uniquement son propre compte (sauf le rôle)

## 🔑 Rôles Disponibles

- `admin` - Administrateur avec tous les droits
- `user` - Utilisateur standard avec droits limités

## ⚙️ Configuration

Le secret JWT est défini dans :
1. Variable d'environnement `JWT_SECRET`
2. Sinon, utilise `config.security.dbEncryptionKey`
3. Sinon, utilise la valeur par défaut `'IdTrackSecretKey2024'`

**Durée de validité du token :** 24 heures (configurable via `JWT_EXPIRES_IN`)

## 🔐 Sécurité

- Les mots de passe sont hashés avec `crypto.pbkdf2Sync` (salt + hash)
- Les tokens JWT sont signés avec un secret
- Vérification de l'état actif de l'utilisateur à chaque requête
- Les tokens expirent automatiquement après 24h

## 📝 Exemple d'Utilisation Complète

```bash
# 1. Se connecter
curl -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin2024!"}'

# Réponse contient le token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Utiliser le token pour accéder aux routes protégées
curl -X GET http://localhost:5003/api/utilisateurs \
  -H "Authorization: Bearer $TOKEN"

# 3. Obtenir ses propres informations
curl -X GET http://localhost:5003/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## ⚠️ Gestion des Erreurs

### 401 Unauthorized
- Token manquant
- Token invalide
- Token expiré
- Utilisateur non trouvé ou désactivé

### 403 Forbidden
- Rôle insuffisant
- Tentative de modification d'un autre utilisateur (non-admin)
- Tentative de modification du rôle (non-admin)

## 🚀 Utilisateur Administrateur par Défaut

Un utilisateur administrateur est créé automatiquement :

- **Username:** `admin`
- **Email:** `admin@mptmu-kinshasa.cd`
- **Password:** `Admin2024!`
- **Role:** `admin`

**⚠️ IMPORTANT:** Changez le mot de passe après la première connexion !

Pour créer/réinitialiser l'admin :
```bash
npm run seed:admin
```

