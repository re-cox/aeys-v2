import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

// Yüklenecek dosyaların kaydedileceği dizin
const UPLOAD_DIR = path.join(__dirname, '..', '../uploads/edas-documents');

// Dizin yoksa oluştur
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Disk depolama yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Dosya adının Türkçe karakterler veya boşluk içermemesini sağla
    const safeOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const fileExt = path.extname(safeOriginalName);
    const baseName = path.basename(safeOriginalName, fileExt);
    // Benzersiz bir dosya adı oluştur (uuid + orijinal ad + uzantı)
    const uniqueSuffix = uuidv4();
    // Dosya adında boşluk veya geçersiz karakterleri temizle
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const finalFileName = `${sanitizedBaseName}-${uniqueSuffix}${fileExt}`;
    cb(null, finalFileName);
  },
});

// Yükleme limitlerini ayarla
const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB maksimum dosya boyutu
};

// Dosya filtreleme
const fileFilter = (req: Request, file: MulterFile, cb: multer.FileFilterCallback) => {
  // İzin verilen dosya tipleri
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/acad', // DWG için ekleyelim (mime tipi değişebilir)
    'image/vnd.dwg', // DWG alternatif
    'application/dwg', // DWG alternatif
    'application/x-dwg', // DWG alternatif
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.warn(`[Multer Filter] Desteklenmeyen dosya tipi reddedildi: ${file.mimetype} (Orijinal ad: ${file.originalname})`);
    cb(null, false); // Hata vermek yerine dosyayı reddetmek daha iyi olabilir
    // cb(new Error('Desteklenmeyen dosya formatı. Lütfen geçerli bir dosya seçin.'));
  }
};

// Multer ayarları ile bir yükleyici oluştur
export const upload = multer({
  storage,
  limits,
  fileFilter,
});

// Tek dosya yükleme middleware'i
export const uploadSingleFile = upload.single('file');

// Çoklu dosya yükleme middleware'i
export const uploadMultipleFiles = upload.array('files', 10); // Maksimum 10 dosya (limit artırıldı) 