import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import departmentRoutes from './routes/department.routes';
import userRoutes from './routes/user.routes';
import attendanceRoutes from './routes/attendance.routes';

// Ortam değişkenlerini yükle
dotenv.config();

const app = express();

// Body parser middleware
app.use(express.json());

// CORS Middleware (Frontend'den gelen isteklere izin vermek için önemli)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// ... (diğer middleware'ler: logger, helmet vs.)

// API Rotaları
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendances', attendanceRoutes);

// ... (hata yönetimi middleware'i)

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Backend sunucusu ${PORT} portunda çalışıyor`);
});

// Opsiyonel: Global hata yakalayıcı
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Uygulamayı kapatma veya başka işlemler yapılabilir
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  // Uygulamayı kapatma veya başka işlemler yapılabilir
  process.exit(1);
}); 