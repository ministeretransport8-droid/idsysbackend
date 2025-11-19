const QRCode = require('qrcode');
const CryptoJS = require('crypto-js');
const config = require('../config');

const QR = {
  generate: async (text) => {
    try {
      return await QRCode.toDataURL(text, { errorCorrectionLevel: 'H', width: 200 });
    } catch (err) {
      throw new Error('Erreur génération QR code : ' + err.message);
    }
  },

  // Générer un QR Code sécurisé avec signature
  generateSecureQR: async (agentData) => {
    try {
      // Créer un payload avec les données essentielles de l'agent
      const payload = {
        matricule: agentData.matricule,
        uuid: agentData.uuid,
        nom: agentData.nom,
        prenom: agentData.prenom,
        categorie: agentData.categorie,
        timestamp: Date.now()
      };

      // Signer les données avec HMAC
      const signature = CryptoJS.HmacSHA256(
        JSON.stringify(payload),
        config.security.dbEncryptionKey
      ).toString();

      // Combiner payload et signature
      const secureData = {
        ...payload,
        signature
      };

      // Encoder en base64 pour le QR code
      const qrData = Buffer.from(JSON.stringify(secureData)).toString('base64');

      // Générer le QR code
      const qrCodeImage = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2
      });

      return { qrCodeImage, qrData };
    } catch (err) {
      throw new Error('Erreur génération QR code sécurisé : ' + err.message);
    }
  },

  // Vérifier un QR Code
  verifyQR: (qrData) => {
    try {
      // Décoder depuis base64
      const decodedData = JSON.parse(
        Buffer.from(qrData, 'base64').toString('utf-8')
      );

      const { signature, ...payload } = decodedData;

      // Recalculer la signature
      const expectedSignature = CryptoJS.HmacSHA256(
        JSON.stringify(payload),
        config.security.dbEncryptionKey
      ).toString();

      // Vérifier la signature
      if (signature !== expectedSignature) {
        return { valid: false, message: 'Signature invalide' };
      }

      // Vérifier le timestamp (expire après 5 ans)
      const fiveYears = 5 * 365 * 24 * 60 * 60 * 1000;
      if (Date.now() - payload.timestamp > fiveYears) {
        return { valid: false, message: 'QR Code expiré' };
      }

      return { valid: true, data: payload };
    } catch (err) {
      return { valid: false, message: 'QR Code invalide : ' + err.message };
    }
  }
};

module.exports = QR;

