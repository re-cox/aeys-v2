import { Router, RequestHandler } from 'express';
import * as employeeController from '../controllers/employee.controller';
import { configureMulter } from '../services/upload.service';
import { protect } from '../middlewares/auth.middleware';

// Profil resmi için Multer yapılandırması (tek dosya, ~2MB limit)
const uploadProfile = configureMulter('profile', { fileSize: 2 * 1024 * 1024 }); 

// Dökümanlar için Multer yapılandırması (çoklu dosya, ~5MB limit)
const uploadDocuments = configureMulter('documents', { fileSize: 5 * 1024 * 1024 });

const router = Router();

// Tüm personelleri getir
router.get(
    '/',
    protect as RequestHandler,
    employeeController.getAllEmployees as RequestHandler
);

// Personel oluştur
router.post(
    '/',
    protect as RequestHandler,
    employeeController.createEmployee as RequestHandler
);

// ID'ye göre personel getir
router.get(
    '/:employeeId',
    protect as RequestHandler,
    employeeController.getEmployeeById as RequestHandler
);

// Personel bilgilerini güncelle
router.put(
    '/:employeeId',
    protect as RequestHandler,
    employeeController.updateEmployee as RequestHandler
);

// Personeli sil
router.delete(
    '/:employeeId',
    protect as RequestHandler,
    employeeController.deleteEmployee as RequestHandler
);

// Profil fotoğrafı yükleme endpoint'i
// Önce protect, sonra multer middleware çalışır
// upload.single('profilePicture') -> 'profilePicture' alanı frontend'deki FormData ile eşleşmeli
router.post(
    '/:employeeId/profile-picture',
    protect as RequestHandler,
    uploadProfile.single('profilePicture'),
    employeeController.uploadProfilePicture as RequestHandler
);

// Personel dökümanları yükleme endpoint'i
// Önce protect, sonra multer middleware çalışır
// upload.array('documents', 10) -> 'documents' alanı frontend'deki FormData ile eşleşmeli, max 10 dosya
router.post(
    '/:employeeId/documents',
    protect as RequestHandler,
    uploadDocuments.array('documents', 10),
    employeeController.uploadEmployeeDocuments as RequestHandler
);

// TODO: Diğer employee route'ları (GET /:id, PUT /:id, DELETE /:id) buraya eklenebilir

export default router; 