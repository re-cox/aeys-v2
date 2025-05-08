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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employeeController = __importStar(require("../controllers/employee.controller"));
const upload_service_1 = require("../services/upload.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// Profil resmi için Multer yapılandırması (tek dosya, ~2MB limit)
const uploadProfile = (0, upload_service_1.configureMulter)('profile', { fileSize: 2 * 1024 * 1024 });
// Dökümanlar için Multer yapılandırması (çoklu dosya, ~5MB limit)
const uploadDocuments = (0, upload_service_1.configureMulter)('documents', { fileSize: 5 * 1024 * 1024 });
const router = (0, express_1.Router)();
// Tüm personelleri getir
router.get('/', auth_middleware_1.protect, employeeController.getAllEmployees);
// Personel oluştur
router.post('/', auth_middleware_1.protect, employeeController.createEmployee);
// ID'ye göre personel getir
router.get('/:employeeId', auth_middleware_1.protect, employeeController.getEmployeeById);
// Personel bilgilerini güncelle
router.put('/:employeeId', auth_middleware_1.protect, employeeController.updateEmployee);
// Personeli sil
router.delete('/:employeeId', auth_middleware_1.protect, employeeController.deleteEmployee);
// Profil fotoğrafı yükleme endpoint'i
// Önce protect, sonra multer middleware çalışır
// upload.single('profilePicture') -> 'profilePicture' alanı frontend'deki FormData ile eşleşmeli
router.post('/:id/profile-picture', auth_middleware_1.protect, uploadProfile.single('profilePicture'), employeeController.uploadProfilePicture);
// Personel dökümanları yükleme endpoint'i
// Önce protect, sonra multer middleware çalışır
// upload.array('documents', 10) -> 'documents' alanı frontend'deki FormData ile eşleşmeli, max 10 dosya
router.post('/:employeeId/documents', auth_middleware_1.protect, uploadDocuments.array('documents', 10), employeeController.uploadEmployeeDocuments);
// TODO: Diğer employee route'ları (GET /:id, PUT /:id, DELETE /:id) buraya eklenebilir
exports.default = router;
