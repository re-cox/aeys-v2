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
exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployeeById = exports.getAllEmployees = exports.uploadEmployeeDocuments = exports.uploadProfilePicture = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs")); // Dosya sistemi işlemleri için (opsiyonel: hata durumunda dosyayı silmek için)
const path_1 = __importDefault(require("path")); // Dosya yolları için
const prismaClient = new client_1.PrismaClient();
// Yardımcı fonksiyon: Dosya URL'sini oluşturma
const getFileUrl = (req, filePath) => {
    const relativePath = path_1.default.relative(path_1.default.join(__dirname, '../../uploads'), filePath);
    const webPath = relativePath.replace(/\\/g, '/'); // Windows için
    return `${req.protocol}://${req.get('host')}/uploads/${webPath}`;
};
/**
 * @description Bir personelin profil fotoğrafını yükler ve günceller.
 * @route POST /api/employees/:employeeId/profile-picture
 * @access Private
 * @param req Express Request (file içerir, params.employeeId)
 * @param res Express Response
 * @param next Express NextFunction
 */
const uploadProfilePicture = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Profil fotoğrafı dosyası bulunamadı.'
            });
        }
        const employeeId = req.params.employeeId;
        const file = req.file;
        // Personel kontrolü - userId ile ara
        const employee = yield prismaClient.employee.findUnique({
            where: { userId: employeeId },
            select: { id: true, profilePictureUrl: true }
        });
        if (!employee) {
            // Dosyayı sil
            try {
                if (file.path && fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            }
            catch (unlinkError) {
                console.error(`Dosya silinirken hata: ${file.path}`, unlinkError);
            }
            return res.status(404).json({
                success: false,
                message: 'Profil resmi yüklenecek personel bulunamadı (userId ile eşleşme yok)'
            });
        }
        const profilePictureUrl = `/uploads/profile/${file.filename}`;
        // Eski profil resmini sil (varsa)
        if (employee.profilePictureUrl) {
            const oldFilePath = path_1.default.join(__dirname, '../../uploads', employee.profilePictureUrl);
            // Yeni dosyanın eski dosya ile aynı olup olmadığını kontrol et
            if (fs_1.default.existsSync(oldFilePath) && oldFilePath !== file.path) {
                try {
                    fs_1.default.unlinkSync(oldFilePath);
                    console.log(`Eski profil resmi silindi: ${oldFilePath}`);
                }
                catch (unlinkError) {
                    console.error(`Eski profil resmi silinirken hata: ${oldFilePath}`, unlinkError);
                    // Silme hatası kritik değil, işleme devam et
                }
            }
        }
        // Güncellemeyi employee'nin kendi ID'si ile yap
        const updatedEmployee = yield prismaClient.employee.update({
            where: { id: employee.id },
            data: { profilePictureUrl: profilePictureUrl },
            select: { profilePictureUrl: true }
        });
        return res.status(200).json({
            success: true,
            message: 'Profil fotoğrafı başarıyla yüklendi',
            employee: updatedEmployee
        });
    }
    catch (error) {
        console.error('Profil fotoğrafı yükleme hatası:', error);
        // Hatayı middleware'e ilet
        return next(error);
    }
});
exports.uploadProfilePicture = uploadProfilePicture;
/**
 * @description Bir personele ait dökümanları yükler.
 * @route POST /api/employees/:employeeId/documents
 * @access Private
 * @param req Express Request (files içerir, params.employeeId)
 * @param res Express Response
 * @param next Express NextFunction
 */
const uploadEmployeeDocuments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employeeId = req.params.employeeId;
        // Dosya kontrolü
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Yüklenecek döküman bulunamadı'
            });
        }
        const files = req.files;
        // Personel kontrolü
        const employee = yield prismaClient.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) {
            // Dosyaları sil
            yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    if (file.path && fs_1.default.existsSync(file.path)) {
                        fs_1.default.unlinkSync(file.path);
                    }
                }
                catch (e) {
                    console.error(`Dosya silinemedi: ${file.path}`, e);
                }
            })));
            return res.status(404).json({
                success: false,
                message: 'Dökümanların yükleneceği personel bulunamadı'
            });
        }
        // Her dosya için veritabanı kaydı oluştur
        const documentCreatePromises = files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            // Dosya yolunu düzgün bir şekilde oluştur
            const documentUrl = `/uploads/documents/${file.filename}`;
            return prismaClient.employeeDocument.create({
                data: {
                    employeeId: employeeId,
                    name: file.originalname,
                    url: documentUrl,
                    type: file.mimetype,
                    size: file.size,
                    uploadDate: new Date(),
                },
                select: {
                    id: true,
                    name: true,
                    url: true,
                    type: true,
                    size: true,
                    uploadDate: true
                }
            });
        }));
        const createdDocuments = yield Promise.all(documentCreatePromises);
        res.status(200).json({
            success: true,
            message: 'Belgeler başarıyla yüklendi',
            documents: createdDocuments
        });
    }
    catch (error) {
        console.error('Döküman yükleme hatası:', error);
        // Hatayı middleware'e ilet ve daha detaylı işlenmesini sağla
        return next(error);
    }
});
exports.uploadEmployeeDocuments = uploadEmployeeDocuments;
// Tüm çalışanları getirme işlemi
const getAllEmployees = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employees = yield prismaClient.employee.findMany({
            include: {
                department: true,
                documents: true
            }
        });
        res.status(200).json({
            success: true,
            count: employees.length,
            data: employees
        });
    }
    catch (error) {
        console.error('Çalışanlar listelenirken hata:', error);
        res.status(500).json({
            success: false,
            message: 'Çalışanlar listelenirken bir hata oluştu',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.getAllEmployees = getAllEmployees;
// Tek bir çalışanı ID'ye göre getirme işlemi
const getEmployeeById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId } = req.params;
        const employee = yield prismaClient.employee.findUnique({
            where: { id: employeeId },
            include: {
                department: true,
                documents: true
            }
        });
        if (!employee) {
            res.status(404).json({
                success: false,
                message: 'Çalışan bulunamadı'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: employee
        });
    }
    catch (error) {
        console.error('Çalışan bilgisi alınırken hata:', error);
        res.status(500).json({
            success: false,
            message: 'Çalışan bilgisi alınırken bir hata oluştu',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.getEmployeeById = getEmployeeById;
// Yeni çalışan oluşturma işlemi
const createEmployee = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employeeData = req.body;
        const newEmployee = yield prismaClient.employee.create({
            data: employeeData,
            include: {
                department: true
            }
        });
        res.status(201).json({
            success: true,
            message: 'Çalışan başarıyla oluşturuldu',
            data: newEmployee
        });
    }
    catch (error) {
        console.error('Çalışan oluşturulurken hata:', error);
        res.status(500).json({
            success: false,
            message: 'Çalışan oluşturulurken bir hata oluştu',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.createEmployee = createEmployee;
// Çalışan bilgilerini güncelleme işlemi
const updateEmployee = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId } = req.params;
        const employeeData = req.body;
        const updatedEmployee = yield prismaClient.employee.update({
            where: { id: employeeId },
            data: employeeData,
            include: {
                department: true,
                documents: true
            }
        });
        res.status(200).json({
            success: true,
            message: 'Çalışan bilgileri başarıyla güncellendi',
            data: updatedEmployee
        });
    }
    catch (error) {
        console.error('Çalışan güncellenirken hata:', error);
        res.status(500).json({
            success: false,
            message: 'Çalışan güncellenirken bir hata oluştu',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.updateEmployee = updateEmployee;
// Çalışan silme işlemi
const deleteEmployee = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId } = req.params;
        // Önce çalışana ait dökümanları silme
        yield prismaClient.employeeDocument.deleteMany({
            where: { employeeId: employeeId }
        });
        // Çalışanı silme
        yield prismaClient.employee.delete({
            where: { id: employeeId }
        });
        res.status(200).json({
            success: true,
            message: 'Çalışan başarıyla silindi'
        });
    }
    catch (error) {
        console.error('Çalışan silinirken hata:', error);
        res.status(500).json({
            success: false,
            message: 'Çalışan silinirken bir hata oluştu',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.deleteEmployee = deleteEmployee;
// TODO: Diğer Employee işlemleri (GET by ID, PUT, DELETE) buraya eklenebilir. 
