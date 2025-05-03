"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleFiles = exports.uploadSingleFile = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
// Yüklenecek dosyaların kaydedileceği dizin
const UPLOAD_DIR = path_1.default.join(__dirname, '..', '../uploads/edas-documents');
// Dizin yoksa oluştur
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// Disk depolama yapılandırması
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Dosya adının Türkçe karakterler veya boşluk içermemesini sağla
        const safeOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fileExt = path_1.default.extname(safeOriginalName);
        const baseName = path_1.default.basename(safeOriginalName, fileExt);
        // Benzersiz bir dosya adı oluştur (uuid + orijinal ad + uzantı)
        const uniqueSuffix = (0, uuid_1.v4)();
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
const fileFilter = (req, file, cb) => {
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
    }
    else {
        console.warn(`[Multer Filter] Desteklenmeyen dosya tipi reddedildi: ${file.mimetype} (Orijinal ad: ${file.originalname})`);
        cb(null, false); // Hata vermek yerine dosyayı reddetmek daha iyi olabilir
        // cb(new Error('Desteklenmeyen dosya formatı. Lütfen geçerli bir dosya seçin.'));
    }
};
// Multer ayarları ile bir yükleyici oluştur
exports.upload = (0, multer_1.default)({
    storage,
    limits,
    fileFilter,
});
// Tek dosya yükleme middleware'i
exports.uploadSingleFile = exports.upload.single('file');
// Çoklu dosya yükleme middleware'i
exports.uploadMultipleFiles = exports.upload.array('files', 10); // Maksimum 10 dosya (limit artırıldı) 
