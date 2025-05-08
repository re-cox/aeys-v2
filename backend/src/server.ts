import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import departmentRoutes from './routes/department.routes';
import userRoutes from './routes/user.routes';
import attendanceRoutes from './routes/attendance.routes';
// import progressPaymentRoutes from './routes/progressPayment.routes'; // Yorumlandı
import customerRoutes from './routes/customers.routes';
// import proposalRoutes from './routes/proposal.routes'; // Yorumlandı (Eğer import ediliyorsa)
import authRoutes from './routes/auth.routes';

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
// app.use('/api/progress-payments', progressPaymentRoutes); // Yorumlandı
app.use('/api/customers', customerRoutes);
// app.use('/api/proposals', proposalRoutes); // Yorumlandı (Eğer kullanılıyorsa)
app.use('/api/auth', authRoutes);

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