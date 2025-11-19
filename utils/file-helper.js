const path = require('path');
const fs = require('fs');

/**
 * Convertit un chemin de fichier relatif en URL complète
 * @param {string} filePath - Chemin relatif du fichier (ex: /uploads/photos/image.jpg)
 * @param {Object} req - Objet request Express pour obtenir le host
 * @returns {string|null} - URL complète ou null si le fichier n'existe pas
 */
function getFileUrl(filePath, req) {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  // Si c'est déjà une URL complète ou base64, retourner tel quel
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath;
  }

  // Vérifier que le fichier existe
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Fichier non trouvé: ${fullPath}`);
    return null;
  }

  // Construire l'URL complète
  const baseUrl = req.protocol + '://' + req.get('host');
  return baseUrl + filePath;
}

/**
 * Convertit un Buffer en base64 data URL
 * @param {Buffer} buffer - Buffer à convertir
 * @param {string} mimeType - Type MIME (ex: 'image/jpeg')
 * @returns {string} - Data URL
 */
function bufferToDataUrl(buffer, mimeType = 'image/jpeg') {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return null;
  }
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Traite un champ photo/document pour retourner l'URL appropriée
 * @param {string|Buffer} field - Champ photo ou document (peut être un chemin, Buffer, ou null)
 * @param {Object} req - Objet request Express
 * @returns {string|null} - URL complète, data URL, ou null
 */
function processFileField(field, req) {
  if (!field) {
    return null;
  }

  // Si c'est un Buffer (ancien format BLOB)
  if (Buffer.isBuffer(field)) {
    return bufferToDataUrl(field);
  }

  // Si c'est une string
  if (typeof field === 'string') {
    // Si c'est déjà une URL complète ou base64
    if (field.startsWith('http://') || field.startsWith('https://') || field.startsWith('data:')) {
      return field;
    }
    
    // Si c'est un chemin relatif, convertir en URL
    return getFileUrl(field, req);
  }

  return null;
}

module.exports = {
  getFileUrl,
  bufferToDataUrl,
  processFileField
};

