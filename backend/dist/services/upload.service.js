"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureMulter = exports.getMulterFileFilter = exports.getMulterStorage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Yükleme klasörlerinin yolları
const UPLOAD_DIRS = {
    profile: path_1.default.join(__dirname, '../../uploads/profile'),
    documents: path_1.default.join(__dirname, '../../uploads/documents'),
    // Gerekirse diğer tipler için de eklenebilir
};
// Klasörlerin var olduğundan emin ol
Object.values(UPLOAD_DIRS).forEach(dir => {
    try {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
            console.log(`Upload directory created: ${dir}`);
        }
    }
    catch (error) {
        console.error(`Upload directory creation failed: ${dir}`, error);
        throw new Error(`Yükleme klasörü oluşturulamadı: ${dir}`);
    }
});
/**
 * Multer için dosya kaydetme yapılandırması.
 * Dosyaları ilgili klasöre (profile/documents) kaydeder ve benzersiz bir isim verir.
 * @param type Yükleme tipi ('profile' veya 'documents')
 * @returns Multer StorageEngine
 */
const getMulterStorage = (type) => {
    if (!UPLOAD_DIRS[type]) {
        throw new Error(`Invalid upload type specified: ${type}`);
    }
    return multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOAD_DIRS[type]); // Dosyanın kaydedileceği klasör
        },
        filename: (req, file, cb) => {
            // Benzersiz dosya adı: timestamp-orijinal_ad
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path_1.default.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + extension);
        }
    });
};
exports.getMulterStorage = getMulterStorage;
/**
 * Dosya filtreleme fonksiyonu (örnek: sadece resim veya belirli döküman tipleri).
 * @param type Yükleme tipi ('profile' veya 'documents')
 * @returns Multer FileFilterCallback
 */
const getMulterFileFilter = (type) => {
    return (req, file, cb) => {
        if (type === 'profile') {
            // Sadece resim dosyalarına izin ver
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            }
            else {
                cb(new Error('Sadece resim dosyaları yüklenebilir (profile).'));
            }
        }
        else if (type === 'documents') {
            // İzin verilen döküman tipleri
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                'image/jpeg',
                'image/png',
                'application/vnd.ms-excel', // .xls
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
            ];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new Error('İzin verilmeyen dosya tipi (documents). İzin verilenler: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX'));
            }
        }
        else {
            // Diğer tipler için varsayılan olarak kabul et (veya hata fırlat)
            cb(null, true);
        }
    };
};
exports.getMulterFileFilter = getMulterFileFilter;
const configureMulter = (type, limits) => {
    return (0, multer_1.default)({
        storage: (0, exports.getMulterStorage)(type),
        fileFilter: (0, exports.getMulterFileFilter)(type),
        limits: limits !== null && limits !== void 0 ? limits : { fileSize: 5 * 1024 * 1024 } // Varsayılan 5MB limit
    });
};
exports.configureMulter = configureMulter;
