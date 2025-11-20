const cloudinary = require('cloudinary').v2;
const config = require('../config');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name || 'root',
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret
});

/**
 * Upload une image vers Cloudinary
 * @param {Buffer|String} file - Fichier à uploader (Buffer ou chemin)
 * @param {String} folder - Dossier dans Cloudinary (optionnel)
 * @param {Object} options - Options supplémentaires (optionnel)
 * @returns {Promise<Object>} Résultat de l'upload avec URL, public_id, etc.
 */
const uploadImage = async (file, folder = 'idtrack/documents', options = {}) => {
  try {
    const uploadOptions = {
      folder: folder,
      resource_type: 'image',
      ...options
    };

    // Si c'est un Buffer, utiliser upload_stream
    if (Buffer.isBuffer(file)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes
              });
            }
          }
        );
        uploadStream.end(file);
      });
    } else {
      // Si c'est un chemin de fichier
      const result = await cloudinary.uploader.upload(file, uploadOptions);
      return {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      };
    }
  } catch (error) {
    console.error('Erreur lors de l\'upload Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple images vers Cloudinary
 * @param {Array<Buffer|Object>} files - Tableau de fichiers à uploader (Buffer ou objet Multer)
 * @param {String} folder - Dossier dans Cloudinary (optionnel)
 * @param {Function} onProgress - Callback pour suivre la progression (optionnel)
 * @returns {Promise<Array<Object>>} Tableau de résultats d'upload
 */
const uploadMultipleImages = async (files, folder = 'idtrack/documents', onProgress = null) => {
  const results = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const fileName = file.originalname || file.name || `Image ${i + 1}`;
      
      if (onProgress) {
        onProgress({ current: i + 1, total, file: fileName });
      }

      // Extraire le Buffer si c'est un objet Multer
      const fileBuffer = Buffer.isBuffer(file) ? file : (file.buffer || file);
      
      const result = await uploadImage(fileBuffer, folder);
      results.push({
        ...result,
        index: i,
        name: fileName
      });
    } catch (error) {
      console.error(`Erreur lors de l'upload de l'image ${i + 1}:`, error);
      const fileName = files[i].originalname || files[i].name || `Image ${i + 1}`;
      results.push({
        error: error.message,
        index: i,
        name: fileName
      });
    }
  }

  return results;
};

/**
 * Supprimer une image de Cloudinary
 * @param {String} publicId - Public ID de l'image à supprimer
 * @returns {Promise<Object>} Résultat de la suppression
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Erreur lors de la suppression Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  cloudinary
};

