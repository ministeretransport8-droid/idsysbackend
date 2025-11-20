const mysql = require('mysql2/promise');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

let pool;

const Database = {
  init: async function () {
    try {
      pool = mysql.createPool({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database,
        port: config.database.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Créer la base de données si elle n'existe pas
      const connection = await mysql.createConnection({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        port: config.database.port
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database.database}`);
      await connection.end();

      // Les tables sont maintenant créées via les migrations
      // Vérifier que la table agents existe (créée par les migrations)
      try {
        const [tables] = await pool.query("SHOW TABLES LIKE 'agents'");
        if (tables.length === 0) {
          console.warn('⚠️  La table agents n\'existe pas. Exécutez les migrations: npm run migrate');
        } else {
          console.log('✓ Base de données initialisée avec succès.');
        }
      } catch (error) {
        console.warn('⚠️  Erreur lors de la vérification des tables:', error.message);
        console.warn('⚠️  Exécutez les migrations: npm run migrate');
      }
    } catch (error) {
      console.error('Erreur initialisation base de données:', error);
      throw error;
    }
  },

  getConnection: function () {
    return pool;
  },

  addAgent: async function (data) {
    try {
      // Générer l'id_agent auto-incrémenté
      let idAgent = data.id_agent;
      if (!idAgent || idAgent.trim() === '') {
        idAgent = await this.getNextIdAgent();
      } else {
        // Valider le format de l'id_agent
        const idAgentPattern = /^MAT-AG-MT-\d{5}$/;
        if (!idAgentPattern.test(idAgent)) {
          // Si le format n'est pas correct, générer un nouveau
          idAgent = await this.getNextIdAgent();
        }
      }
      
      // Utiliser le matricule fourni (maintenant éditable par l'utilisateur)
      const matricule = data.matricule || null;
      
      const agentUuid = uuidv4();

      // Log pour débogage
      console.log('💾 Sauvegarde dans la base de données:');
      console.log('  - ID Agent:', idAgent);
      console.log('  - Matricule:', matricule);
      console.log('  - Photo:', data.photo || 'NULL');
      console.log('  - Document CNI:', data.document_cni || 'NULL');
      console.log('  - Carte électeur:', data.document_carte_electeur || 'NULL');

      const [result] = await pool.query(
        `INSERT INTO agents (
          id_agent, matricule, nom, prenom, post_nom, sexe, date_naissance, lieu_naissance, nationalite, telephone, email, adresse,
          photo, categorie, bureau, cellule, grade, fonction, date_affectation, ref_affectation, zone_affectation, lieu_affectation,
          empreinte_digitale, document_cni, document_carte_electeur,
          qr_code, uuid, statut, situation_prime,
          arrete, commission_affectation_sg, commission_affectation_locale, notification_fonc_publique_ville,
          commission_local_fonc_publique_ville, notification_nu
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idAgent,
          matricule,
          data.nom,
          data.prenom,
          data.post_nom || null,
          data.sexe,
          data.date_naissance,
          data.lieu_naissance,
          data.nationalite || 'Congolaise',
          data.telephone,
          data.email,
          data.adresse,
          data.photo || null, // Stocker le chemin du fichier au lieu du Buffer
          data.categorie,
          data.bureau,
          data.cellule,
          data.grade,
          data.fonction || null,
          data.date_affectation || null,
          data.ref_affectation || null,
          data.zone_affectation || null,
          data.lieu_affectation || null,
          data.empreinte_digitale,
          data.document_cni || null, // Stocker le chemin du fichier
          data.document_carte_electeur || null, // Stocker le chemin du fichier
          data.qr_code || '',
          agentUuid,
          data.statut || 'actif',
          data.situation_prime || 'NP',
          data.arrete ? 1 : 0,
          data.commission_affectation_sg ? 1 : 0,
          data.commission_affectation_locale ? 1 : 0,
          data.notification_fonc_publique_ville ? 1 : 0,
          data.commission_local_fonc_publique_ville ? 1 : 0,
          data.notification_nu ? 1 : 0
        ]
      );

      console.log('✅ Données sauvegardées avec succès dans la base de données');
      return { id_agent: idAgent, matricule, uuid: agentUuid };
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      throw error;
    }
  },

  getNextId: async function () {
    try {
      // Nouveau format: MAT-AG-MT-00001 (5 chiffres)
      const prefix = 'MAT-AG-MT';
      const padding = 5;
      
      // Chercher le dernier matricule avec ce format
      const [rows] = await pool.query(
        `SELECT matricule FROM agents 
         WHERE matricule LIKE ? 
         ORDER BY matricule DESC 
         LIMIT 1`,
        [`${prefix}-%`]
      );
      
      let nextNum = 1;
      if (rows.length > 0 && rows[0].matricule) {
        const lastMatricule = rows[0].matricule;
        const lastNumStr = lastMatricule.replace(`${prefix}-`, '');
        const lastNum = parseInt(lastNumStr, 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      
      const matricule = `${prefix}-${String(nextNum).padStart(padding, '0')}`;
      return matricule;
    } catch (error) {
      // En cas d'erreur, utiliser un format basique
      const [rows] = await pool.query('SELECT MAX(id) as maxId FROM agents');
      const next = rows[0]?.maxId ? rows[0].maxId + 1 : 1;
      return `MAT-AG-MT-${String(next).padStart(5, '0')}`;
    }
  },

  getNextIdAgent: async function () {
    try {
      // Format: MAT-AG-MT-00001 (5 chiffres)
      const prefix = 'MAT-AG-MT';
      const padding = 5;
      
      // Chercher le dernier id_agent avec ce format
      const [rows] = await pool.query(
        `SELECT id_agent FROM agents 
         WHERE id_agent LIKE ? 
         ORDER BY id_agent DESC 
         LIMIT 1`,
        [`${prefix}-%`]
      );
      
      let nextNum = 1;
      if (rows.length > 0 && rows[0].id_agent) {
        const lastIdAgent = rows[0].id_agent;
        const lastNumStr = lastIdAgent.replace(`${prefix}-`, '');
        const lastNum = parseInt(lastNumStr, 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      
      const idAgent = `${prefix}-${String(nextNum).padStart(padding, '0')}`;
      return idAgent;
    } catch (error) {
      // En cas d'erreur, utiliser un format basique
      const [rows] = await pool.query('SELECT MAX(id) as maxId FROM agents');
      const next = rows[0]?.maxId ? rows[0].maxId + 1 : 1;
      return `MAT-AG-MT-${String(next).padStart(5, '0')}`;
    }
  },

  searchAgents: async function (searchTerm) {
    try {
      const [rows] = await pool.query(
        `SELECT a.id, a.id_agent, a.matricule, a.nom, a.prenom, a.post_nom, a.sexe, a.date_naissance, a.lieu_naissance, 
         a.nationalite, a.telephone, a.email, a.adresse, a.categorie, 
         a.bureau, a.cellule, a.grade, a.fonction, a.date_affectation, a.ref_affectation, 
         a.zone_affectation, a.lieu_affectation, a.empreinte_digitale, a.qr_code, a.uuid, a.statut, a.situation_prime,
         a.date_enregistrement, a.photo, a.document_cni, a.document_carte_electeur,
         a.arrete, a.commission_affectation_sg, a.commission_affectation_locale, a.notification_fonc_publique_ville,
         a.commission_local_fonc_publique_ville, a.notification_nu,
         b.nom AS bureau_nom, c.nom AS cellule_nom
         FROM agents a
         LEFT JOIN bureaux b ON (a.bureau = b.id OR a.bureau = b.nom)
         LEFT JOIN cellules c ON (a.cellule = c.id OR a.cellule = c.nom)
         WHERE a.nom LIKE ? OR a.prenom LIKE ? OR a.matricule LIKE ? OR a.id_agent LIKE ?
         OR b.nom LIKE ? OR c.nom LIKE ? OR a.bureau LIKE ? OR a.cellule LIKE ?`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getAllAgents: async function () {
    try {
      const [rows] = await pool.query(
        `SELECT a.id, a.id_agent, a.matricule, a.nom, a.prenom, a.post_nom, a.sexe, a.date_naissance, a.lieu_naissance, 
         a.nationalite, a.telephone, a.email, a.adresse, a.categorie, 
         a.bureau, a.cellule, a.grade, a.fonction, a.date_affectation, a.ref_affectation, 
         a.zone_affectation, a.lieu_affectation, a.empreinte_digitale, a.qr_code, a.uuid, a.statut, a.situation_prime,
         a.date_enregistrement, a.photo, a.document_cni, a.document_carte_electeur,
         a.arrete, a.commission_affectation_sg, a.commission_affectation_locale, a.notification_fonc_publique_ville,
         a.commission_local_fonc_publique_ville, a.notification_nu,
         b.nom AS bureau_nom, c.nom AS cellule_nom
         FROM agents a
         LEFT JOIN bureaux b ON (a.bureau = b.id OR a.bureau = b.nom)
         LEFT JOIN cellules c ON (a.cellule = c.id OR a.cellule = c.nom)`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getAgentByMatricule: async function (matricule) {
    try {
      const [rows] = await pool.query(
        `SELECT a.id, a.id_agent, a.matricule, a.nom, a.prenom, a.post_nom, a.sexe, a.date_naissance, a.lieu_naissance, 
         a.nationalite, a.telephone, a.email, a.adresse, a.categorie, 
         a.bureau, a.cellule, a.grade, a.fonction, a.date_affectation, a.ref_affectation, 
         a.zone_affectation, a.lieu_affectation, a.empreinte_digitale, a.qr_code, a.uuid, a.statut, a.situation_prime,
         a.date_enregistrement, a.photo, a.document_cni, a.document_carte_electeur,
         b.nom AS bureau_nom, c.nom AS cellule_nom
         FROM agents a
         LEFT JOIN bureaux b ON (a.bureau = b.id OR a.bureau = b.nom)
         LEFT JOIN cellules c ON (a.cellule = c.id OR a.cellule = c.nom)
         WHERE a.matricule = ?`,
        [matricule]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  getAgentById: async function (id) {
    try {
      const [rows] = await pool.query(
        `SELECT a.id, a.id_agent, a.matricule, a.nom, a.prenom, a.post_nom, a.sexe, a.date_naissance, a.lieu_naissance, 
         a.nationalite, a.telephone, a.email, a.adresse, a.categorie, 
         a.bureau, a.cellule, a.grade, a.fonction, a.date_affectation, a.ref_affectation, 
         a.zone_affectation, a.lieu_affectation, a.empreinte_digitale, a.qr_code, a.uuid, a.statut, a.situation_prime,
         a.date_enregistrement, a.photo, a.document_cni, a.document_carte_electeur,
         b.nom AS bureau_nom, c.nom AS cellule_nom
         FROM agents a
         LEFT JOIN bureaux b ON (a.bureau = b.id OR a.bureau = b.nom)
         LEFT JOIN cellules c ON (a.cellule = c.id OR a.cellule = c.nom)
         WHERE a.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  updateAgentStatut: async function (matricule, statut) {
    try {
      await pool.query('UPDATE agents SET statut = ? WHERE matricule = ?', [statut, matricule]);
    } catch (error) {
      throw error;
    }
  },

  updateAgent: async function (id, data) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (data.nom !== undefined) {
        updateFields.push('nom = ?');
        updateValues.push(data.nom);
      }
      if (data.prenom !== undefined) {
        updateFields.push('prenom = ?');
        updateValues.push(data.prenom);
      }
      if (data.post_nom !== undefined) {
        updateFields.push('post_nom = ?');
        updateValues.push(data.post_nom);
      }
      if (data.sexe !== undefined) {
        updateFields.push('sexe = ?');
        updateValues.push(data.sexe);
      }
      if (data.date_naissance !== undefined) {
        updateFields.push('date_naissance = ?');
        updateValues.push(data.date_naissance);
      }
      if (data.lieu_naissance !== undefined) {
        updateFields.push('lieu_naissance = ?');
        updateValues.push(data.lieu_naissance);
      }
      if (data.nationalite !== undefined) {
        updateFields.push('nationalite = ?');
        updateValues.push(data.nationalite);
      }
      if (data.telephone !== undefined) {
        updateFields.push('telephone = ?');
        updateValues.push(data.telephone);
      }
      if (data.email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(data.email);
      }
      if (data.adresse !== undefined) {
        updateFields.push('adresse = ?');
        updateValues.push(data.adresse);
      }
      if (data.id_agent !== undefined) {
        updateFields.push('id_agent = ?');
        updateValues.push(data.id_agent);
      }
      if (data.matricule !== undefined) {
        updateFields.push('matricule = ?');
        updateValues.push(data.matricule);
      }
      if (data.photo !== undefined) {
        updateFields.push('photo = ?');
        updateValues.push(data.photo ? Buffer.from(data.photo, 'base64') : null);
      }
      if (data.categorie !== undefined) {
        updateFields.push('categorie = ?');
        updateValues.push(data.categorie);
      }
      if (data.bureau !== undefined) {
        updateFields.push('bureau = ?');
        updateValues.push(data.bureau);
      }
      if (data.cellule !== undefined) {
        updateFields.push('cellule = ?');
        updateValues.push(data.cellule);
      }
      if (data.grade !== undefined) {
        updateFields.push('grade = ?');
        updateValues.push(data.grade);
      }
      if (data.fonction !== undefined) {
        updateFields.push('fonction = ?');
        updateValues.push(data.fonction);
      }
      if (data.date_affectation !== undefined) {
        updateFields.push('date_affectation = ?');
        updateValues.push(data.date_affectation);
      }
      if (data.ref_affectation !== undefined) {
        updateFields.push('ref_affectation = ?');
        updateValues.push(data.ref_affectation);
      }
      if (data.zone_affectation !== undefined) {
        updateFields.push('zone_affectation = ?');
        updateValues.push(data.zone_affectation);
      }
      if (data.lieu_affectation !== undefined) {
        updateFields.push('lieu_affectation = ?');
        updateValues.push(data.lieu_affectation);
      }
      if (data.situation_prime !== undefined) {
        updateFields.push('situation_prime = ?');
        updateValues.push(data.situation_prime);
      }
      if (data.arrete !== undefined) {
        updateFields.push('arrete = ?');
        updateValues.push(data.arrete ? 1 : 0);
      }
      if (data.commission_affectation_sg !== undefined) {
        updateFields.push('commission_affectation_sg = ?');
        updateValues.push(data.commission_affectation_sg ? 1 : 0);
      }
      if (data.commission_affectation_locale !== undefined) {
        updateFields.push('commission_affectation_locale = ?');
        updateValues.push(data.commission_affectation_locale ? 1 : 0);
      }
      if (data.notification_fonc_publique_ville !== undefined) {
        updateFields.push('notification_fonc_publique_ville = ?');
        updateValues.push(data.notification_fonc_publique_ville ? 1 : 0);
      }
      if (data.commission_local_fonc_publique_ville !== undefined) {
        updateFields.push('commission_local_fonc_publique_ville = ?');
        updateValues.push(data.commission_local_fonc_publique_ville ? 1 : 0);
      }
      if (data.notification_nu !== undefined) {
        updateFields.push('notification_nu = ?');
        updateValues.push(data.notification_nu ? 1 : 0);
      }
      if (data.empreinte_digitale !== undefined) {
        updateFields.push('empreinte_digitale = ?');
        updateValues.push(data.empreinte_digitale);
      }
      if (data.document_cni !== undefined) {
        updateFields.push('document_cni = ?');
        updateValues.push(data.document_cni ? Buffer.from(data.document_cni, 'base64') : null);
      }
      if (data.document_carte_electeur !== undefined) {
        updateFields.push('document_carte_electeur = ?');
        updateValues.push(data.document_carte_electeur ? Buffer.from(data.document_carte_electeur, 'base64') : null);
      }
      if (data.statut !== undefined) {
        updateFields.push('statut = ?');
        updateValues.push(data.statut);
      }

      if (updateFields.length === 0) {
        throw new Error('Aucun champ à mettre à jour');
      }

      updateValues.push(id);

      await pool.query(
        `UPDATE agents SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      return { id, updated: true };
    } catch (error) {
      throw error;
    }
  },

  deleteAgent: async function (id) {
    try {
      const [result] = await pool.query('DELETE FROM agents WHERE id = ?', [id]);
      return { deleted: result.affectedRows > 0 };
    } catch (error) {
      throw error;
    }
  },

  importFromCSV: async function (csvData) {
    try {
      let count = 0;
      for (const row of csvData) {
        await this.addAgent({
          nom: row.Nom,
          prenom: row.Prenom,
          sexe: row.Sexe,
          date_naissance: row.DateNaissance,
          lieu_naissance: row.LieuNaissance,
          nationalite: row.Nationalite || 'Congolaise',
          telephone: row.Telephone,
          email: row.Email,
          adresse: row.Adresse,
          photo: null,
          categorie: row.Categorie,
          bureau: row.Bureau,
          cellule: row.Cellule,
          grade: row.Grade,
          empreinte_digitale: null,
          document_cni: null,
          document_carte_electeur: null,
          qr_code: '',
          statut: row.Statut || 'actif'
        });
        count++;
      }
      return count;
    } catch (error) {
      throw error;
    }
  },

  getAllBureaux: async function () {
    try {
      const [rows] = await pool.query(
        `SELECT id, nom, code, description, adresse, telephone, email, responsable, statut, 
         date_creation, date_modification
         FROM bureaux 
         ORDER BY nom ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  addBureau: async function (data) {
    try {
      const [result] = await pool.query(
        `INSERT INTO bureaux (nom, code, description, adresse, telephone, email, responsable, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.nom,
          data.code || null,
          data.description || null,
          data.adresse || null,
          data.telephone || null,
          data.email || null,
          data.responsable || null,
          data.statut || 'actif'
        ]
      );

      return {
        id: result.insertId,
        nom: data.nom,
        code: data.code || null,
        description: data.description || null,
        adresse: data.adresse || null,
        telephone: data.telephone || null,
        email: data.email || null,
        responsable: data.responsable || null,
        statut: data.statut || 'actif'
      };
    } catch (error) {
      throw error;
    }
  },

  addCellule: async function (data) {
    try {
      const [result] = await pool.query(
        `INSERT INTO cellules (nom, code, bureau_id, description, adresse, telephone, email, responsable, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.nom,
          data.code || null,
          data.bureau_id || null,
          data.description || null,
          data.adresse || null,
          data.telephone || null,
          data.email || null,
          data.responsable || null,
          data.statut || 'actif'
        ]
      );

      return {
        id: result.insertId,
        nom: data.nom,
        code: data.code,
        bureau_id: data.bureau_id,
        description: data.description,
        adresse: data.adresse,
        telephone: data.telephone,
        email: data.email,
        responsable: data.responsable,
        statut: data.statut || 'actif'
      };
    } catch (error) {
      throw error;
    }
  },

  getAllCellules: async function () {
    try {
      const [rows] = await pool.query(
        `SELECT c.id, c.nom, c.code, c.bureau_id, c.description, c.adresse, c.telephone, c.email, 
         c.responsable, c.statut, c.date_creation, c.date_modification,
         b.nom as bureau_nom, b.code as bureau_code
         FROM cellules c
         LEFT JOIN bureaux b ON c.bureau_id = b.id
         ORDER BY b.nom ASC, c.nom ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Hashage de mot de passe
  hashPassword: function (password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  },

  verifyPassword: function (password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  },

  // CRUD Utilisateurs
  createUtilisateur: async function (data) {
    try {
      const hashedPassword = this.hashPassword(data.password);
      
      const [result] = await pool.query(
        `INSERT INTO utilisateurs (username, email, password, nom, prenom, role, telephone, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.username,
          data.email,
          hashedPassword,
          data.nom,
          data.prenom,
          data.role || 'user',
          data.telephone || null,
          data.statut || 'actif'
        ]
      );

      return { id: result.insertId, username: data.username, email: data.email };
    } catch (error) {
      throw error;
    }
  },

  getAllUtilisateurs: async function () {
    try {
      const [rows] = await pool.query(
        `SELECT id, username, email, nom, prenom, role, telephone, statut, 
         date_creation, date_modification, derniere_connexion
         FROM utilisateurs 
         ORDER BY nom ASC, prenom ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getUtilisateurById: async function (id) {
    try {
      const [rows] = await pool.query(
        `SELECT id, username, email, nom, prenom, role, telephone, statut, 
         date_creation, date_modification, derniere_connexion
         FROM utilisateurs 
         WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  getUtilisateurByUsername: async function (username) {
    try {
      const [rows] = await pool.query(
        `SELECT id, username, email, password, nom, prenom, role, telephone, statut, 
         date_creation, date_modification, derniere_connexion
         FROM utilisateurs 
         WHERE username = ?`,
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  getUtilisateurByEmail: async function (email) {
    try {
      const [rows] = await pool.query(
        `SELECT id, username, email, password, nom, prenom, role, telephone, statut, 
         date_creation, date_modification, derniere_connexion
         FROM utilisateurs 
         WHERE email = ?`,
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  updateUtilisateur: async function (id, data) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (data.username !== undefined) {
        updateFields.push('username = ?');
        updateValues.push(data.username);
      }
      if (data.email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(data.email);
      }
      if (data.password !== undefined) {
        const hashedPassword = this.hashPassword(data.password);
        updateFields.push('password = ?');
        updateValues.push(hashedPassword);
      }
      if (data.nom !== undefined) {
        updateFields.push('nom = ?');
        updateValues.push(data.nom);
      }
      if (data.prenom !== undefined) {
        updateFields.push('prenom = ?');
        updateValues.push(data.prenom);
      }
      if (data.role !== undefined) {
        updateFields.push('role = ?');
        updateValues.push(data.role);
      }
      if (data.telephone !== undefined) {
        updateFields.push('telephone = ?');
        updateValues.push(data.telephone);
      }
      if (data.statut !== undefined) {
        updateFields.push('statut = ?');
        updateValues.push(data.statut);
      }

      if (updateFields.length === 0) {
        throw new Error('Aucun champ à mettre à jour');
      }

      updateValues.push(id);

      await pool.query(
        `UPDATE utilisateurs SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      return { id, updated: true };
    } catch (error) {
      throw error;
    }
  },

  deleteUtilisateur: async function (id) {
    try {
      const [result] = await pool.query('DELETE FROM utilisateurs WHERE id = ?', [id]);
      return { deleted: result.affectedRows > 0 };
    } catch (error) {
      throw error;
    }
  },

  updateDerniereConnexion: async function (id) {
    try {
      await pool.query(
        'UPDATE utilisateurs SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      throw error;
    }
  },

  // CRUD Grades
  getAllGrades: async function () {
    try {
      const [rows] = await pool.query(
        `SELECT id, nom, code, description, niveau_hierarchique, statut, 
         date_creation, date_modification
         FROM grades 
         ORDER BY niveau_hierarchique ASC, nom ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getGradeById: async function (id) {
    try {
      const [rows] = await pool.query('SELECT * FROM grades WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  createGrade: async function (data) {
    try {
      const [result] = await pool.query(
        `INSERT INTO grades (nom, code, description, niveau_hierarchique, statut) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.nom,
          data.code || null,
          data.description || null,
          data.niveau_hierarchique || 0,
          data.statut || 'actif'
        ]
      );
      return { id: result.insertId, ...data };
    } catch (error) {
      throw error;
    }
  },

  updateGrade: async function (id, data) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (data.nom !== undefined) {
        updateFields.push('nom = ?');
        updateValues.push(data.nom);
      }
      if (data.code !== undefined) {
        updateFields.push('code = ?');
        updateValues.push(data.code);
      }
      if (data.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(data.description);
      }
      if (data.niveau_hierarchique !== undefined) {
        updateFields.push('niveau_hierarchique = ?');
        updateValues.push(data.niveau_hierarchique);
      }
      if (data.statut !== undefined) {
        updateFields.push('statut = ?');
        updateValues.push(data.statut);
      }

      if (updateFields.length === 0) {
        throw new Error('Aucun champ à mettre à jour');
      }

      updateValues.push(id);

      await pool.query(
        `UPDATE grades SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      return { id, updated: true };
    } catch (error) {
      throw error;
    }
  },

  deleteGrade: async function (id) {
    try {
      const [result] = await pool.query('DELETE FROM grades WHERE id = ?', [id]);
      return { deleted: result.affectedRows > 0 };
    } catch (error) {
      throw error;
    }
  },

  // CRUD Fonctions
  getAllFonctions: async function () {
    try {
      const [rows] = await pool.query(
        `SELECT id, nom, code, description, statut, 
         date_creation, date_modification
         FROM fonctions 
         ORDER BY nom ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getFonctionById: async function (id) {
    try {
      const [rows] = await pool.query('SELECT * FROM fonctions WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  createFonction: async function (data) {
    try {
      const [result] = await pool.query(
        `INSERT INTO fonctions (nom, code, description, statut) 
         VALUES (?, ?, ?, ?)`,
        [
          data.nom,
          data.code || null,
          data.description || null,
          data.statut || 'actif'
        ]
      );
      return { id: result.insertId, ...data };
    } catch (error) {
      throw error;
    }
  },

  updateFonction: async function (id, data) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (data.nom !== undefined) {
        updateFields.push('nom = ?');
        updateValues.push(data.nom);
      }
      if (data.code !== undefined) {
        updateFields.push('code = ?');
        updateValues.push(data.code);
      }
      if (data.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(data.description);
      }
      if (data.statut !== undefined) {
        updateFields.push('statut = ?');
        updateValues.push(data.statut);
      }

      if (updateFields.length === 0) {
        throw new Error('Aucun champ à mettre à jour');
      }

      updateValues.push(id);

      await pool.query(
        `UPDATE fonctions SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      return { id, updated: true };
    } catch (error) {
      throw error;
    }
  },

  deleteFonction: async function (id) {
    try {
      const [result] = await pool.query('DELETE FROM fonctions WHERE id = ?', [id]);
      return { deleted: result.affectedRows > 0 };
    } catch (error) {
      throw error;
    }
  },

  // CRUD Catégories Professionnelles (utilise la table categories)
  getAllCategoriesProfessionnelles: async function () {
    try {
      const [rows] = await pool.query(
        `SELECT id, nom, code, description, niveau_hierarchique, statut, 
         date_creation, date_modification
         FROM categories 
         ORDER BY niveau_hierarchique ASC, nom ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getCategorieProfessionnelleById: async function (id) {
    try {
      const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  createCategorieProfessionnelle: async function (data) {
    try {
      const [result] = await pool.query(
        `INSERT INTO categories (nom, code, description, niveau_hierarchique, statut) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.nom,
          data.code || null,
          data.description || null,
          data.niveau_hierarchique || 0,
          data.statut || 'actif'
        ]
      );
      return { id: result.insertId, ...data };
    } catch (error) {
      throw error;
    }
  },

  updateCategorieProfessionnelle: async function (id, data) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (data.nom !== undefined) {
        updateFields.push('nom = ?');
        updateValues.push(data.nom);
      }
      if (data.code !== undefined) {
        updateFields.push('code = ?');
        updateValues.push(data.code);
      }
      if (data.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(data.description);
      }
      if (data.niveau_hierarchique !== undefined) {
        updateFields.push('niveau_hierarchique = ?');
        updateValues.push(data.niveau_hierarchique);
      }
      if (data.statut !== undefined) {
        updateFields.push('statut = ?');
        updateValues.push(data.statut);
      }

      if (updateFields.length === 0) {
        throw new Error('Aucun champ à mettre à jour');
      }

      updateValues.push(id);

      await pool.query(
        `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      return { id, updated: true };
    } catch (error) {
      throw error;
    }
  },

  deleteCategorieProfessionnelle: async function (id) {
    try {
      const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
      return { deleted: result.affectedRows > 0 };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Database;

