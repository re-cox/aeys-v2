"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const prisma_1 = require("./lib/prisma");
// Routes import
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const teknisyen_rapor_routes_1 = __importDefault(require("./routes/teknisyen-rapor.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
const annualLeave_routes_1 = __importDefault(require("./routes/annualLeave.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const marketing_activities_routes_1 = __importDefault(require("./routes/marketing-activities.routes"));
const edas_routes_1 = __importDefault(require("./routes/edas.routes"));
const folder_routes_1 = __importDefault(require("./routes/folder.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: env_1.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// Dosya yüklemeleri için uploads klasörünü statik hale getir
const uploadsPath = path_1.default.join(__dirname, '..', 'uploads');
console.log(`Serving static files from: ${uploadsPath}`);
app.use('/uploads', express_1.default.static(uploadsPath));
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/folders', folder_routes_1.default);
app.use('/api/documents', document_routes_1.default);
app.use('/api/uploads', upload_routes_1.default);
app.use('/api/employees', employee_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/teknisyen-raporlar', teknisyen_rapor_routes_1.default);
app.use('/api/attendances', attendance_routes_1.default);
app.use('/api/annual-leaves', annualLeave_routes_1.default);
app.use('/api/customers', customer_routes_1.default);
app.use('/api/marketing-activities', marketing_activities_routes_1.default);
app.use('/api/edas', edas_routes_1.default);
// Sağlık kontrolü
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: env_1.env.NODE_ENV });
});
// Veritabanı bağlantı testi
app.get('/api/db-test', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.$connect();
        res.status(200).json({ status: 'Veritabanı bağlantısı başarılı' });
    }
    catch (error) {
        console.error('Veritabanı bağlantı hatası:', error);
        res.status(500).json({ status: 'error', message: 'Veritabanı bağlantısı başarısız' });
    }
}));
// Ana rota
app.get('/', (req, res) => {
    res.send('Aydem Elektrik Yönetim Sistemi API');
});
// API rotalarını burada ekleyeceğiz
// import userRoutes from './routes/userRoutes';
// app.use('/api/users', userRoutes);
// Sunucuyu başlat
app.listen(env_1.env.PORT, () => {
    console.log(`Sunucu ${env_1.env.PORT} portunda çalışıyor`);
});
