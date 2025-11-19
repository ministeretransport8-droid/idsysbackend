# Dépannage des Migrations

## Erreur: "Access denied for user 'root'@'localhost'"

Cette erreur indique un problème d'authentification MySQL. Voici les solutions :

### 1. Vérifier le fichier .env

Assurez-vous que le fichier `.env` existe et contient les bonnes valeurs :

```bash
cd backend
cat .env
```

Vérifiez notamment :
- `DB_HOST=localhost`
- `DB_USER=root`
- `DB_PASSWORD=votre_mot_de_passe` (ou laissez vide si MySQL n'a pas de mot de passe)
- `DB_NAME=idtrack_db`
- `DB_PORT=3306`

### 2. Si MySQL nécessite un mot de passe

Si votre installation MySQL a un mot de passe pour root, modifiez `.env` :

```env
DB_PASSWORD=votre_mot_de_passe_mysql
```

### 3. Si MySQL n'a pas de mot de passe

Si MySQL n'a pas de mot de passe configuré, vous pouvez :
- Laisser `DB_PASSWORD=` vide dans `.env`
- Ou utiliser `config.json` avec `"password": ""`

### 4. Tester la connexion MySQL manuellement

Testez la connexion depuis le terminal :

```bash
# Avec mot de passe
mysql -u root -p

# Sans mot de passe
mysql -u root
```

### 5. Vérifier que MySQL est en cours d'exécution

```bash
# macOS
brew services list | grep mysql

# Linux
sudo systemctl status mysql

# Ou vérifier le processus
ps aux | grep mysql
```

### 6. Créer un utilisateur MySQL dédié (recommandé)

Pour plus de sécurité, créez un utilisateur dédié :

```sql
CREATE USER 'idtrack_user'@'localhost' IDENTIFIED BY 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON idtrack_db.* TO 'idtrack_user'@'localhost';
FLUSH PRIVILEGES;
```

Puis mettez à jour `.env` :
```env
DB_USER=idtrack_user
DB_PASSWORD=mot_de_passe_securise
```

### 7. Vérifier les permissions

Assurez-vous que l'utilisateur MySQL a les permissions nécessaires :

```sql
SHOW GRANTS FOR 'root'@'localhost';
```

## Autres erreurs courantes

### Erreur: "Can't connect to MySQL server"

- Vérifiez que MySQL est démarré
- Vérifiez le port (par défaut 3306)
- Vérifiez le host (localhost ou 127.0.0.1)

### Erreur: "Unknown database"

La base de données sera créée automatiquement. Si l'erreur persiste, créez-la manuellement :

```sql
CREATE DATABASE idtrack_db;
```

### Erreur: "Table already exists"

Cela signifie que la migration a déjà été exécutée. Vérifiez l'état :

```bash
npm run migrate:status
```

## Commandes utiles

```bash
# Vérifier l'état des migrations
npm run migrate:status

# Exécuter les migrations
npm run migrate

# Voir les logs détaillés
DEBUG=* npm run migrate
```

## Support

Si le problème persiste, vérifiez :
1. Les logs MySQL : `/var/log/mysql/error.log` (Linux) ou `~/Library/Logs/MySQL/` (macOS)
2. La configuration MySQL : `my.cnf` ou `my.ini`
3. Les variables d'environnement : `echo $DB_PASSWORD`

