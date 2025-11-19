# 👥 API CRUD Utilisateurs

## Vue d'ensemble

Le système de gestion des utilisateurs permet de créer, lire, mettre à jour et supprimer des utilisateurs avec gestion des rôles et des permissions.

**Base URL:** `/api/utilisateurs`

**Authentification:** Toutes les routes nécessitent un token JWT (sauf mention contraire)

---

## 📋 Endpoints Disponibles

### 1. **POST `/api/utilisateurs`** - Créer un utilisateur

Crée un nouvel utilisateur dans le système.

**Authentification:** ✅ Requis (Admin uniquement)

**Request Body:**
```json
{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "password": "MotDePasse123!",
  "nom": "Doe",
  "prenom": "John",
  "role": "user",
  "telephone": "+243 999 000 000",
  "statut": "actif"
}
```

**Champs requis:**
- `username` (string, unique)
- `email` (string, unique)
- `password` (string)
- `nom` (string)
- `prenom` (string)

**Champs optionnels:**
- `role` (string, défaut: "user") - "admin" ou "user"
- `telephone` (string)
- `statut` (string, défaut: "actif") - "actif" ou "inactif"

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "john.doe",
    "email": "john.doe@example.com"
  }
}
```

**Erreurs possibles:**
- `400` - Champs requis manquants
- `401` - Non authentifié
- `403` - Pas les permissions admin
- `409` - Username ou email déjà existant
- `500` - Erreur serveur

---

### 2. **GET `/api/utilisateurs`** - Obtenir tous les utilisateurs

Récupère la liste de tous les utilisateurs (sans les mots de passe).

**Authentification:** ✅ Requis

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@mptmu-kinshasa.cd",
      "nom": "Administrateur",
      "prenom": "Système",
      "role": "admin",
      "telephone": "+243 999 000 000",
      "statut": "actif",
      "date_creation": "2025-11-08T12:14:21.000Z",
      "date_modification": "2025-11-08T12:14:21.000Z",
      "derniere_connexion": "2025-11-08T12:20:00.000Z"
    },
    {
      "id": 2,
      "username": "john.doe",
      "email": "john.doe@example.com",
      "nom": "Doe",
      "prenom": "John",
      "role": "user",
      "telephone": "+243 999 000 001",
      "statut": "actif",
      "date_creation": "2025-11-08T13:00:00.000Z",
      "date_modification": "2025-11-08T13:00:00.000Z",
      "derniere_connexion": null
    }
  ]
}
```

**Erreurs possibles:**
- `401` - Non authentifié
- `500` - Erreur serveur

---

### 3. **GET `/api/utilisateurs/:id`** - Obtenir un utilisateur par ID

Récupère les informations détaillées d'un utilisateur spécifique.

**Authentification:** ✅ Requis

**Paramètres:**
- `id` (integer) - ID de l'utilisateur

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
    "date_modification": "2025-11-08T12:14:21.000Z",
    "derniere_connexion": "2025-11-08T12:20:00.000Z"
  }
}
```

**Erreurs possibles:**
- `400` - ID invalide
- `401` - Non authentifié
- `404` - Utilisateur non trouvé
- `500` - Erreur serveur

---

### 4. **PUT `/api/utilisateurs/:id`** - Mettre à jour un utilisateur (complet)

Met à jour tous les champs fournis d'un utilisateur.

**Authentification:** ✅ Requis (Admin ou propriétaire du compte)

**Paramètres:**
- `id` (integer) - ID de l'utilisateur

**Request Body:**
```json
{
  "username": "john.doe.updated",
  "email": "john.doe.updated@example.com",
  "password": "NouveauMotDePasse123!",
  "nom": "Doe",
  "prenom": "John",
  "role": "user",
  "telephone": "+243 999 000 002",
  "statut": "actif"
}
```

**Permissions:**
- **Admin** : Peut modifier n'importe quel utilisateur
- **User** : Peut modifier uniquement son propre compte

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "updated": true
  }
}
```

**Erreurs possibles:**
- `400` - ID invalide
- `401` - Non authentifié
- `403` - Pas la permission de modifier cet utilisateur
- `404` - Utilisateur non trouvé
- `409` - Username ou email déjà existant
- `500` - Erreur serveur

---

### 5. **PATCH `/api/utilisateurs/:id`** - Mettre à jour un utilisateur (partiel)

Met à jour uniquement les champs fournis d'un utilisateur.

**Authentification:** ✅ Requis (Admin ou propriétaire du compte)

**Paramètres:**
- `id` (integer) - ID de l'utilisateur

**Request Body (exemple):**
```json
{
  "telephone": "+243 999 000 003",
  "statut": "inactif"
}
```

**Permissions:**
- **Admin** : Peut modifier n'importe quel utilisateur et le rôle
- **User** : Peut modifier uniquement son propre compte (sauf le rôle)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "updated": true
  }
}
```

**Erreurs possibles:**
- `400` - ID invalide ou aucun champ à mettre à jour
- `401` - Non authentifié
- `403` - Pas la permission de modifier cet utilisateur ou le rôle
- `404` - Utilisateur non trouvé
- `409` - Username ou email déjà existant
- `500` - Erreur serveur

---

### 6. **DELETE `/api/utilisateurs/:id`** - Supprimer un utilisateur

Supprime un utilisateur de la base de données.

**Authentification:** ✅ Requis (Admin uniquement)

**Paramètres:**
- `id` (integer) - ID de l'utilisateur

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
```

**Erreurs possibles:**
- `400` - ID invalide
- `401` - Non authentifié
- `403` - Pas les permissions admin
- `404` - Utilisateur non trouvé
- `500` - Erreur serveur

---

## 🔐 Permissions et Rôles

### Rôles disponibles
- **`admin`** - Administrateur avec tous les droits
- **`user`** - Utilisateur standard avec droits limités

### Matrice des permissions

| Action | Admin | User (propre compte) | User (autre compte) |
|--------|-------|---------------------|---------------------|
| Créer utilisateur | ✅ | ❌ | ❌ |
| Voir tous les utilisateurs | ✅ | ✅ | ✅ |
| Voir un utilisateur | ✅ | ✅ | ✅ |
| Modifier un utilisateur | ✅ | ✅ | ❌ |
| Modifier le rôle | ✅ | ❌ | ❌ |
| Supprimer un utilisateur | ✅ | ❌ | ❌ |

---

## 📝 Exemples d'utilisation

### Exemple 1: Créer un utilisateur (Admin)

```bash
# 1. Se connecter en tant qu'admin
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin2024!"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

# 2. Créer un nouvel utilisateur
curl -X POST http://localhost:5003/api/utilisateurs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "email": "john.doe@example.com",
    "password": "MotDePasse123!",
    "nom": "Doe",
    "prenom": "John",
    "role": "user",
    "telephone": "+243 999 000 000"
  }'
```

### Exemple 2: Mettre à jour son propre profil (User)

```bash
# 1. Se connecter en tant qu'utilisateur
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john.doe","password":"MotDePasse123!"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

# 2. Mettre à jour son téléphone
curl -X PATCH http://localhost:5003/api/utilisateurs/2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "+243 999 111 222"
  }'
```

### Exemple 3: Lister tous les utilisateurs

```bash
curl -X GET http://localhost:5003/api/utilisateurs \
  -H "Authorization: Bearer $TOKEN"
```

### Exemple 4: Obtenir un utilisateur spécifique

```bash
curl -X GET http://localhost:5003/api/utilisateurs/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Exemple 5: Supprimer un utilisateur (Admin uniquement)

```bash
curl -X DELETE http://localhost:5003/api/utilisateurs/2 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔒 Sécurité

- **Mots de passe** : Hashés avec `crypto.pbkdf2Sync` (salt + hash)
- **Tokens JWT** : Requis pour toutes les opérations
- **Validation** : Vérification des doublons (username, email)
- **Permissions** : Vérification des rôles et propriété du compte
- **Statut** : Seuls les utilisateurs actifs peuvent se connecter

---

## ⚠️ Notes importantes

1. **Mots de passe** : Les mots de passe sont automatiquement hashés lors de la création et de la mise à jour. Ils ne sont jamais retournés dans les réponses.

2. **Rôle** : Seuls les administrateurs peuvent modifier le rôle d'un utilisateur.

3. **Suppression** : La suppression est définitive. Assurez-vous de vouloir supprimer un utilisateur avant d'exécuter cette action.

4. **Statut** : Les utilisateurs avec le statut "inactif" ne peuvent pas se connecter.

5. **Doublons** : Le système vérifie automatiquement que le username et l'email sont uniques.

---

## 📚 Endpoints liés

Pour l'authentification, voir aussi :
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/verify` - Vérifier un token
- `GET /api/auth/me` - Informations de l'utilisateur connecté

Voir le fichier `AUTHENTICATION.md` pour plus de détails.

