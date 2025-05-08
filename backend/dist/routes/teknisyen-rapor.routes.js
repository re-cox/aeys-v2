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
const teknisyenRaporController = __importStar(require("../controllers/teknisyen-rapor.controller"));
// import { protect } from '../middleware/auth.middleware'; // Yorum satırı yapıldı
const upload_service_1 = require("../services/upload.service");
// Tek dosya yükleme için Multer instance (örneğin, rapor dokümanları için)
const uploadSingleFile = (0, upload_service_1.configureMulter)('documents', { fileSize: 5 * 1024 * 1024 }); // 5MB limit
const router = (0, express_1.Router)();
// Basit bir test rotası - BU ÇALIŞIYOR MU DİYE KONTROL EDEBİLİRİZ
router.get('/ping', (req, res) => {
    console.log('[TeknisyenRaporRoutes] 👋 /ping isteği alındı - TEST ÇALIŞIYOR!');
    res.status(200).json({ message: 'pong from teknisyen-rapor.routes', success: true, timestamp: new Date().toISOString() });
});
// Tüm route'larda kimlik doğrulama uygula
// router.use(protect as RequestHandler); // Yorum satırı yapıldı
// Personel listesini getir (teknisyen seçimi için)
router.get('/personeller/listele', teknisyenRaporController.getPersoneller);
// Rapor için doküman yükleme
router.post('/dokuman/yukle', uploadSingleFile.single('file'), teknisyenRaporController.uploadTeknisyenDokuman);
// Rapor dokümanını silme
router.delete('/dokuman/:id', teknisyenRaporController.deleteTeknisyenDokuman);
// Teknisyen Raporları CRUD işlemleri
router.get('/', teknisyenRaporController.getTeknisyenRaporlari);
router.get('/:id', teknisyenRaporController.getTeknisyenRaporu);
router.post('/', teknisyenRaporController.createTeknisyenRaporu);
router.put('/:id', teknisyenRaporController.updateTeknisyenRaporu);
router.delete('/:id', teknisyenRaporController.deleteTeknisyenRaporu);
exports.default = router;
