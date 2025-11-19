require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config');

async function seedDemoData() {
  let connection;
  
  try {
    // Créer la connexion
    connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      port: config.database.port
    });

    console.log('🌱 Début de l\'insertion des données de démonstration...\n');

    // Données de démonstration pour les bureaux
    const bureaux = [
      {
        nom: 'Bureau Central',
        code: 'BC-MPTMU',
        description: 'Bureau central du Ministère Provincial de Transport et Mobilité Urbaine',
        adresse: 'Avenue de la République, Kinshasa',
        telephone: '+243 999 000 001',
        email: 'bureau.central@mptmu-kinshasa.cd',
        responsable: 'Directeur Général',
        statut: 'actif'
      },
      {
        nom: 'Bureau de Contrôle Routier',
        code: 'BCR-001',
        description: 'Bureau chargé du contrôle et de la régulation du trafic routier',
        adresse: 'Boulevard du 30 Juin, Kinshasa',
        telephone: '+243 999 000 002',
        email: 'controle.routier@mptmu-kinshasa.cd',
        responsable: 'Chef de Service Contrôle',
        statut: 'actif'
      },
      {
        nom: 'Bureau de Sécurité Routière',
        code: 'BSR-001',
        description: 'Bureau dédié à la sécurité et à la prévention routière',
        adresse: 'Avenue Kasa-Vubu, Kinshasa',
        telephone: '+243 999 000 003',
        email: 'securite.routiere@mptmu-kinshasa.cd',
        responsable: 'Chef de Service Sécurité',
        statut: 'actif'
      },
      {
        nom: 'Bureau de Transport Public',
        code: 'BTP-001',
        description: 'Bureau de gestion du transport public et des transports en commun',
        adresse: 'Avenue de la Démocratie, Kinshasa',
        telephone: '+243 999 000 004',
        email: 'transport.public@mptmu-kinshasa.cd',
        responsable: 'Chef de Service Transport',
        statut: 'actif'
      },
      {
        nom: 'Bureau de Permis de Conduire',
        code: 'BPC-001',
        description: 'Bureau d\'émission et de gestion des permis de conduire',
        adresse: 'Avenue Batetela, Kinshasa',
        telephone: '+243 999 000 005',
        email: 'permis.conduire@mptmu-kinshasa.cd',
        responsable: 'Chef de Service Permis',
        statut: 'actif'
      }
    ];

    // Insérer les bureaux
    console.log('📁 Insertion des bureaux...');
    const bureauIds = [];
    
    for (const bureau of bureaux) {
      try {
        const [result] = await connection.query(
          `INSERT INTO bureaux (nom, code, description, adresse, telephone, email, responsable, statut)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nom = nom`,
          [
            bureau.nom,
            bureau.code,
            bureau.description,
            bureau.adresse,
            bureau.telephone,
            bureau.email,
            bureau.responsable,
            bureau.statut
          ]
        );
        
        if (result.insertId) {
          bureauIds.push(result.insertId);
          console.log(`  ✓ ${bureau.nom} (ID: ${result.insertId})`);
        } else {
          // Si l'insertion a échoué à cause d'un doublon, récupérer l'ID existant
          const [existing] = await connection.query(
            'SELECT id FROM bureaux WHERE nom = ?',
            [bureau.nom]
          );
          if (existing.length > 0) {
            bureauIds.push(existing[0].id);
            console.log(`  ⚠ ${bureau.nom} existe déjà (ID: ${existing[0].id})`);
          }
        }
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          // Récupérer l'ID du bureau existant
          const [existing] = await connection.query(
            'SELECT id FROM bureaux WHERE nom = ?',
            [bureau.nom]
          );
          if (existing.length > 0) {
            bureauIds.push(existing[0].id);
            console.log(`  ⚠ ${bureau.nom} existe déjà (ID: ${existing[0].id})`);
          }
        } else {
          console.error(`  ✗ Erreur lors de l'insertion de ${bureau.nom}:`, error.message);
        }
      }
    }

    // Récupérer tous les IDs des bureaux pour les cellules
    const [allBureaux] = await connection.query('SELECT id, nom FROM bureaux ORDER BY id');
    const bureauMap = {};
    allBureaux.forEach(b => {
      bureauMap[b.nom] = b.id;
    });

    // Données de démonstration pour les cellules
    const cellules = [
      // Cellules du Bureau Central
      {
        nom: 'Cellule Administration',
        code: 'CEL-ADM-001',
        bureau_id: bureauMap['Bureau Central'],
        description: 'Cellule chargée de l\'administration générale',
        adresse: 'Avenue de la République, Kinshasa',
        telephone: '+243 999 001 001',
        email: 'admin@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Administration',
        statut: 'actif'
      },
      {
        nom: 'Cellule Ressources Humaines',
        code: 'CEL-RH-001',
        bureau_id: bureauMap['Bureau Central'],
        description: 'Cellule de gestion des ressources humaines',
        adresse: 'Avenue de la République, Kinshasa',
        telephone: '+243 999 001 002',
        email: 'rh@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule RH',
        statut: 'actif'
      },
      {
        nom: 'Cellule Finances',
        code: 'CEL-FIN-001',
        bureau_id: bureauMap['Bureau Central'],
        description: 'Cellule de gestion financière',
        adresse: 'Avenue de la République, Kinshasa',
        telephone: '+243 999 001 003',
        email: 'finances@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Finances',
        statut: 'actif'
      },
      // Cellules du Bureau de Contrôle Routier
      {
        nom: 'Cellule Contrôle Matin',
        code: 'CEL-CR-MAT-001',
        bureau_id: bureauMap['Bureau de Contrôle Routier'],
        description: 'Cellule de contrôle routier - Service matin',
        adresse: 'Boulevard du 30 Juin, Kinshasa',
        telephone: '+243 999 002 001',
        email: 'controle.matin@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Contrôle Matin',
        statut: 'actif'
      },
      {
        nom: 'Cellule Contrôle Soir',
        code: 'CEL-CR-SOIR-001',
        bureau_id: bureauMap['Bureau de Contrôle Routier'],
        description: 'Cellule de contrôle routier - Service soir',
        adresse: 'Boulevard du 30 Juin, Kinshasa',
        telephone: '+243 999 002 002',
        email: 'controle.soir@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Contrôle Soir',
        statut: 'actif'
      },
      {
        nom: 'Cellule Contrôle Nuit',
        code: 'CEL-CR-NUIT-001',
        bureau_id: bureauMap['Bureau de Contrôle Routier'],
        description: 'Cellule de contrôle routier - Service nuit',
        adresse: 'Boulevard du 30 Juin, Kinshasa',
        telephone: '+243 999 002 003',
        email: 'controle.nuit@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Contrôle Nuit',
        statut: 'actif'
      },
      // Cellules du Bureau de Sécurité Routière
      {
        nom: 'Cellule Prévention',
        code: 'CEL-SR-PREV-001',
        bureau_id: bureauMap['Bureau de Sécurité Routière'],
        description: 'Cellule de prévention et sensibilisation routière',
        adresse: 'Avenue Kasa-Vubu, Kinshasa',
        telephone: '+243 999 003 001',
        email: 'prevention@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Prévention',
        statut: 'actif'
      },
      {
        nom: 'Cellule Intervention',
        code: 'CEL-SR-INT-001',
        bureau_id: bureauMap['Bureau de Sécurité Routière'],
        description: 'Cellule d\'intervention d\'urgence routière',
        adresse: 'Avenue Kasa-Vubu, Kinshasa',
        telephone: '+243 999 003 002',
        email: 'intervention@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Intervention',
        statut: 'actif'
      },
      // Cellules du Bureau de Transport Public
      {
        nom: 'Cellule Taxis',
        code: 'CEL-TP-TAXI-001',
        bureau_id: bureauMap['Bureau de Transport Public'],
        description: 'Cellule de gestion des taxis',
        adresse: 'Avenue de la Démocratie, Kinshasa',
        telephone: '+243 999 004 001',
        email: 'taxis@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Taxis',
        statut: 'actif'
      },
      {
        nom: 'Cellule Bus',
        code: 'CEL-TP-BUS-001',
        bureau_id: bureauMap['Bureau de Transport Public'],
        description: 'Cellule de gestion des bus et transports en commun',
        adresse: 'Avenue de la Démocratie, Kinshasa',
        telephone: '+243 999 004 002',
        email: 'bus@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Bus',
        statut: 'actif'
      },
      {
        nom: 'Cellule Moto-Taxis',
        code: 'CEL-TP-MOTO-001',
        bureau_id: bureauMap['Bureau de Transport Public'],
        description: 'Cellule de gestion des moto-taxis',
        adresse: 'Avenue de la Démocratie, Kinshasa',
        telephone: '+243 999 004 003',
        email: 'moto-taxis@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Moto-Taxis',
        statut: 'actif'
      },
      // Cellules du Bureau de Permis de Conduire
      {
        nom: 'Cellule Examens',
        code: 'CEL-PC-EXAM-001',
        bureau_id: bureauMap['Bureau de Permis de Conduire'],
        description: 'Cellule d\'organisation des examens de conduite',
        adresse: 'Avenue Batetela, Kinshasa',
        telephone: '+243 999 005 001',
        email: 'examens@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Examens',
        statut: 'actif'
      },
      {
        nom: 'Cellule Émission',
        code: 'CEL-PC-EMIS-001',
        bureau_id: bureauMap['Bureau de Permis de Conduire'],
        description: 'Cellule d\'émission des permis de conduire',
        adresse: 'Avenue Batetela, Kinshasa',
        telephone: '+243 999 005 002',
        email: 'emission@mptmu-kinshasa.cd',
        responsable: 'Chef de Cellule Émission',
        statut: 'actif'
      }
    ];

    // Insérer les cellules
    console.log('\n📋 Insertion des cellules...');
    let cellulesCount = 0;
    
    for (const cellule of cellules) {
      try {
        if (!cellule.bureau_id) {
          console.log(`  ⚠ ${cellule.nom} - Bureau non trouvé, ignorée`);
          continue;
        }

        const [result] = await connection.query(
          `INSERT INTO cellules (nom, code, bureau_id, description, adresse, telephone, email, responsable, statut)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nom = nom`,
          [
            cellule.nom,
            cellule.code,
            cellule.bureau_id,
            cellule.description,
            cellule.adresse,
            cellule.telephone,
            cellule.email,
            cellule.responsable,
            cellule.statut
          ]
        );
        
        if (result.insertId || result.affectedRows > 0) {
          cellulesCount++;
          console.log(`  ✓ ${cellule.nom}`);
        } else {
          console.log(`  ⚠ ${cellule.nom} existe déjà`);
        }
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠ ${cellule.nom} existe déjà`);
        } else {
          console.error(`  ✗ Erreur lors de l'insertion de ${cellule.nom}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Données de démonstration insérées avec succès !`);
    console.log(`   - ${bureaux.length} bureaux`);
    console.log(`   - ${cellulesCount} cellules\n`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le script
seedDemoData()
  .then(() => {
    console.log('✨ Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

