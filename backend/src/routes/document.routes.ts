import express from 'express';
import { 
  getAllDocuments, 
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument
} from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Tüm rotalar için kimlik doğrulama gerekli
router.use(authenticate);

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

// GET /api/documents
router.get('/', getAllDocuments);

// GET /api/documents/:id
router.get('/:id', getDocumentById);

// POST /api/documents
router.post('/', createDocument);

// PUT /api/documents/:id
router.put('/:id', updateDocument);

// DELETE /api/documents/:id
router.delete('/:id', deleteDocument);

// GET /api/documents/:id/download
router.get('/:id/download', downloadDocument);

// POST /api/documents/upload - Doküman yükleme endpoint'i
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Yüklenecek dosya bulunamadı' });
    }

    // Kullanıcı bilgilerini al
    const userId = req.user.id;
    
    // Dosya URL'ini oluştur
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Form verilerinden diğer bilgileri al
    const { name, description, category, folderId } = req.body;
    
    // Doküman veritabanı kaydını oluştur
    const document = await prisma.document.create({
      data: {
        name: name || req.file.originalname,
        description: description || '',
        fileUrl,
        type: 'file',
        size: req.file.size,
        mimeType: req.file.mimetype,
        category: category || null,
        folderId: folderId === 'root' ? null : folderId || null,
        createdById: userId
      }
    });
    
    console.log(`[Document API] Doküman yüklendi: ${name || req.file.originalname}, URL: ${fileUrl}`);
    return res.status(201).json(document);
  } catch (error) {
    console.error('[Document API] Doküman yükleme hatası:', error);
    return res.status(500).json({ 
      error: 'Doküman yüklenirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata' 
    });
  }
});

export default router; 