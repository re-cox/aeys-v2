import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import errorHandler from '../utils/errorHandler';
import { uploadFile } from '../controllers/upload.controller';

const router = express.Router();

// Yükleme dizinini oluştur
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

// Dosya boyutu sınırı: 50MB
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Tüm dosya türlerine izin ver, gerekirse burada filtreleme yapılabilir
    cb(null, true);
  }
});

// Tüm rotalar için kimlik doğrulama gerekli
router.use(authenticate);

/**
 * @route POST /api/uploads
 * @desc Dosya yükleme
 * @access Private
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Yüklenecek dosya bulunamadı' });
    }

    // Kullanıcı bilgilerini al
    const userId = req.user.id;
    
    // Dosya URL'ini oluştur
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Yanıt oluştur
    const response = {
      success: true,
      data: {
        fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        userId
      }
    };
    
    console.log(`[Upload API] Dosya yüklendi: ${req.file.originalname}, URL: ${fileUrl}`);
    return res.status(201).json(response);
  } catch (error) {
    console.error('[Upload API] Dosya yükleme hatası:', error);
    return errorHandler(error, req, res);
  }
});

/**
 * @route GET /api/uploads/:filename
 * @desc Dosya indirme
 * @access Public
 */
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);
    
    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }
    
    // Dosyayı gönder
    return res.sendFile(filePath);
  } catch (error) {
    console.error('[Upload API] Dosya indirme hatası:', error);
    return errorHandler(error, req, res);
  }
});

/**
 * @route DELETE /api/uploads/:filename
 * @desc Dosya silme
 * @access Private
 */
router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);
    
    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }
    
    // Dosyayı sil
    fs.unlinkSync(filePath);
    
    return res.json({
      success: true,
      message: 'Dosya başarıyla silindi'
    });
  } catch (error) {
    console.error('[Upload API] Dosya silme hatası:', error);
    return errorHandler(error, req, res);
  }
});

// POST /api/upload
router.post('/', uploadFile);

export default router; 