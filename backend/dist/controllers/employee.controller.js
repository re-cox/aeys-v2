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
        // İstek parametresindeki id değerini al
        const paramId = req.params.employeeId || req.params.id;
        const file = req.file;
        console.log(`[API] Profil fotoğrafı yükleme isteği, paramId: ${paramId}`);
        // Önce personeli kendi ID'si ile arama
        let employee = yield prismaClient.employee.findUnique({
            where: { id: paramId },
            select: { id: true, profilePictureUrl: true }
        });
        // Bulunamazsa, bu sefer userId üzerinden arama
        if (!employee) {
            employee = yield prismaClient.employee.findUnique({
                where: { userId: paramId },
                select: { id: true, profilePictureUrl: true }
            });
            if (employee) {
                console.log(`[API] Personel UserId parametresi ile bulundu: ${paramId}`);
            }
        }
        else {
            console.log(`[API] Personel kendi ID'si ile bulundu: ${paramId}`);
        }
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
                message: 'Profil resmi yüklenecek personel bulunamadı (id veya userId ile eşleşme yok)'
            });
        }
        // URL yolunu düzelt - profile yerine profile-pictures kullan
        const profilePictureUrl = `/uploads/profile-pictures/${file.filename}`;
        // Eski profil resmini sil (varsa)
        if (employee.profilePictureUrl) {
            try {
                // URL'den dosya adını çıkar
                const oldFileName = employee.profilePictureUrl.split('/').pop();
                if (oldFileName) {
                    const oldFilePath = path_1.default.join(__dirname, '../../uploads/profile-pictures', oldFileName);
                    // Dosya varsa sil
                    if (fs_1.default.existsSync(oldFilePath)) {
                        fs_1.default.unlinkSync(oldFilePath);
                        console.log(`Eski profil resmi silindi: ${oldFilePath}`);
                    }
                }
            }
            catch (unlinkError) {
                console.error(`Eski profil resmi silinirken hata:`, unlinkError);
                // Silme hatası kritik değil, işleme devam et
            }
        }
        // Güncellemeyi employee'nin kendi ID'si ile yap
        const updatedEmployee = yield prismaClient.employee.update({
            where: { id: employee.id },
            data: { profilePictureUrl: profilePictureUrl },
            select: { profilePictureUrl: true }
        });
        console.log(`[API] Profil fotoğrafı başarıyla güncellendi. URL: ${profilePictureUrl}`);
        return res.status(200).json({
            success: true,
            message: 'Profil fotoğrafı başarıyla yüklendi',
            profilePictureUrl: profilePictureUrl,
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
                documents: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        surname: true,
                        role: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
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
    var _a, _b, _c, _d;
    try {
        const { employeeId } = req.params;
        console.log(`[Backend Employee] getEmployeeById çağrıldı. ID: ${employeeId}`);
        const employee = yield prismaClient.employee.findUnique({
            where: { id: employeeId },
            include: {
                department: true,
                documents: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        surname: true,
                        role: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!employee) {
            console.log(`[Backend Employee] ID'si ${employeeId} olan çalışan bulunamadı.`);
            res.status(404).json({
                success: false,
                message: 'Çalışan bulunamadı'
            });
            return;
        }
        // Employee datasını frontend için formatla
        const formattedData = Object.assign(Object.assign({}, employee), { 
            // Employee bilgilerine ilişkili user verilerinden de eklemeler yapılıyor
            userEmail: (_a = employee.user) === null || _a === void 0 ? void 0 : _a.email, userName: (_b = employee.user) === null || _b === void 0 ? void 0 : _b.name, userSurname: (_c = employee.user) === null || _c === void 0 ? void 0 : _c.surname, userRole: (_d = employee.user) === null || _d === void 0 ? void 0 : _d.role, 
            // Maaş ve acil durum iletişim bilgilerinin null olsa bile dönmesini sağlayalım
            salary: employee.salary || null, emergencyContactName: employee.emergencyContactName || null, emergencyContactPhone: employee.emergencyContactPhone || null, emergencyContactRelation: employee.emergencyContactRelation || null });
        console.log(`[Backend Employee] ID'si ${employeeId} olan çalışan bulundu.`);
        res.status(200).json({
            success: true,
            data: formattedData
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
    var _a, _b, _c, _d;
    try {
        const { employeeId } = req.params;
        const employeeData = req.body;
        console.log(`[Backend Employee] updateEmployee çağrıldı. ID: ${employeeId}`);
        console.log('[Backend Employee] Gelen veri:', JSON.stringify(employeeData, null, 2));
        // Frontend'den gelen firstName/lastName alanlarını name/surname olarak dönüştür
        const prismaData = Object.assign({}, employeeData);
        // Alan adı dönüşümleri
        if (employeeData.firstName !== undefined) {
            prismaData.name = employeeData.firstName;
            delete prismaData.firstName;
        }
        if (employeeData.lastName !== undefined) {
            prismaData.surname = employeeData.lastName;
            delete prismaData.lastName;
        }
        // Tarih alanlarının formatlarını kontrol et
        if (prismaData.hireDate) {
            try {
                console.log(`[Backend Employee] hireDate değeri: ${prismaData.hireDate}, tipi: ${typeof prismaData.hireDate}`);
                if (typeof prismaData.hireDate === 'string') {
                    // Tarih formatının geçerli olup olmadığını kontrol et
                    const date = new Date(prismaData.hireDate);
                    if (isNaN(date.getTime())) {
                        console.error(`[Backend Employee] Geçersiz hireDate formatı: ${prismaData.hireDate}`);
                        prismaData.hireDate = null;
                    }
                    else {
                        prismaData.hireDate = date;
                    }
                }
            }
            catch (dateError) {
                console.error(`[Backend Employee] hireDate işlenirken hata: ${dateError}`);
                prismaData.hireDate = null;
            }
        }
        if (prismaData.birthDate) {
            try {
                console.log(`[Backend Employee] birthDate değeri: ${prismaData.birthDate}, tipi: ${typeof prismaData.birthDate}`);
                if (typeof prismaData.birthDate === 'string') {
                    // Tarih formatının geçerli olup olmadığını kontrol et
                    const date = new Date(prismaData.birthDate);
                    if (isNaN(date.getTime())) {
                        console.error(`[Backend Employee] Geçersiz birthDate formatı: ${prismaData.birthDate}`);
                        prismaData.birthDate = null;
                    }
                    else {
                        prismaData.birthDate = date;
                    }
                }
            }
            catch (dateError) {
                console.error(`[Backend Employee] birthDate işlenirken hata: ${dateError}`);
                prismaData.birthDate = null;
            }
        }
        // Sayısal değerlerin tiplerini kontrol et
        if (prismaData.salary !== undefined) {
            console.log(`[Backend Employee] salary değeri: ${prismaData.salary}, tipi: ${typeof prismaData.salary}`);
            if (typeof prismaData.salary === 'string') {
                const salaryNumber = Number(prismaData.salary);
                if (isNaN(salaryNumber)) {
                    console.error(`[Backend Employee] Geçersiz salary değeri: ${prismaData.salary}`);
                    prismaData.salary = null;
                }
                else {
                    prismaData.salary = salaryNumber;
                }
            }
        }
        if (prismaData.annualLeaveAllowance !== undefined) {
            console.log(`[Backend Employee] annualLeaveAllowance değeri: ${prismaData.annualLeaveAllowance}, tipi: ${typeof prismaData.annualLeaveAllowance}`);
            if (typeof prismaData.annualLeaveAllowance === 'string') {
                const allowanceNumber = Number(prismaData.annualLeaveAllowance);
                if (isNaN(allowanceNumber)) {
                    console.error(`[Backend Employee] Geçersiz annualLeaveAllowance değeri: ${prismaData.annualLeaveAllowance}`);
                    prismaData.annualLeaveAllowance = null;
                }
                else {
                    prismaData.annualLeaveAllowance = allowanceNumber;
                }
            }
        }
        // İlişki kullanımı için departmentId'yi department nesnesine dönüştür
        const hasDepartmentId = prismaData.departmentId !== undefined && prismaData.departmentId !== null && prismaData.departmentId !== '';
        if (hasDepartmentId) {
            prismaData.department = {
                connect: { id: prismaData.departmentId }
            };
            delete prismaData.departmentId;
        }
        else if (prismaData.departmentId === null || prismaData.departmentId === '') {
            // Departman bağlantısını kaldırmak için disconnect kullan
            prismaData.department = {
                disconnect: true
            };
            delete prismaData.departmentId;
        }
        // Employee tablosunda gereksiz alanları temizle
        // Prisma'nın beklediği alanlarla uyumlu hale getir
        // İlişkiler için kullanılan objeleri temizle
        delete prismaData.user;
        delete prismaData.userId;
        delete prismaData.documents;
        delete prismaData.userName;
        delete prismaData.userSurname;
        delete prismaData.userEmail;
        delete prismaData.userRole;
        delete prismaData.profilePicture;
        delete prismaData.createdAt;
        delete prismaData.updatedAt;
        delete prismaData.assignedAssets;
        delete prismaData.purchaseRequestsMade;
        delete prismaData.purchaseRequestsStatusChanged;
        // İlişkisel alan olmayan ve Employee doğrudan ait olan alanlar
        // name ve surname alanları Employee'de değil User'da olduğundan kaldır
        delete prismaData.name;
        delete prismaData.surname;
        console.log(`[Backend Employee] Prisma'ya gönderilecek veri:`, JSON.stringify(prismaData, null, 2));
        // Öncelikle ilgili employee'yi kullanıcı bilgileriyle birlikte bul
        const employee = yield prismaClient.employee.findUnique({
            where: { id: employeeId },
            include: { user: true }
        });
        if (!employee) {
            res.status(404).json({
                success: false,
                message: `Personel bulunamadı (ID: ${employeeId})`
            });
            return;
        }
        // İlişkili kullanıcı bilgilerini güncellemek için ayrı bir işlem yap
        const userUpdateData = {};
        // Kullanıcı adı/soyadı
        if (prismaData.name !== undefined) {
            userUpdateData.name = prismaData.name;
        }
        if (prismaData.surname !== undefined) {
            userUpdateData.surname = prismaData.surname;
        }
        // E-posta
        if (prismaData.email !== undefined) {
            userUpdateData.email = prismaData.email;
            delete prismaData.email;
        }
        // Eğer kullanıcı bilgilerinde güncelleme yapılacaksa
        if (Object.keys(userUpdateData).length > 0 && employee.userId) {
            console.log(`[Backend Employee] Kullanıcı bilgileri güncelleniyor (ID: ${employee.userId}):`, JSON.stringify(userUpdateData, null, 2));
            try {
                yield prismaClient.user.update({
                    where: { id: employee.userId },
                    data: userUpdateData
                });
                console.log(`[Backend Employee] Kullanıcı bilgileri başarıyla güncellendi (ID: ${employee.userId})`);
            }
            catch (userUpdateError) {
                console.error(`[Backend Employee] Kullanıcı güncellenirken hata:`, userUpdateError);
                if (userUpdateError instanceof Error) {
                    console.error(`[Backend Employee] Kullanıcı güncelleme hata detayı: ${userUpdateError.message}`);
                    console.error(`[Backend Employee] Kullanıcı güncelleme stack trace: ${userUpdateError.stack}`);
                }
                throw new Error(`Kullanıcı bilgileri güncellenirken hata oluştu: ${userUpdateError instanceof Error ? userUpdateError.message : 'Bilinmeyen hata'}`);
            }
        }
        // Tip ve varlık kontrolleri
        console.log(`[Backend Employee] Employee güncelleme işlemi başlıyor:`, JSON.stringify(Object.assign({ id: employeeId }, prismaData), null, 2));
        try {
            // Employee bilgilerini güncelle
            const updatedEmployee = yield prismaClient.employee.update({
                where: { id: employeeId },
                data: prismaData,
                include: {
                    department: true,
                    documents: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            surname: true,
                            role: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            // Employee datasını frontend için formatla
            const formattedData = Object.assign(Object.assign({}, updatedEmployee), { 
                // Employee bilgilerine ilişkili user verilerinden de eklemeler yapılıyor
                userEmail: (_a = updatedEmployee.user) === null || _a === void 0 ? void 0 : _a.email, userName: (_b = updatedEmployee.user) === null || _b === void 0 ? void 0 : _b.name, userSurname: (_c = updatedEmployee.user) === null || _c === void 0 ? void 0 : _c.surname, userRole: (_d = updatedEmployee.user) === null || _d === void 0 ? void 0 : _d.role, 
                // Maaş ve acil durum iletişim bilgilerinin null olsa bile dönmesini sağlayalım
                salary: updatedEmployee.salary || null, emergencyContactName: updatedEmployee.emergencyContactName || null, emergencyContactPhone: updatedEmployee.emergencyContactPhone || null, emergencyContactRelation: updatedEmployee.emergencyContactRelation || null });
            console.log(`[Backend Employee] ID'si ${employeeId} olan çalışan başarıyla güncellendi.`);
            res.status(200).json({
                success: true,
                message: 'Çalışan bilgileri başarıyla güncellendi',
                data: formattedData
            });
        }
        catch (updateError) {
            console.error('[Backend Employee] Çalışan güncellenirken Prisma hatası:', updateError);
            // Hata ayrıntılarını kaydet
            if (updateError.name) {
                console.error(`[Backend Employee] Hata Adı: ${updateError.name}`);
            }
            if (updateError.message) {
                console.error(`[Backend Employee] Hata Mesajı: ${updateError.message}`);
            }
            if (updateError.code) {
                console.error(`[Backend Employee] Prisma Hata Kodu: ${updateError.code}`);
            }
            if (updateError.meta) {
                console.error(`[Backend Employee] Prisma Meta: ${JSON.stringify(updateError.meta, null, 2)}`);
            }
            if (updateError.stack) {
                console.error(`[Backend Employee] Stack Trace: ${updateError.stack}`);
            }
            if (updateError.code === 'P2002') {
                res.status(400).json({
                    success: false,
                    message: 'Bu e-posta adresi zaten kullanılıyor',
                    error: updateError.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Çalışan güncellenirken bir hata oluştu',
                error: updateError.message || 'Bilinmeyen hata'
            });
            return;
        }
    }
    catch (error) {
        console.error('[Backend Employee] Çalışan güncellenirken hata:', error);
        if (error instanceof Error) {
            console.error(`[Backend Employee] Hata detayı: ${error.message}`);
            console.error(`[Backend Employee] Stack trace: ${error.stack}`);
            if ('code' in error) {
                console.error(`[Backend Employee] Prisma hata kodu: ${error.code}`);
            }
            if ('meta' in error) {
                console.error(`[Backend Employee] Prisma meta: ${JSON.stringify(error.meta, null, 2)}`);
            }
        }
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
