require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function migrateBlobsToFiles() {
  let connection;
  
  try {
    console.log('\n🔄 Migration des BLOBs vers fichiers...\n');
    
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password || undefined,
      database: config.database.database,
      port: config.database.port
    });

    console.log('✓ Connexion à la base de données établie\n');

    // Créer les dossiers nécessaires
    const uploadDirs = [
      './uploads',
      './uploads/photos',
      './uploads/documents'
    ];

    uploadDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Dossier créé: ${dir}`);
      }
    });

    // Récupérer tous les agents avec des BLOBs
    const [agents] = await connection.query(
      `SELECT id, matricule, nom, prenom, photo, document_cni, document_carte_electeur 
       FROM agents 
       WHERE photo IS NOT NULL 
          OR document_cni IS NOT NULL 
          OR document_carte_electeur IS NOT NULL`
    );

    console.log(`\n📦 ${agents.length} agent(s) trouvé(s) avec des fichiers BLOB\n`);

    let photosMigrated = 0;
    let documentsMigrated = 0;
    let errors = 0;

    for (const agent of agents) {
      try {
        let updated = false;
        const updates = {};

        // Migrer la photo
        if (agent.photo && Buffer.isBuffer(agent.photo) && agent.photo.length > 0) {
          const photoFilename = `photo-${agent.matricule}-${Date.now()}.jpg`;
          const photoPath = path.join(__dirname, '..', 'uploads', 'photos', photoFilename);
          fs.writeFileSync(photoPath, agent.photo);
          updates.photo = `/uploads/photos/${photoFilename}`;
          photosMigrated++;
          updated = true;
          console.log(`  ✓ Photo migrée pour ${agent.matricule} (${agent.nom} ${agent.prenom})`);
        }

        // Migrer le document CNI
        if (agent.document_cni && Buffer.isBuffer(agent.document_cni) && agent.document_cni.length > 0) {
          const cniFilename = `cni-${agent.matricule}-${Date.now()}.pdf`;
          const cniPath = path.join(__dirname, '..', 'uploads', 'documents', cniFilename);
          fs.writeFileSync(cniPath, agent.document_cni);
          updates.document_cni = `/uploads/documents/${cniFilename}`;
          documentsMigrated++;
          updated = true;
          console.log(`  ✓ Document CNI migré pour ${agent.matricule}`);
        }

        // Migrer la carte électeur
        if (agent.document_carte_electeur && Buffer.isBuffer(agent.document_carte_electeur) && agent.document_carte_electeur.length > 0) {
          const carteFilename = `carte-${agent.matricule}-${Date.now()}.pdf`;
          const cartePath = path.join(__dirname, '..', 'uploads', 'documents', carteFilename);
          fs.writeFileSync(cartePath, agent.document_carte_electeur);
          updates.document_carte_electeur = `/uploads/documents/${carteFilename}`;
          documentsMigrated++;
          updated = true;
          console.log(`  ✓ Carte électeur migrée pour ${agent.matricule}`);
        }

        // Mettre à jour la base de données avec les nouveaux chemins
        if (updated) {
          const updateFields = [];
          const updateValues = [];
          
          if (updates.photo) {
            updateFields.push('photo = ?');
            updateValues.push(updates.photo);
          }
          if (updates.document_cni) {
            updateFields.push('document_cni = ?');
            updateValues.push(updates.document_cni);
          }
          if (updates.document_carte_electeur) {
            updateFields.push('document_carte_electeur = ?');
            updateValues.push(updates.document_carte_electeur);
          }
          
          updateValues.push(agent.id);
          
          await connection.query(
            `UPDATE agents SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
          );
        }
      } catch (error) {
        console.error(`  ✗ Erreur lors de la migration pour ${agent.matricule}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Migration terminée:`);
    console.log(`   - ${photosMigrated} photo(s) migrée(s)`);
    console.log(`   - ${documentsMigrated} document(s) migré(s)`);
    if (errors > 0) {
      console.log(`   - ${errors} erreur(s)`);
    }
    console.log('\n');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Connexion fermée\n');
    }
  }
}

// Exécuter la migration
migrateBlobsToFiles();

