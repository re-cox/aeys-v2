const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Hakediş dosyaları için yükleme dizini
const hakedisUploadDir = path.join(__dirname, '..', '..', 'uploads', 'hakedis');

// Dizin yoksa oluştur
if (!fs.existsSync(hakedisUploadDir)) {
  fs.mkdirSync(hakedisUploadDir, { recursive: true });
}

// Dosya depolama konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // İsteğe bağlı olarak farklı klasörlere kaydet
    if (req.baseUrl.includes('/progress-payments')) {
      cb(null, hakedisUploadDir);
    } else {
      // Varsayılan upload klasörü
      const uploadDir = path.join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    }
  },
  filename: function (req, file, cb) {
    // Benzersiz dosya adı oluştur
    const uniqueFileName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
  // İzin verilen dosya türleri
  const allowedFileTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];
  
  // Dosya türü kontrol
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya türü. Lütfen PDF, Word, Excel, resim veya metin dosyası yükleyin.'), false);
  }
};

// Multer konfigürasyonu
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

module.exports = upload; 