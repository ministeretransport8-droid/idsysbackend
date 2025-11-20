# Configuration Cloudinary

## Problème actuel

L'erreur `Invalid cloud_name root` indique que les credentials Cloudinary ne sont pas correctement configurés.

## Solution

### 1. Créer un compte Cloudinary (si vous n'en avez pas)

1. Allez sur https://cloudinary.com
2. Créez un compte gratuit
3. Une fois connecté, allez dans le Dashboard

### 2. Obtenir vos credentials

Dans le Dashboard Cloudinary, vous trouverez :
- **Cloud Name** : Votre nom de cloud (ex: `dxyz1234`)
- **API Key** : Votre clé API (ex: `123456789012345`)
- **API Secret** : Votre secret API (ex: `abcdefghijklmnopqrstuvwxyz`)

### 3. Configurer dans votre projet

**Option A : Via le fichier `.env` (recommandé)**

Ajoutez ces lignes dans votre fichier `.env` :

```env
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

**Option B : Via le fichier `config.json`**

Modifiez la section `cloudinary` dans `config.json` :

```json
{
  "cloudinary": {
    "cloud_name": "votre_cloud_name",
    "api_key": "votre_api_key",
    "api_secret": "votre_api_secret"
  }
}
```

### 4. Redémarrer le serveur

Après avoir configuré les credentials, redémarrez le serveur :

```bash
npm start
```

## Vérification

Le serveur affichera un message de confirmation si la configuration est correcte :
```
✓ Cloudinary configuré avec cloud_name: votre_cloud_name
```

Si vous voyez une erreur, vérifiez que :
- Les trois variables sont bien définies
- Le `cloud_name` n'est pas "root" ou vide
- Les credentials sont corrects

## Sécurité

⚠️ **IMPORTANT** : Ne commitez jamais vos credentials dans Git !
- Utilisez `.env` et ajoutez-le à `.gitignore`
- Ne mettez pas de vraies credentials dans `config.json` si vous le commitez

