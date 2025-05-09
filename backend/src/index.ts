import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fileUpload from 'express-fileupload';
import { env } from './config/env';
import { prisma } from './lib/prisma';

// Tüm route modüllerini import et
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import departmentRoutes from './routes/department.routes';
import employeeRoutes from './routes/employee.routes';
import taskRoutes from './routes/task.routes';
import projectRoutes from './routes/project.routes';
import customerRoutes from './routes/customers.routes';
import proposalRoutes from './routes/proposal.routes';
import uploadRoutes from './routes/upload.routes';
import folderRoutes from './routes/folder.routes';
import documentRoutes from './routes/document.routes';
import edasRoutes from './routes/edas.routes';
import purchasingRoutes from './routes/purchasing.routes';
import marketingRoutes from './routes/marketing-activities.routes';
import additionalWorkRoutes from './routes/additional-work.routes';
import progressPaymentRoutes from './routes/progressPayment.routes';
import annualLeaveRoutes from './routes/annualLeave.routes';
import attendanceRoutes from './routes/attendance.routes';
import teknisyenRaporRoutes from './routes/teknisyen-rapor.routes';

// Express uygulamasını oluştur
const app = express();

// Middleware'leri ayarla
app.use(cors({
  origin: env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Express fileupload middleware'ini ekle
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  debug: true // Geliştirme ortamında debug modu açık
}));

// Statik dosyalar için uploads klasörünü ekle
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log(`[Server] Static files served from: ${path.join(__dirname, '../uploads')} mapped to /uploads`);

// API Routes - tüm rotaları ekle
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/edas', edasRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/purchasing', purchasingRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/additional-work', additionalWorkRoutes);
app.use('/api/progress-payments', progressPaymentRoutes);
app.use('/api/annual-leaves', annualLeaveRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/test-raporlar', teknisyenRaporRoutes);

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: env.NODE_ENV });
});

// Veritabanı bağlantı testi
app.get('/api/db-test', async (req, res) => {
  try {
    await prisma.$connect();
    res.status(200).json({ status: 'Veritabanı bağlantısı başarılı' });
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
    res.status(500).json({ status: 'error', message: 'Veritabanı bağlantısı başarısız' });
  }
});

// Ana rota
app.get('/', (req, res) => {
  res.send('Aydem Elektrik Yönetim Sistemi API');
});

// Sunucuyu başlat
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, async () => {
  try {
    console.log(`🟢 Server listening on port ${PORT}`);
    
    // Veritabanı bağlantısını kontrol et
    await prisma.$connect();
    console.log('🟢 Database connection successful');
    
  } catch (error) {
    console.error('🔴 Server startup error:', error);
  }
});

// Güvenli kapatma için cleanup
const cleanup = async () => {
  console.log('🟡 Shutting down server...');
  
  // HTTP sunucusunu kapat
  server.close(() => {
    console.log('🟡 HTTP server closed');
  });
  
  // Veritabanı bağlantısını kapat
  try {
    await prisma.$disconnect();
    console.log('🟡 Database connection closed');
  } catch (e) {
    console.error('🔴 Error during database disconnection:', e);
  }
  
  // Dosya sürücüleri veya diğer kaynakları kapat
  // ...
  
  // İşlemi sonlandır
  process.exit(0);
};

// Kapatma sinyallerini yakala
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

export default server; 