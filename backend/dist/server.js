"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
// import progressPaymentRoutes from './routes/progressPayment.routes'; // Yorumlandı
const customers_routes_1 = __importDefault(require("./routes/customers.routes"));
// import proposalRoutes from './routes/proposal.routes'; // Yorumlandı (Eğer import ediliyorsa)
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
// Ortam değişkenlerini yükle
dotenv_1.default.config();
const app = (0, express_1.default)();
// Body parser middleware
app.use(express_1.default.json());
// CORS Middleware (Frontend'den gelen isteklere izin vermek için önemli)
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
// ... (diğer middleware'ler: logger, helmet vs.)
// API Rotaları
app.use('/api/departments', department_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/attendances', attendance_routes_1.default);
// app.use('/api/progress-payments', progressPaymentRoutes); // Yorumlandı
app.use('/api/customers', customers_routes_1.default);
// app.use('/api/proposals', proposalRoutes); // Yorumlandı (Eğer kullanılıyorsa)
app.use('/api/auth', auth_routes_1.default);
// ... (hata yönetimi middleware'i)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Backend sunucusu ${PORT} portunda çalışıyor`);
});
// Opsiyonel: Global hata yakalayıcı
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Uygulamayı kapatma veya başka işlemler yapılabilir
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception thrown:', error);
    // Uygulamayı kapatma veya başka işlemler yapılabilir
    process.exit(1);
});
