# IdTrack Backend

Backend Node.js pour IdTrack - Système d'Identification des Agents Terrain

## Description

Système de gestion et d'identification des agents du Ministère Provincial de Transport et Mobilité Urbaine - Kinshasa.

## Technologies

- Node.js
- Express.js
- MySQL
- JWT (Authentification)
- PDF-lib (Génération de cartes)
- QRCode

## Installation

```bash
npm install
```

## Configuration

1. Copier `.env.example` vers `.env`
2. Configurer les variables d'environnement dans `.env`
3. Exécuter les migrations : `npm run migrate`

## Démarrage

```bash
npm start
```

## Scripts disponibles

- `npm start` - Démarrer le serveur
- `npm run dev` - Mode développement avec nodemon
- `npm run migrate` - Exécuter les migrations
- `npm run seed:demo` - Ajouter des données de démonstration
- `npm run seed:admin` - Créer l'utilisateur administrateur
- `npm run export:db` - Exporter la base de données en SQL

## API

Le serveur démarre sur le port 5003 par défaut.

Base URL: `http://localhost:5003/api`

## Documentation

- `AUTHENTICATION.md` - Documentation du système d'authentification
- `UTILISATEURS_API.md` - Documentation de l'API utilisateurs

## Auteur

Ministère Provincial de Transport et Mobilité Urbaine - Kinshasa

