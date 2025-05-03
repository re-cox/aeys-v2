import { Request, Response } from 'express';
import { errorLogger } from '../utils/errorLogger';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Yükleme klasörünü oluştur
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Depolama konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const fileExt = path.extname(file.originalname);
    const safeFileName = file.originalname
      .replace(/[^a-zA-Z0-9.]/g, '_') // Alfanumerik olmayan karakterleri underscore ile değiştir
      .replace(/_+/g, '_') // Birden fazla underscore'u tek underscore yap
      .replace(fileExt, '') // Uzantıyı kaldır
      .slice(0, 50); // Maksimum 50 karakter
    
    const finalFileName = `${safeFileName}-${uniqueSuffix}${fileExt}`;
    cb(null, finalFileName);
  }
});

// MIME tipi filtreleme
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Kabul edilen MIME tipleri
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'text/plain',
    'text/csv',
    'text/html',
    'text/xml',
    'application/json',
    'application/xml'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Desteklenmeyen dosya tipi: ${file.mimetype}`));
  }
};

// Maksimum dosya boyutu (20MB)
const limits = {
  fileSize: 20 * 1024 * 1024
};

// Multer konfigürasyonunu oluştur
const upload = multer({ 
  storage, 
  fileFilter,
  limits
}).single('file');

/**
 * Dosya yükleme işlemi
 * POST /api/upload
 */
export const uploadFile = (req: Request, res: Response) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer hatası (boyut aşımı vb.)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'Dosya boyutu çok büyük (maksimum 20MB)' 
        });
      }
      errorLogger('Dosya yüklenirken Multer hatası', err);
      return res.status(400).json({ 
        error: `Dosya yükleme hatası: ${err.message}` 
      });
    } else if (err) {
      // Diğer hatalar
      errorLogger('Dosya yüklenirken hata', err);
      return res.status(500).json({ 
        error: `Dosya yüklenirken bir hata oluştu: ${err.message}` 
      });
    }
    
    // Dosya yükleme başarılı
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Dosya bulunamadı' });
    }
    
    // Dosya URL'ini oluştur
    const fileUrl = `/uploads/documents/${file.filename}`;
    
    // Yanıt gönder
    return res.status(200).json({
      fileUrl,
      fileName: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    });
  });
}; 