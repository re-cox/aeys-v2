import { Router, RequestHandler } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { 
  createUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  uploadProfilePicture, 
  uploadProfileImage 
} from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import * as employeeController from '../controllers/employee.controller';

const router = Router();

// --- Multer Yapılandırması ---
// Yükleme klasör yolları
const PROFILE_UPLOAD_DIRECTORY = path.join(__dirname, '../../uploads/profile-pictures');
const DOCUMENT_UPLOAD_DIRECTORY = path.join(__dirname, '../../uploads/documents');

// Yükleme dizinlerini kontrol et ve oluştur
[PROFILE_UPLOAD_DIRECTORY, DOCUMENT_UPLOAD_DIRECTORY].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Upload directory created: ${dir}`);
}
});

// Profil resimleri için depolama yapılandırması
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PROFILE_UPLOAD_DIRECTORY);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı: userId-timestamp.ext
    const userId = req.params.id || 'unknown'; // Parametre henüz gelmemiş olabilir ama güvenlik için
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${userId}-${uniqueSuffix}${extension}`);
  }
});

// Dokümanlar için depolama yapılandırması
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOCUMENT_UPLOAD_DIRECTORY);
  },
  filename: (req, file, cb) => {
    const userId = req.params.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${userId}-${uniqueSuffix}${extension}`);
  }
});

// Profil resimleri için dosya filtresi (sadece resimlere izin ver)
const profileFileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
  }
};

// Dokümanlar için dosya filtresi (çeşitli dosya tiplerine izin ver)
const documentFileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı. İzin verilen formatlar: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT'), false);
  }
};

// Multer upload middleware'leri
const profileUpload = multer({ 
  storage: profileStorage, 
  fileFilter: profileFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const documentUpload = multer({ 
  storage: documentStorage, 
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
// --- Multer Yapılandırması Sonu ---


// Kullanıcı Rotaları

// POST /api/users - Yeni kullanıcı ve personel oluşturur
router.post('/', protect as RequestHandler, createUser as RequestHandler);

// GET /api/users - Tüm kullanıcıları listeler
router.get('/', protect as RequestHandler, getUsers as RequestHandler);

// GET /api/users/:id - Belirli bir kullanıcıyı getirir
router.get('/:id', protect as RequestHandler, getUserById as RequestHandler);

// PUT /api/users/:id - Kullanıcı ve personel bilgilerini günceller
router.put('/:id', protect as RequestHandler, updateUser as RequestHandler);

// POST /api/users/:id/profile-picture - Kullanıcının profil resmini yükler/günceller
router.post(
  '/:id/profile-picture', 
  protect as RequestHandler, 
  profileUpload.single('profilePicture'), // 'profilePicture' frontend'den gelen field adı olmalı
  uploadProfilePicture as RequestHandler 
);

// POST /api/users/:id/profile-image - Kullanıcının base64 profil resmini yükler/günceller
router.post(
  '/:id/profile-image',
  protect as RequestHandler,
  uploadProfileImage as RequestHandler
);

// POST /api/users/:id/documents - Kullanıcının belge yükler
router.post(
  '/:id/documents',
  protect as RequestHandler,
  documentUpload.array('documents', 10), // Doküman yükleme için ayrı bir upload middleware kullanıyoruz
  employeeController.uploadEmployeeDocuments as RequestHandler
);

// DELETE /api/users/:id - Kullanıcıyı siler
// router.delete('/:id', protect, authorize(['admin']), deleteUser);

export default router; 