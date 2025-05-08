import { Router, RequestHandler } from 'express';
import * as teknisyenRaporController from '../controllers/teknisyen-rapor.controller';
// import { protect } from '../middleware/auth.middleware'; // Yorum satırı yapıldı
import { configureMulter } from '../services/upload.service';

// Tek dosya yükleme için Multer instance (örneğin, rapor dokümanları için)
const uploadSingleFile = configureMulter('documents', { fileSize: 5 * 1024 * 1024 }); // 5MB limit

const router = Router();

// Basit bir test rotası - BU ÇALIŞIYOR MU DİYE KONTROL EDEBİLİRİZ
router.get('/ping', (req, res) => {
  console.log('[TeknisyenRaporRoutes] 👋 /ping isteği alındı - TEST ÇALIŞIYOR!');
  res.status(200).json({ message: 'pong from teknisyen-rapor.routes', success: true, timestamp: new Date().toISOString() });
});

// Tüm route'larda kimlik doğrulama uygula
// router.use(protect as RequestHandler); // Yorum satırı yapıldı

// Personel listesini getir (teknisyen seçimi için)
router.get('/personeller/listele', teknisyenRaporController.getPersoneller as RequestHandler);

// Rapor için doküman yükleme
router.post('/dokuman/yukle', uploadSingleFile.single('file'), teknisyenRaporController.uploadTeknisyenDokuman as RequestHandler);

// Rapor dokümanını silme
router.delete('/dokuman/:id', teknisyenRaporController.deleteTeknisyenDokuman as RequestHandler);

// Teknisyen Raporları CRUD işlemleri
router.get('/', teknisyenRaporController.getTeknisyenRaporlari as RequestHandler);
router.get('/:id', teknisyenRaporController.getTeknisyenRaporu as RequestHandler);
router.post('/', teknisyenRaporController.createTeknisyenRaporu as RequestHandler);
router.put('/:id', teknisyenRaporController.updateTeknisyenRaporu as RequestHandler);
router.delete('/:id', teknisyenRaporController.deleteTeknisyenRaporu as RequestHandler);

export default router; 