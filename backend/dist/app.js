"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path")); // Path modülünü import et
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes")); // Yeni employee route'larını import et
const teknisyen_rapor_routes_1 = __importDefault(require("./routes/teknisyen-rapor.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes")); // Yorumu kaldırıldı
// import { errorHandler } from './middleware/errorHandler'; // Yorum satırı - Dosya bulunamadı
const error_handler_1 = require("./utils/error-handler"); // Yeni hata middleware'ini import et
const customer_routes_1 = __importDefault(require("./routes/customer.routes")); // Yeni customer route'larını import et
const proposal_routes_1 = __importDefault(require("./routes/proposal.routes")); // Teklif rotalarını import et
const edas_routes_1 = __importDefault(require("./routes/edas.routes")); // EDAS rotalarını import et
const folder_routes_1 = __importDefault(require("./routes/folder.routes")); // Klasör rotaları
const document_routes_1 = __importDefault(require("./routes/document.routes")); // Döküman rotaları
const upload_routes_1 = __importDefault(require("./routes/upload.routes")); // Dosya yükleme rotaları
const express_fileupload_1 = __importDefault(require("express-fileupload")); // Dosya yükleme paketi
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS ayarları (Frontend adresine izin ver)
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Varsayılan frontend portu 3000 olarak düzeltildi
    optionsSuccessStatus: 200
};
// CORS middleware'ini tüm istekler için başta uygula
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '50mb' })); // JSON boyut limitini artır (Base64 için)
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// Dosya yükleme middleware'i
app.use((0, express_fileupload_1.default)({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true, // Parent klasörleri oluşturur
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    debug: process.env.NODE_ENV === 'development' // Geliştirme modunda debug aktif
}));
// --- Statik Dosya Sunumu --- 
// backend/public klasörünü statik olarak sun
// CORS artık başta uygulandığı için buradaki istekler de kapsanacak
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
console.log(`Static files served from: ${path_1.default.join(__dirname, '../public')}`);
// uploads klasörünü /uploads URL yolundan statik olarak sun
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
console.log(`Static files served from: ${path_1.default.join(__dirname, '../uploads')} mapped to /uploads`);
// ---------------------------
// API Rotaları
app.get('/api', (req, res) => {
    res.send('AEYS Backend API Çalışıyor!');
});
app.use('/api/departments', department_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/employees', employee_routes_1.default); // Yeni employee route'larını kullan
app.use('/api/teknisyen-raporlari', teknisyen_rapor_routes_1.default);
// Orijinal rol route'u tekrar aktif edildi (ama 404 verebilir)
app.use('/api/roles', role_routes_1.default);
app.use('/api/customers', customer_routes_1.default); // Yeni customer route'larını kullan (doğru yere taşındı)
app.use('/api/proposals', proposal_routes_1.default); // Teklif rotalarını kullan
app.use('/api', edas_routes_1.default); // EDAS rotaları
app.use('/api/folders', folder_routes_1.default); // Klasör rotaları eklendi
app.use('/api/documents', document_routes_1.default); // Döküman rotaları eklendi
app.use('/api/uploads', upload_routes_1.default); // Dosya yükleme rotaları eklendi
// 404 - Bulunamayan Rotalar
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `${req.method} ${req.originalUrl} bulunamadı.`
    });
});
// Genel Hata Yakalayıcı Middleware
app.use(error_handler_1.errorHandler);
exports.default = app;
