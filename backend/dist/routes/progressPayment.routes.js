"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const progressPayment_controller_1 = require("../controllers/progressPayment.controller");
const router = express_1.default.Router();
// Önce özel rotalar
// Proje finansal özetini getir
router.get('/projects/:projectId/financial-summary', progressPayment_controller_1.getProjectFinancialSummary);
// Hakediş durumu güncelle
router.put('/:id/status', progressPayment_controller_1.updateProgressPaymentStatus);
// Sonra genel rotalar
// Tüm hakedişleri getir (opsiyonel projectId filtresi ile)
router.get('/', progressPayment_controller_1.getAllProgressPayments);
// Yeni hakediş oluştur
router.post('/', progressPayment_controller_1.createProgressPayment);
// En son ID parametresi içeren basit rotalar
// Hakediş güncelle
router.put('/:id', progressPayment_controller_1.updateProgressPayment);
// Hakediş sil
router.delete('/:id', progressPayment_controller_1.deleteProgressPayment);
// Belirli bir hakediş getir (en sona koyuyoruz çünkü :id tüm path'leri yakalayabilir)
router.get('/:id', progressPayment_controller_1.getProgressPaymentById);
exports.default = router;
