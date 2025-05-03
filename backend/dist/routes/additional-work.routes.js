"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Tüm rotalar için kimlik doğrulama gerekli
router.use(auth_middleware_1.authenticate);
/**
 * @route GET /api/additional-works
 * @desc İlave işleri listele
 * @access Private
 */
router.get('/', (req, res) => {
    // İleride implementasyon eklenecek
    res.status(200).json({ message: 'İlave iş listesi' });
});
/**
 * @route POST /api/additional-works
 * @desc Yeni ilave iş oluştur
 * @access Private
 */
router.post('/', (req, res) => {
    // İleride implementasyon eklenecek
    res.status(201).json({ message: 'İlave iş oluşturuldu' });
});
exports.default = router;
