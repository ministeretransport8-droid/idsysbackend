require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config');
const Database = require('../database/database');

async function seedAdminUser() {
  let connection;
  
  try {
    // Initialiser la base de données
    await Database.init();

    console.log('🌱 Création de l\'utilisateur administrateur...\n');

    // Données de l'administrateur par défaut
    const adminData = {
      username: 'admin',
      email: 'admin@mptmu-kinshasa.cd',
      password: 'Admin2024!',
      nom: 'Administrateur',
      prenom: 'Système',
      role: 'admin',
      telephone: '+243 999 000 000',
      statut: 'actif'
    };

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await Database.getUtilisateurByUsername(adminData.username);
    
    if (existingUser) {
      console.log('⚠️  L\'utilisateur administrateur existe déjà.');
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}\n`);
      
      // Demander si on veut mettre à jour le mot de passe
      console.log('💡 Pour mettre à jour le mot de passe, utilisez l\'endpoint PUT /api/utilisateurs/:id\n');
      return;
    }

    // Créer l'utilisateur administrateur
    const result = await Database.createUtilisateur(adminData);

    console.log('✅ Utilisateur administrateur créé avec succès !\n');
    console.log('📋 Informations de connexion :');
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Role: ${adminData.role}\n`);
    console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion !\n');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur administrateur:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
seedAdminUser()
  .then(() => {
    console.log('✨ Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

