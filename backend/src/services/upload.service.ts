import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Yükleme klasörlerinin yolları
const UPLOAD_DIRS = {
    profile: path.join(__dirname, '../../uploads/profile'),
    documents: path.join(__dirname, '../../uploads/documents'),
    // Gerekirse diğer tipler için de eklenebilir
};

// Klasörlerin var olduğundan emin ol
Object.values(UPLOAD_DIRS).forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Upload directory created: ${dir}`);
        }
    } catch (error) {
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
export const getMulterStorage = (type: keyof typeof UPLOAD_DIRS): multer.StorageEngine => {
     if (!UPLOAD_DIRS[type]) {
        throw new Error(`Invalid upload type specified: ${type}`);
    }
    
    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOAD_DIRS[type]); // Dosyanın kaydedileceği klasör
        },
        filename: (req, file, cb) => {
            // Benzersiz dosya adı: timestamp-orijinal_ad
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + extension);
        }
    });
};


/**
 * Dosya filtreleme fonksiyonu (örnek: sadece resim veya belirli döküman tipleri).
 * @param type Yükleme tipi ('profile' veya 'documents')
 * @returns Multer FileFilterCallback
 */
export const getMulterFileFilter = (type: keyof typeof UPLOAD_DIRS): multer.Options['fileFilter'] => {
    return (req, file, cb) => {
        if (type === 'profile') {
            // Sadece resim dosyalarına izin ver
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                 cb(new Error('Sadece resim dosyaları yüklenebilir (profile).'));
            }
        } else if (type === 'documents') {
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
            } else {
                cb(new Error('İzin verilmeyen dosya tipi (documents). İzin verilenler: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX'));
            }
        } else {
            // Diğer tipler için varsayılan olarak kabul et (veya hata fırlat)
             cb(null, true); 
        }
    };
};


// TODO: Dosyayı işlemek ve URL'sini döndürmek için asıl fonksiyon.
// Bu fonksiyon, dosyayı aldıktan sonra (örn. S3'e yükleme, veritabanına referans ekleme vb.)
// dosyanın erişilebilir URL'sini döndürmelidir. Şimdilik controller tarafında geçici URL kullanılıyor.
/*
export const handleUpload = async (file: Express.Multer.File, type: keyof typeof UPLOAD_DIRS): Promise<string> => {
    // 1. Dosyayı al (zaten kaydedilmiş durumda multer.diskStorage ile)
    const filePath = file.path; 

    // 2. Gerekirse dosyayı başka bir yere taşı/yükle (örn. cloud storage)
    // const uploadResult = await uploadToCloudStorage(filePath, type);
    // const publicUrl = uploadResult.url;

    // 3. Dosyanın erişilebilir URL'sini oluştur/döndür
    // Basit lokal storage için:
    const relativePath = path.relative(path.join(__dirname, '../../'), filePath);
    // Windows yollarını web uyumlu hale getir
    const webPath = relativePath.replace(/\/g, '/'); 
    const fileUrl = `/uploads/${webPath}`; // Uygulamanızın statik dosya sunumuna göre ayarlayın

    // 4. İsteğe bağlı: Orijinal geçici dosyayı sil (eğer cloud'a yüklendiyse)
    // fs.unlinkSync(filePath);

    console.log(`File handled: ${file.originalname}, Type: ${type}, URL: ${fileUrl}`);
    return fileUrl; 
};
*/

// Multer yapılandırmasını dışa aktarmak için yardımcı bir fonksiyon
// Bu, route dosyalarında daha temiz kullanım sağlar.
import { Options } from 'multer';

export const configureMulter = (type: keyof typeof UPLOAD_DIRS, limits?: Options['limits']): multer.Multer => {
    return multer({ 
        storage: getMulterStorage(type),
        fileFilter: getMulterFileFilter(type),
        limits: limits ?? { fileSize: 5 * 1024 * 1024 } // Varsayılan 5MB limit
    });
}; 