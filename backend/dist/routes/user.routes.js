"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const employeeController = __importStar(require("../controllers/employee.controller"));
const router = (0, express_1.Router)();
// --- Multer Yapılandırması ---
// Yükleme klasör yolları
const PROFILE_UPLOAD_DIRECTORY = path_1.default.join(__dirname, '../../uploads/profile-pictures');
const DOCUMENT_UPLOAD_DIRECTORY = path_1.default.join(__dirname, '../../uploads/documents');
// Yükleme dizinlerini kontrol et ve oluştur
[PROFILE_UPLOAD_DIRECTORY, DOCUMENT_UPLOAD_DIRECTORY].forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
        console.log(`Upload directory created: ${dir}`);
    }
});
// Profil resimleri için depolama yapılandırması
const profileStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PROFILE_UPLOAD_DIRECTORY);
    },
    filename: (req, file, cb) => {
        // Benzersiz dosya adı: userId-timestamp.ext
        const userId = req.params.id || 'unknown'; // Parametre henüz gelmemiş olabilir ama güvenlik için
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, `${userId}-${uniqueSuffix}${extension}`);
    }
});
// Dokümanlar için depolama yapılandırması
const documentStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DOCUMENT_UPLOAD_DIRECTORY);
    },
    filename: (req, file, cb) => {
        const userId = req.params.id || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, `${userId}-${uniqueSuffix}${extension}`);
    }
});
// Profil resimleri için dosya filtresi (sadece resimlere izin ver)
const profileFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
};
// Dokümanlar için dosya filtresi (çeşitli dosya tiplerine izin ver)
const documentFileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new Error('Desteklenmeyen dosya formatı. İzin verilen formatlar: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT'), false);
    }
};
// Multer upload middleware'leri
const profileUpload = (0, multer_1.default)({
    storage: profileStorage,
    fileFilter: profileFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const documentUpload = (0, multer_1.default)({
    storage: documentStorage,
    fileFilter: documentFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
// --- Multer Yapılandırması Sonu ---
// Kullanıcı Rotaları
// POST /api/users - Yeni kullanıcı ve personel oluşturur
router.post('/', auth_middleware_1.protect, user_controller_1.createUser);
// GET /api/users - Tüm kullanıcıları listeler
router.get('/', auth_middleware_1.protect, user_controller_1.getUsers);
// GET /api/users/:id - Belirli bir kullanıcıyı getirir
router.get('/:id', auth_middleware_1.protect, user_controller_1.getUserById);
// PUT /api/users/:id - Kullanıcı ve personel bilgilerini günceller
router.put('/:id', auth_middleware_1.protect, user_controller_1.updateUser);
// POST /api/users/:id/profile-picture - Kullanıcının profil resmini yükler/günceller
router.post('/:id/profile-picture', auth_middleware_1.protect, profileUpload.single('profilePicture'), // 'profilePicture' frontend'den gelen field adı olmalı
user_controller_1.uploadProfilePicture);
// POST /api/users/:id/profile-image - Kullanıcının base64 profil resmini yükler/günceller
router.post('/:id/profile-image', auth_middleware_1.protect, user_controller_1.uploadProfileImage);
// POST /api/users/:id/documents - Kullanıcının belge yükler
router.post('/:id/documents', auth_middleware_1.protect, documentUpload.array('documents', 10), // Doküman yükleme için ayrı bir upload middleware kullanıyoruz
employeeController.uploadEmployeeDocuments);
// DELETE /api/users/:id - Kullanıcıyı siler
// router.delete('/:id', protect, authorize(['admin']), deleteUser);
exports.default = router;
