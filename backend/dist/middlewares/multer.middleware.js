"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleFiles = exports.uploadSingleFile = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Bellek depolama kullanıyoruz, dosyalar req.file.buffer içinde saklanacak
const storage = multer_1.default.memoryStorage();
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
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Desteklenmeyen dosya formatı. Lütfen geçerli bir dosya seçin.'));
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
exports.uploadMultipleFiles = exports.upload.array('files', 5); // Maksimum 5 dosya 
