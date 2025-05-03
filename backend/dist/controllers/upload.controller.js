"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const errorLogger_1 = require("../utils/errorLogger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
// Yükleme klasörünü oluştur
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads', 'documents');
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// Depolama konfigürasyonu
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${(0, uuid_1.v4)()}`;
        const fileExt = path_1.default.extname(file.originalname);
        const safeFileName = file.originalname
            .replace(/[^a-zA-Z0-9.]/g, '_') // Alfanumerik olmayan karakterleri underscore ile değiştir
            .replace(/_+/g, '_') // Birden fazla underscore'u tek underscore yap
            .replace(fileExt, '') // Uzantıyı kaldır
            .slice(0, 50); // Maksimum 50 karakter
        const finalFileName = `${safeFileName}-${uniqueSuffix}${fileExt}`;
        cb(null, finalFileName);
    }
});
// MIME tipi filtreleme
const fileFilter = (req, file, cb) => {
    // Kabul edilen MIME tipleri
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/svg+xml',
        'text/plain',
        'text/csv',
        'text/html',
        'text/xml',
        'application/json',
        'application/xml'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Desteklenmeyen dosya tipi: ${file.mimetype}`));
    }
};
// Maksimum dosya boyutu (20MB)
const limits = {
    fileSize: 20 * 1024 * 1024
};
// Multer konfigürasyonunu oluştur
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits
}).single('file');
/**
 * Dosya yükleme işlemi
 * POST /api/upload
 */
const uploadFile = (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer_1.default.MulterError) {
            // Multer hatası (boyut aşımı vb.)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'Dosya boyutu çok büyük (maksimum 20MB)'
                });
            }
            (0, errorLogger_1.errorLogger)('Dosya yüklenirken Multer hatası', err);
            return res.status(400).json({
                error: `Dosya yükleme hatası: ${err.message}`
            });
        }
        else if (err) {
            // Diğer hatalar
            (0, errorLogger_1.errorLogger)('Dosya yüklenirken hata', err);
            return res.status(500).json({
                error: `Dosya yüklenirken bir hata oluştu: ${err.message}`
            });
        }
        // Dosya yükleme başarılı
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'Dosya bulunamadı' });
        }
        // Dosya URL'ini oluştur
        const fileUrl = `/uploads/documents/${file.filename}`;
        // Yanıt gönder
        return res.status(200).json({
            fileUrl,
            fileName: file.originalname,
            size: file.size,
            mimeType: file.mimetype
        });
    });
};
exports.uploadFile = uploadFile;
