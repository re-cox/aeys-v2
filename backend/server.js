const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('morgan');

// Route'ları içe aktar
const userRoutes = require('./routes/user.routes');
const progressPaymentRoutes = require('./routes/progressPayment.routes');
// Diğer route'lar...

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware'lar
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads klasörünü statik olarak sunma
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API route'ları
app.use('/api/users', userRoutes);
app.use('/api/progress-payments', progressPaymentRoutes);
// Diğer route'lar...

// API root
app.get('/api', (req, res) => {
  res.json({
    message: 'AEYS API çalışıyor',
    version: '1.0.0'
  });
});

// 404 - Not Found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'İstenen kaynak bulunamadı'
  });
});

// 500 - Hata yönetimi
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: err.message
  });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

module.exports = app; 