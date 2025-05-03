"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const folder_controller_1 = require("../controllers/folder.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Tüm rotalar için kimlik doğrulama gerekli
router.use(auth_middleware_1.authenticate);
/**
 * @route GET /api/folders
 * @desc Tüm klasörleri listele (filtreleme seçenekli)
 * @access Private
 */
router.get('/', folder_controller_1.getAllFolders);
/**
 * @route GET /api/folders/root/contents
 * @desc Kök klasör içeriğini getir (ana klasörler ve dokümanlar)
 * @access Private
 */
router.get('/root/contents', folder_controller_1.getRootContents);
/**
 * @route GET /api/folders/:id
 * @desc ID'ye göre klasör detaylarını getir
 * @access Private
 */
router.get('/:id', folder_controller_1.getFolderById);
/**
 * @route GET /api/folders/:id/contents
 * @desc Klasör içeriğini getir (alt klasörler ve dokümanlar)
 * @access Private
 */
router.get('/:id/contents', folder_controller_1.getFolderContents);
/**
 * @route POST /api/folders
 * @desc Yeni klasör oluştur
 * @access Private
 */
router.post('/', folder_controller_1.createFolder);
/**
 * @route PUT /api/folders/:id
 * @desc Klasör güncelle
 * @access Private
 */
router.put('/:id', folder_controller_1.updateFolder);
/**
 * @route DELETE /api/folders/:id
 * @desc Klasör sil
 * @access Private
 */
router.delete('/:id', folder_controller_1.deleteFolder);
exports.default = router;
