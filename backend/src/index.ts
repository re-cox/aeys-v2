import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { prisma } from './lib/prisma';

// Tüm route modüllerini import et
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import departmentRoutes from './routes/department.routes';
import employeeRoutes from './routes/employee.routes';
import attendanceRoutes from './routes/attendance.routes';
import folderRoutes from './routes/folder.routes';
import documentRoutes from './routes/document.routes';
import uploadRoutes from './routes/upload.routes';
import edasRoutes from './routes/edas.routes';
import additionalWorkRoutes from './routes/additional-work.routes';
import proposalRoutes from './routes/proposal.routes';
import purchasingRouter from './routes/purchasing.routes';

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

// Statik dosyalar için uploads klasörünü ekle
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log(`[Server] Static files served from: ${path.join(__dirname, '../uploads')} mapped to /uploads`);

// API Routes - tüm rotaları ekle
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/edas', edasRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/additional-works', additionalWorkRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/purchasing', purchasingRouter);

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
app.listen(env.PORT, () => {
  console.log(`Sunucu ${env.PORT} portunda çalışıyor`);
}); 