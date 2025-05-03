"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const progressPayment_controller_1 = require("../controllers/progressPayment.controller");
const router = express_1.default.Router();
// Tüm hakedişleri getir (opsiyonel projectId filtresi ile)
router.get('/', progressPayment_controller_1.getAllProgressPayments);
// Belirli bir hakediş detayını getir
router.get('/:id', progressPayment_controller_1.getProgressPaymentById);
// Yeni hakediş oluştur
router.post('/', progressPayment_controller_1.createProgressPayment);
// Hakediş güncelle
router.put('/:id', progressPayment_controller_1.updateProgressPayment);
// Hakediş sil
router.delete('/:id', progressPayment_controller_1.deleteProgressPayment);
// Hakediş durumunu güncelle
router.put('/:id/status', progressPayment_controller_1.updateProgressPaymentStatus);
// Proje finansal özetini getir
router.get('/projects/:id/financial-summary', progressPayment_controller_1.getProjectFinancialSummary);
exports.default = router;
