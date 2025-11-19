const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function generateCarte(agent) {
  try {
    // Créer le PDF avec dimensions de carte d'identité (85.6mm x 53.98mm = 242.65 x 153 pts)
    const pdfDoc = await PDFDocument.create();
    const width = 860; // Taille plus grande pour impression
    const height = 540;
    
    // ===== PAGE AVANT =====
    const pageAvant = pdfDoc.addPage([width, height]);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Couleur principale (RGB de #00A896)
    const primaryColor = rgb(0, 0.659, 0.588);
    const whiteColor = rgb(1, 1, 1);
    const blackColor = rgb(0, 0, 0);
    const grayColor = rgb(0.2, 0.2, 0.2);
    
    // Fond avec dégradé simulé (bandes)
    pageAvant.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: whiteColor
    });
    
    // Bande supérieure principale
    pageAvant.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: primaryColor
    });
    
    // Bande inférieure
    pageAvant.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 60,
      color: primaryColor
    });
    
    // Titre de la carte
    pageAvant.drawText('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', {
      x: 30,
      y: height - 35,
      size: 16,
      font: fontBold,
      color: whiteColor
    });
    
    pageAvant.drawText('Ministère Provincial de Transport et Mobilité Urbaine - Kinshasa', {
      x: 30,
      y: height - 60,
      size: 12,
      font: fontRegular,
      color: whiteColor
    });
    
    pageAvant.drawText('CARTE D\'IDENTIFICATION AGENT TERRAIN', {
      x: 30,
      y: height - 85,
      size: 14,
      font: fontBold,
      color: whiteColor
    });
    
    // Photo de l'agent (si disponible)
    if (agent.photo) {
      try {
        let photoBuffer;
        
        // Si c'est un chemin de fichier (commence par /uploads)
        if (typeof agent.photo === 'string' && agent.photo.startsWith('/uploads')) {
          const fs = require('fs');
          const path = require('path');
          const photoPath = path.join(__dirname, '..', agent.photo);
          if (fs.existsSync(photoPath)) {
            photoBuffer = fs.readFileSync(photoPath);
          } else {
            console.warn('Photo non trouvée:', photoPath);
            photoBuffer = null;
          }
        } else if (typeof agent.photo === 'string' && agent.photo.startsWith('data:')) {
          // Si c'est une data URL base64
          const base64Data = agent.photo.split(',')[1];
          if (base64Data) {
            photoBuffer = Buffer.from(base64Data, 'base64');
          } else {
            console.warn('Données base64 invalides dans data URL');
            photoBuffer = null;
          }
        } else if (typeof agent.photo === 'string') {
          // Si c'est déjà en base64 sans data URL
          try {
            photoBuffer = Buffer.from(agent.photo, 'base64');
            // Vérifier que le buffer n'est pas vide
            if (photoBuffer.length === 0) {
              console.warn('Buffer photo vide');
              photoBuffer = null;
            }
          } catch (e) {
            console.warn('Erreur lors du décodage base64:', e.message);
            photoBuffer = null;
          }
        } else if (Buffer.isBuffer(agent.photo)) {
          // Si c'est déjà un Buffer
          photoBuffer = agent.photo;
          if (photoBuffer.length === 0) {
            console.warn('Buffer photo vide');
            photoBuffer = null;
          }
        } else {
          console.warn('Format de photo non supporté');
          photoBuffer = null;
        }
        
        // Si on a un buffer valide, essayer de l'embedder
        if (photoBuffer && photoBuffer.length > 0) {
          // Fonction pour détecter le type d'image
          const detectImageType = (buffer) => {
            if (buffer.length < 4) return null;
            
            // JPEG: commence par FF D8
            if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
              return 'jpeg';
            }
            
            // PNG: commence par 89 50 4E 47
            if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
              return 'png';
            }
            
            return null;
          };
          
          const imageType = detectImageType(photoBuffer);
          let photoImg;
          
          if (imageType === 'jpeg') {
            try {
              photoImg = await pdfDoc.embedJpg(photoBuffer);
            } catch (err) {
              console.warn('Erreur embedding JPEG, tentative PNG:', err.message);
              // Essayer PNG si JPEG échoue
              try {
                photoImg = await pdfDoc.embedPng(photoBuffer);
              } catch (err2) {
                console.error('Erreur embedding PNG:', err2.message);
                throw err2;
              }
            }
          } else if (imageType === 'png') {
            try {
              photoImg = await pdfDoc.embedPng(photoBuffer);
            } catch (err) {
              console.error('Erreur embedding PNG:', err.message);
              throw err;
            }
          } else {
            // Type inconnu, essayer JPEG puis PNG
            try {
              photoImg = await pdfDoc.embedJpg(photoBuffer);
            } catch (err) {
              console.warn('Erreur embedding JPEG (type inconnu), tentative PNG:', err.message);
              try {
                photoImg = await pdfDoc.embedPng(photoBuffer);
              } catch (err2) {
                console.error('Erreur embedding PNG (type inconnu):', err2.message);
                throw new Error('Format d\'image non supporté. Utilisez JPEG ou PNG.');
              }
            }
          }
          
          pageAvant.drawImage(photoImg, {
            x: 50,
            y: height - 340,
            width: 150,
            height: 190
          });
          
          // Bordure autour de la photo
          pageAvant.drawRectangle({
            x: 48,
            y: height - 342,
            width: 154,
            height: 194,
            borderColor: primaryColor,
            borderWidth: 3
          });
        } else {
          console.warn('Photo non disponible ou invalide, génération de la carte sans photo');
        }
      } catch (err) {
        console.error('Erreur d\'embedding de la photo:', err);
        // Continuer la génération du PDF même si la photo échoue
      }
    }
    
    // Informations de l'agent
    let yPos = height - 150;
    const xInfo = 230;
    
    // Matricule
    pageAvant.drawText('MATRICULE:', {
      x: xInfo,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageAvant.drawText(agent.matricule || 'N/A', {
      x: xInfo + 120,
      y: yPos,
      size: 14,
      font: fontBold,
      color: primaryColor
    });
    
    yPos -= 30;
    
    // Nom complet
    pageAvant.drawText('NOM COMPLET:', {
      x: xInfo,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    const nomComplet = `${agent.nom || ''} ${agent.prenom || ''}`.toUpperCase();
    pageAvant.drawText(nomComplet, {
      x: xInfo + 120,
      y: yPos,
      size: 12,
      font: fontBold,
      color: blackColor
    });
    
    yPos -= 25;
    
    // Catégorie
    pageAvant.drawText('CATÉGORIE:', {
      x: xInfo,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageAvant.drawText(agent.categorie || 'N/A', {
      x: xInfo + 120,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    yPos -= 25;
    
    // Bureau
    pageAvant.drawText('BUREAU:', {
      x: xInfo,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageAvant.drawText(agent.bureau || 'N/A', {
      x: xInfo + 120,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    yPos -= 25;
    
    // Cellule
    pageAvant.drawText('CELLULE:', {
      x: xInfo,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageAvant.drawText(agent.cellule || 'N/A', {
      x: xInfo + 120,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    yPos -= 25;
    
    // Téléphone
    pageAvant.drawText('TÉLÉPHONE:', {
      x: xInfo,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageAvant.drawText(agent.telephone || 'N/A', {
      x: xInfo + 120,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    // QR Code (à droite)
    if (agent.qr_code_image) {
      try {
        const qrBuffer = Buffer.from(agent.qr_code_image.split(',')[1], 'base64');
        const qrImg = await pdfDoc.embedPng(qrBuffer);
        pageAvant.drawImage(qrImg, {
          x: width - 200,
          y: height - 340,
          width: 150,
          height: 150
        });
        
        pageAvant.drawText('Scanner pour vérifier', {
          x: width - 190,
          y: height - 360,
          size: 9,
          font: fontRegular,
          color: grayColor
        });
      } catch (err) {
        console.error('Erreur d\'embedding du QR code:', err);
      }
    }
    
    // Date d'émission dans la bande inférieure
    const dateEmission = new Date().toLocaleDateString('fr-FR');
    pageAvant.drawText(`Date d'émission: ${dateEmission}`, {
      x: 30,
      y: 25,
      size: 10,
      font: fontRegular,
      color: whiteColor
    });
    
    pageAvant.drawText('Cette carte est strictement personnelle et doit être présentée sur demande', {
      x: 30,
      y: 10,
      size: 8,
      font: fontRegular,
      color: whiteColor
    });
    
    // ===== PAGE ARRIÈRE =====
    const pageArriere = pdfDoc.addPage([width, height]);
    
    // Fond
    pageArriere.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(0.95, 0.95, 0.95)
    });
    
    // Bande supérieure
    pageArriere.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: primaryColor
    });
    
    pageArriere.drawText('INFORMATIONS COMPLÉMENTAIRES', {
      x: 30,
      y: height - 45,
      size: 18,
      font: fontBold,
      color: whiteColor
    });
    
    // Informations supplémentaires
    yPos = height - 120;
    const xCol1 = 50;
    const xCol2 = 450;
    
    // Colonne 1
    pageArriere.drawText('Date de naissance:', {
      x: xCol1,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageArriere.drawText(agent.date_naissance || 'N/A', {
      x: xCol1 + 160,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    yPos -= 25;
    pageArriere.drawText('Lieu de naissance:', {
      x: xCol1,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageArriere.drawText(agent.lieu_naissance || 'N/A', {
      x: xCol1 + 160,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    yPos -= 25;
    pageArriere.drawText('Nationalité:', {
      x: xCol1,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageArriere.drawText(agent.nationalite || 'Congolaise', {
      x: xCol1 + 160,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    yPos -= 25;
    pageArriere.drawText('Sexe:', {
      x: xCol1,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageArriere.drawText(agent.sexe || 'N/A', {
      x: xCol1 + 160,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    yPos -= 25;
    pageArriere.drawText('Grade:', {
      x: xCol1,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageArriere.drawText(agent.grade || 'N/A', {
      x: xCol1 + 160,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    // Colonne 2
    yPos = height - 120;
    pageArriere.drawText('Email:', {
      x: xCol2,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageArriere.drawText(agent.email || 'N/A', {
      x: xCol2 + 80,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    yPos -= 25;
    pageArriere.drawText('Adresse:', {
      x: xCol2,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    const adresse = agent.adresse || 'N/A';
    pageArriere.drawText(adresse.substring(0, 40), {
      x: xCol2 + 80,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: blackColor
    });
    
    yPos -= 25;
    pageArriere.drawText('Statut:', {
      x: xCol2,
      y: yPos,
      size: 11,
      font: fontBold,
      color: grayColor
    });
    pageArriere.drawText((agent.statut || 'actif').toUpperCase(), {
      x: xCol2 + 80,
      y: yPos,
      size: 11,
      font: fontBold,
      color: agent.statut === 'actif' ? rgb(0, 0.7, 0) : rgb(0.8, 0, 0)
    });
    
    // Instructions d'utilisation
    yPos = 200;
    pageArriere.drawText('INSTRUCTIONS D\'UTILISATION:', {
      x: 50,
      y: yPos,
      size: 12,
      font: fontBold,
      color: blackColor
    });
    
    yPos -= 25;
    const instructions = [
      '1. Cette carte doit être portée de manière visible pendant les heures de service',
      '2. Toute perte ou vol doit être signalé immédiatement au bureau central',
      '3. Cette carte est valable pour une durée de 3 ans à compter de la date d\'émission',
      '4. Le code QR permet l\'identification et la vérification instantanée de l\'agent',
      '5. En cas de changement d\'affectation, une nouvelle carte sera émise'
    ];
    
    instructions.forEach(instruction => {
      pageArriere.drawText(instruction, {
        x: 50,
        y: yPos,
        size: 10,
        font: fontRegular,
        color: grayColor
      });
      yPos -= 20;
    });
    
    // Signature et cachet (simulé)
    pageArriere.drawText('___________________________', {
      x: width - 300,
      y: 120,
      size: 10,
      font: fontRegular,
      color: blackColor
    });
    pageArriere.drawText('Signature de l\'Autorité Compétente', {
      x: width - 300,
      y: 105,
      size: 9,
      font: fontRegular,
      color: grayColor
    });
    
    // Footer
    pageArriere.drawText('Ministère Provincial de Transport et Mobilité Urbaine - Kinshasa', {
      x: 50,
      y: 30,
      size: 10,
      font: fontBold,
      color: primaryColor
    });
    pageArriere.drawText('Contact: info@mptmu-kinshasa.cd | Tél: +243 XX XXX XXXX', {
      x: 50,
      y: 15,
      size: 9,
      font: fontRegular,
      color: grayColor
    });
    
    // Sauvegarde du PDF
    const pdfBytes = await pdfDoc.save();
    const fileName = `${agent.matricule.replace(/\//g, '-')}.pdf`;
    const exportPath = path.join(__dirname, '../exports/cartes/', fileName);
    
    // Créer le dossier si nécessaire
    const dir = path.dirname(exportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(exportPath, pdfBytes);
    return exportPath;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw error;
  }
}

module.exports = { generateCarte };

