import express from 'express';
import { 
  getAllFolders, 
  getFolderById,
  getRootContents,
  getFolderContents,
  createFolder,
  updateFolder,
  deleteFolder
} from '../controllers/folder.controller';
import { authenticate } from '../middlewares/auth.middleware';
import errorHandler from '../utils/errorHandler';

const router = express.Router();

// Tüm rotalar için kimlik doğrulama gerekli
router.use(authenticate);

/**
 * @route GET /api/folders
 * @desc Tüm klasörleri listele (filtreleme seçenekli)
 * @access Private
 */
router.get('/', getAllFolders);

/**
 * @route GET /api/folders/root/contents
 * @desc Kök klasör içeriğini getir (ana klasörler ve dokümanlar)
 * @access Private
 */
router.get('/root/contents', getRootContents);

/**
 * @route GET /api/folders/:id
 * @desc ID'ye göre klasör detaylarını getir
 * @access Private
 */
router.get('/:id', getFolderById);

/**
 * @route GET /api/folders/:id/contents
 * @desc Klasör içeriğini getir (alt klasörler ve dokümanlar)
 * @access Private
 */
router.get('/:id/contents', getFolderContents);

/**
 * @route POST /api/folders
 * @desc Yeni klasör oluştur
 * @access Private
 */
router.post('/', createFolder);

/**
 * @route PUT /api/folders/:id
 * @desc Klasör güncelle
 * @access Private
 */
router.put('/:id', updateFolder);

/**
 * @route DELETE /api/folders/:id
 * @desc Klasör sil
 * @access Private
 */
router.delete('/:id', deleteFolder);

export default router; 