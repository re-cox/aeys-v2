import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; // Path modülünü import et
import departmentRoutes from './routes/department.routes';
import userRoutes from './routes/user.routes';
import employeeRoutes from './routes/employee.routes'; // Yeni employee route'larını import et
import teknisyenRaporRoutes from './routes/teknisyen-rapor.routes';
import roleRoutes from './routes/role.routes'; // Yorumu kaldırıldı
// import { errorHandler } from './middleware/errorHandler'; // Yorum satırı - Dosya bulunamadı
import { errorHandler } from './utils/error-handler'; // Yeni hata middleware'ini import et
import customerRoutes from './routes/customers.routes'; // Doğru olan bu
import proposalRoutes from './routes/proposal.routes'; // Yorum kaldırıldı
import edasRoutes from './routes/edas.routes'; // EDAS rotalarını import et
import folderRoutes from './routes/folder.routes'; // Klasör rotaları
import documentRoutes from './routes/document.routes'; // Döküman rotaları
import uploadRoutes from './routes/upload.routes'; // Dosya yükleme rotaları
import fileUpload from 'express-fileupload'; // Dosya yükleme paketi
import attendanceRoutes from './routes/attendance.routes';
import authRoutes from './routes/auth.routes';
import hakedisRoutes from './routes/hakedis.routes'; // Yeni hakediş route'larını import et
import { requestLogger } from './middlewares/req-logger.middleware'; // Request logger middleware

dotenv.config();

const app = express();

// CORS ayarları (Frontend adresine izin ver)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Varsayılan frontend portu 3000 olarak düzeltildi
  optionsSuccessStatus: 200 
};
// CORS middleware'ini tüm istekler için başta uygula
app.use(cors(corsOptions)); 

// Body parser middleware'leri - FormData için gerekli
app.use(express.json({ limit: '50mb' })); // JSON boyut limitini artır (Base64 için)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Dosya yükleme middleware'i
app.use(fileUpload({
  useTempFiles: false,
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  debug: true, // Her zaman debug aktif
  parseNested: true // Nested fields için parse etmeyi aktifleştir
}));

// Request logger middleware'i
app.use(requestLogger);

// --- Statik Dosya Sunumu --- 
// backend/public klasörünü statik olarak sun
// CORS artık başta uygulandığı için buradaki istekler de kapsanacak
app.use(express.static(path.join(__dirname, '../public'))); 
console.log(`Static files served from: ${path.join(__dirname, '../public')}`);

// uploads klasörünü /uploads URL yolundan statik olarak sun
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log(`Static files served from: ${path.join(__dirname, '../uploads')} mapped to /uploads`);

// ---------------------------

// API Rotaları
app.get('/api', (req, res) => {
    res.send('AEYS Backend API Çalışıyor!');
});

app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes); // Yeni employee route'larını kullan
app.use('/api/teknisyen-raporlari', teknisyenRaporRoutes);

// Orijinal rol route'u tekrar aktif edildi (ama 404 verebilir)
app.use('/api/roles', roleRoutes);
app.use('/api/customers', customerRoutes); // Yeni customer route'larını kullan (doğru yere taşındı)
app.use('/api/proposals', proposalRoutes); // Yorum kaldırıldı
app.use('/api', edasRoutes); // EDAS rotaları
app.use('/api/folders', folderRoutes); // Klasör rotaları eklendi
app.use('/api/documents', documentRoutes); // Döküman rotaları eklendi
app.use('/api/uploads', uploadRoutes); // Dosya yükleme rotaları eklendi
app.use('/api/attendances', attendanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress-payments', hakedisRoutes); // Yeni hakediş route'larını kullan

// 404 - Bulunamayan Rotalar
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `${req.method} ${req.originalUrl} bulunamadı.`
  });
});

// Genel Hata Yakalayıcı Middleware
app.use(errorHandler);

export default app; 