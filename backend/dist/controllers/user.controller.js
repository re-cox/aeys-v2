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
exports.deleteUser = exports.uploadProfilePicture = exports.uploadProfileImage = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt")); // Şifre hashleme için
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path")); // path modülü eklendi
const fs_1 = __importDefault(require("fs")); // fs modülü eklendi (dosya silme için)
const uuid_1 = require("uuid");
// Tüm kullanıcıları (çalışanları) listele
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[Backend User] Tüm kullanıcılar isteniyor...');
    try {
        const users = yield prisma_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                roleId: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    select: { name: true }
                },
                employee: {
                    select: {
                        id: true, // Employee ID
                        position: true, // Pozisyonu da ekleyelim
                        profilePictureUrl: true, // Eksik olan alan eklendi
                        phoneNumber: true, // Eksik olan alan eklendi
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                        // Gerekirse Employee'den başka alanlar da seçilebilir
                    }
                }
            },
            orderBy: {
                name: 'asc' // İsme göre sırala
            }
        });
        console.log(`[Backend User] ${users.length} kullanıcı bulundu.`);
        // Frontend'in beklediği formata dönüştürmek gerekebilir
        // Şu anki mapBackendUserToFrontendEmployee fonksiyonu bu yeni yapıyı handle etmeyebilir
        // Bu nedenle backend'den dönen veriyi doğrudan gönderiyoruz.
        // Frontend'deki Employee tipi ve map'leme fonksiyonu gözden geçirilmeli.
        return res.status(200).json(users);
    }
    catch (error) {
        console.error('[Backend User] Kullanıcıları getirme hatası:', error);
        // Hata mesajını logla (Prisma hatası olabilir)
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası';
        console.error(errorMessage);
        return res.status(500).json({ message: 'Kullanıcılar alınırken bir sunucu hatası oluştu.', error: errorMessage });
    }
});
exports.getUsers = getUsers;
// Belirli bir kullanıcıyı getir (ID ile)
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log(`[Backend User] getUserById çağrıldı. ID: ${id}`);
    console.log(`[Backend User] Request URL: ${req.originalUrl}`);
    console.log(`[Backend User] Request query: `, req.query);
    try {
        // Önce ID'nin valid mi diye kontrol et
        if (!id || typeof id !== 'string') {
            console.error(`[Backend User] Geçersiz ID: ${id}`);
            return res.status(400).json({ message: 'Geçersiz kullanıcı ID.' });
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                roleId: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    select: { name: true, permissions: true }
                },
                employee: {
                    select: {
                        id: true,
                        position: true,
                        phoneNumber: true,
                        tcKimlikNo: true,
                        hireDate: true,
                        birthDate: true,
                        address: true,
                        iban: true,
                        bloodType: true,
                        drivingLicense: true,
                        education: true,
                        militaryStatus: true,
                        salary: true,
                        annualLeaveAllowance: true,
                        profilePictureUrl: true,
                        departmentId: true,
                        department: {
                            select: { id: true, name: true }
                        },
                        emergencyContactName: true,
                        emergencyContactPhone: true,
                        emergencyContactRelation: true,
                        documents: {
                            select: {
                                id: true,
                                name: true,
                                url: true,
                                type: true,
                                size: true,
                                uploadDate: true
                            },
                            orderBy: {
                                uploadDate: 'desc'
                            }
                        }
                        // TODO: Eksik salaryVisibleTo gibi özel alanlar varsa buraya ekle
                    }
                }
            }
        });
        if (!user) {
            console.log(`[Backend User] ID'si ${id} olan kullanıcı bulunamadı.`);
            return res.status(404).json({ message: 'Personel bulunamadı.' });
        }
        console.log(`[Backend User] ID'si ${id} olan kullanıcı bulundu:`, user.email);
        return res.status(200).json(user);
    }
    catch (error) {
        console.error(`[Backend User] ID'si ${id} olan kullanıcıyı getirme hatası:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası';
        console.error(errorMessage);
        return res.status(500).json({ message: 'Kullanıcı bilgileri alınırken bir sunucu hatası oluştu.', error: errorMessage });
    }
});
exports.getUserById = getUserById;
/**
 * Backend User objesini Frontend formatına dönüştürür.
 */
const mapUserToFrontendResponse = (user) => {
    if (!user)
        return null;
    return {
        id: user.id,
        email: user.email,
        firstName: user.name, // name -> firstName
        lastName: user.surname, // surname -> lastName
        role: user.role ? { id: user.role.id, name: user.role.name } : undefined,
        employee: user.employee ? {
            id: user.employee.id,
            position: user.employee.position,
            department: user.employee.department ? { id: user.employee.department.id, name: user.employee.department.name } : undefined,
        } : undefined,
        createdAt: user.createdAt,
    };
};
/**
 * Yeni bir kullanıcı ve ilişkili personel kaydı oluşturur (Varsayılan "Personel" rolü ile).
 * @route POST /api/users
 * @access Private (Yetkilendirme eklenecek)
 */
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { email, firstName, lastName, password, departmentId, position, phoneNumber, tcKimlikNo, hireDate, birthDate, address, iban, bloodType, drivingLicense, education, militaryStatus, salary, annualLeaveAllowance, emergencyContactName, emergencyContactPhone, emergencyContactRelation } = req.body;
    // Validasyon güncellendi (tcKimlikNo dahil)
    if (!email || !password || !firstName || !lastName || !departmentId || !position || !tcKimlikNo) {
        console.error("[Controller] createUser - Eksik zorunlu alanlar:", { email, firstName, lastName, password, departmentId, position, tcKimlikNo });
        return res.status(400).json({ message: 'İsim, soyisim, e-posta, şifre, departman, pozisyon ve TCKN zorunludur.' });
    }
    const defaultRoleName = 'Personel'; // Rolü isimle bulacağız
    try {
        const saltRounds = 10;
        const passwordHash = yield bcrypt_1.default.hash(password, saltRounds);
        const newUserFromDb = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Varsayılan Rolü Bul
            const defaultRole = yield tx.role.findUnique({
                where: { name: defaultRoleName },
                select: { id: true } // Sadece ID'sini alalım
            });
            if (!defaultRole) {
                // Bu kritik bir hata, rol veritabanında olmalı.
                console.error(`[createUser] Kritik Hata: '${defaultRoleName}' isimli varsayılan rol bulunamadı.`);
                // Hata fırlatarak transaction'ı geri al
                throw new Error(`Varsayılan rol '${defaultRoleName}' bulunamadı. Sistem yöneticisi ile iletişime geçin.`);
            }
            // 2. User oluştur (Bulunan rol ID'si ile)
            const createdUser = yield tx.user.create({
                data: {
                    email,
                    name: firstName,
                    surname: lastName,
                    passwordHash,
                    role: { connect: { id: defaultRole.id } }, // Dinamik rol ID
                },
                select: { id: true } // Sadece User ID'sini alalım
            });
            // 3. Employee oluştur ve User'a bağla
            const employeeCreateData = {
                user: { connect: { id: createdUser.id } }, // Oluşturulan User ID
                position,
                phoneNumber,
                tcKimlikNo,
                hireDate: hireDate ? new Date(hireDate) : new Date(),
                birthDate: birthDate ? new Date(birthDate) : null,
                address,
                iban,
                bloodType,
                drivingLicense,
                education,
                militaryStatus,
                salary: salary !== undefined && salary !== null ? parseFloat(salary) : null,
                annualLeaveAllowance: annualLeaveAllowance !== undefined && annualLeaveAllowance !== null ? parseInt(annualLeaveAllowance) : null,
                emergencyContactName,
                emergencyContactPhone,
                emergencyContactRelation
            };
            if (departmentId) {
                employeeCreateData.department = { connect: { id: departmentId } };
            }
            yield tx.employee.create({ data: employeeCreateData });
            // 4. Tam User bilgisini geri döndürmek için tekrar sorgula
            return yield tx.user.findUnique({
                where: { id: createdUser.id },
                select: {
                    id: true, email: true, name: true, surname: true,
                    role: { select: { id: true, name: true } },
                    employee: {
                        select: { id: true, position: true, department: { select: { id: true, name: true } } }
                    },
                    createdAt: true
                }
            });
        }));
        // Map'leme ve Yanıt Gönderme
        const frontendResponse = mapUserToFrontendResponse(newUserFromDb);
        if (!frontendResponse) {
            // Bu durum normalde olmamalı ama bir güvenlik kontrolü
            console.error("[createUser] Veritabanından gelen kullanıcı map edilemedi.", newUserFromDb);
            return res.status(500).json({ message: 'Kullanıcı oluşturuldu ancak yanıt işlenemedi.' });
        }
        res.status(201).json(frontendResponse);
    }
    catch (error) {
        console.error("Kullanıcı oluşturma hatası:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const target = ((_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'alan';
                return res.status(409).json({ message: `Bu ${target} zaten başka bir kullanıcı tarafından kullanılıyor.` });
            }
            if (error.code === 'P2003' || error.code === 'P2025') {
                const field = ((_c = error.meta) === null || _c === void 0 ? void 0 : _c.field_name) || 'ilişkili alan';
                let detailedMessage = `Geçersiz ${field}. İlişkili kayıt bulunamadı.`;
                if (field.includes('department')) {
                    detailedMessage = `Seçilen departman bulunamadı.`;
                }
                // P2025 rol için transaction içinde handle edildi, burada tekrar kontrol etmeye gerek yok
                return res.status(400).json({ message: detailedMessage });
            }
        }
        // Transaction içinden fırlatılan özel rol hatası
        if (error instanceof Error && error.message.includes("Varsayılan rol")) {
            // Belki 500 yerine 400 dönmek daha uygun?
            return res.status(400).json({ message: error.message });
        }
        // Diğer tüm hatalar için genel 500
        res.status(500).json({ message: 'Kullanıcı oluşturulurken bilinmeyen bir sunucu hatası oluştu.' });
    }
});
exports.createUser = createUser;
/**
 * Belirli bir kullanıcıyı ve ilişkili personel bilgilerini günceller.
 * @route PUT /api/users/:id
 * @access Private (Yetkilendirme eklenecek)
 */
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    // Frontend'den gelen Employee partial tipine benzer alanlar
    const { email, firstName, lastName, departmentId, position, phoneNumber, // Frontend'den phone olarak gelirse burada handle et
    tcKimlikNo, // Frontend'den identityNumber olarak gelirse burada handle et
    hireDate, birthDate, address, iban, bloodType, drivingLicense, education, militaryStatus, salary, annualLeaveAllowance, profilePictureUrl, // Frontend'den profileImage olarak gelirse burada handle et
    emergencyContactName, emergencyContactPhone, emergencyContactRelation,
    // password, roleId gibi alanlar ayrı endpointlerde veya yetkiyle güncellenmeli
     } = req.body;
    console.log(`[Backend User] ID'si ${id} olan kullanıcıyı güncelleme isteği alındı. Veri:`, req.body);
    try {
        // 1. Güncellenecek Kullanıcıyı Bul
        const existingUser = yield prisma_1.prisma.user.findUnique({
            where: { id },
            include: { employee: true } // İlişkili employee kaydını da getir
        });
        if (!existingUser) {
            return res.status(404).json({ message: 'Güncellenecek kullanıcı bulunamadı.' });
        }
        // 2. Verileri Hazırla (User ve Employee için ayrı ayrı)
        const userDataToUpdate = {};
        if (email !== undefined)
            userDataToUpdate.email = email;
        if (firstName !== undefined)
            userDataToUpdate.name = firstName;
        if (lastName !== undefined)
            userDataToUpdate.surname = lastName;
        // Şifre ve rol güncellemesi burada yapılmamalı (ayrı/yetkili endpoint)
        const employeeDataToUpdate = {};
        if (position !== undefined)
            employeeDataToUpdate.position = position;
        if (phoneNumber !== undefined)
            employeeDataToUpdate.phoneNumber = phoneNumber;
        if (tcKimlikNo !== undefined)
            employeeDataToUpdate.tcKimlikNo = tcKimlikNo;
        if (hireDate !== undefined)
            employeeDataToUpdate.hireDate = hireDate ? new Date(hireDate) : null;
        if (birthDate !== undefined)
            employeeDataToUpdate.birthDate = birthDate ? new Date(birthDate) : null;
        if (address !== undefined)
            employeeDataToUpdate.address = address;
        if (iban !== undefined)
            employeeDataToUpdate.iban = iban;
        if (bloodType !== undefined)
            employeeDataToUpdate.bloodType = bloodType;
        if (drivingLicense !== undefined)
            employeeDataToUpdate.drivingLicense = drivingLicense;
        if (education !== undefined)
            employeeDataToUpdate.education = education;
        if (militaryStatus !== undefined)
            employeeDataToUpdate.militaryStatus = militaryStatus;
        if (salary !== undefined)
            employeeDataToUpdate.salary = salary === null ? null : parseFloat(salary);
        if (annualLeaveAllowance !== undefined)
            employeeDataToUpdate.annualLeaveAllowance = annualLeaveAllowance === null ? null : parseInt(annualLeaveAllowance);
        if (profilePictureUrl !== undefined)
            employeeDataToUpdate.profilePictureUrl = profilePictureUrl;
        if (emergencyContactName !== undefined)
            employeeDataToUpdate.emergencyContactName = emergencyContactName;
        if (emergencyContactPhone !== undefined)
            employeeDataToUpdate.emergencyContactPhone = emergencyContactPhone;
        if (emergencyContactRelation !== undefined)
            employeeDataToUpdate.emergencyContactRelation = emergencyContactRelation;
        // Departman bağlantısı güncellemesi
        if (departmentId !== undefined) {
            if (departmentId === null || departmentId === '') {
                // Departmanı kaldırmak için disconnect kullan (eğer employee varsa)
                if (existingUser.employee) {
                    employeeDataToUpdate.department = { disconnect: true };
                }
            }
            else {
                // Yeni departmana bağlamak için connect kullan
                employeeDataToUpdate.department = { connect: { id: departmentId } };
            }
        }
        // 3. İşlemi Transaction İçinde Gerçekleştir
        const updatedUserFromDb = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // User verisini güncelle (eğer güncellenecek alan varsa)
            if (Object.keys(userDataToUpdate).length > 0) {
                yield tx.user.update({ where: { id }, data: userDataToUpdate });
            }
            // Employee verisini güncelle (eğer güncellenecek alan varsa)
            // Employee kaydı olmayabilir, bu durumu kontrol et!
            if (existingUser.employee && Object.keys(employeeDataToUpdate).length > 0) {
                yield tx.employee.update({
                    where: { userId: id }, // Employee'yi userId ile bulmak daha güvenli olabilir
                    data: employeeDataToUpdate
                });
            }
            else if (!existingUser.employee && Object.keys(employeeDataToUpdate).length > 0) {
                // Eğer employee yoksa ve güncellenecek employee verisi varsa, 
                // yeni employee kaydı oluşturulabilir mi? Bu senaryo gözden geçirilmeli.
                // Şimdilik sadece var olanı güncelliyoruz.
                console.warn(`[Backend User Update] User ID ${id} için Employee kaydı bulunamadı, güncelleme atlandı.`);
            }
            // Veritabanından name/surname ile tam veriyi al
            return yield tx.user.findUnique({
                where: { id },
                select: {
                    id: true, email: true, name: true, surname: true,
                    roleId: true, createdAt: true, updatedAt: true,
                    role: { select: { name: true, permissions: true } },
                    employee: {
                        select: {
                            id: true, position: true, phoneNumber: true, tcKimlikNo: true,
                            hireDate: true, birthDate: true, address: true, iban: true,
                            bloodType: true, drivingLicense: true, education: true,
                            militaryStatus: true, salary: true, annualLeaveAllowance: true,
                            profilePictureUrl: true, departmentId: true,
                            department: { select: { id: true, name: true } },
                            emergencyContactName: true, emergencyContactPhone: true, emergencyContactRelation: true,
                            documents: { select: { id: true, name: true, url: true, type: true, size: true, uploadDate: true }, orderBy: { uploadDate: 'desc' } }
                        }
                    }
                }
            });
        }));
        const frontendResponse = mapUserToFrontendResponse(updatedUserFromDb);
        if (!frontendResponse) {
            console.error("[updateUser] Veritabanından gelen kullanıcı map edilemedi.", updatedUserFromDb);
            return res.status(500).json({ message: 'Kullanıcı güncellendi ancak yanıt işlenemedi.' });
        }
        console.log(`[Backend User Update] ID ${id} başarıyla güncellendi.`);
        res.status(200).json(frontendResponse);
    }
    catch (error) {
        console.error(`[Backend User Update] Kullanıcı ${id} güncelleme hatası:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // Unique constraint hatası (örn: email zaten kullanılıyor)
            if (error.code === 'P2002') {
                const target = ((_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'alan';
                return res.status(409).json({ message: `Bu ${target} zaten başka bir kullanıcı tarafından kullanılıyor.` });
            }
            // İlişkili kayıt bulunamadı (örn: olmayan departmana bağlanmaya çalışma)
            if (error.code === 'P2025') {
                return res.status(400).json({ message: 'İlişkili kayıt bulunamadı (örn. geçersiz Departman ID).' });
            }
        }
        // Genel hata
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası';
        console.error(errorMessage);
        res.status(500).json({ message: 'Kullanıcı güncellenirken bir sunucu hatası oluştu.', error: errorMessage });
    }
});
exports.updateUser = updateUser;
/**
 * Base64 formatındaki profil resmini kullanıcı için kaydeder
 * @param req Request - { body: { base64Image } }
 * @param res Response
 */
const uploadProfileImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { base64Image } = req.body;
        if (!base64Image) {
            res.status(400).json({
                success: false,
                message: 'Base64 formatında resim verisi gerekli'
            });
            return;
        }
        // Base64 veriyi ayırma (data:image/jpeg;base64,/9j/4AAQSkZJRg...)
        const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            res.status(400).json({
                success: false,
                message: 'Geçersiz base64 resim formatı'
            });
            return;
        }
        // Resim tür ve verisini ayıklama
        const imageType = matches[1];
        const imageData = matches[2];
        const buffer = Buffer.from(imageData, 'base64');
        // Dosya uzantısını belirleme
        let fileExtension = 'jpg'; // Varsayılan
        if (imageType.includes('png')) {
            fileExtension = 'png';
        }
        else if (imageType.includes('gif')) {
            fileExtension = 'gif';
        }
        // Benzersiz dosya adı ve kaydetme yolu
        const fileName = `${id}-${(0, uuid_1.v4)()}.${fileExtension}`;
        const uploadPath = path_1.default.join(__dirname, '../../uploads/profile-pictures');
        // Klasörün var olduğunu kontrol et, yoksa oluştur
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        const filePath = path_1.default.join(uploadPath, fileName);
        // Dosyayı kaydet
        fs_1.default.writeFileSync(filePath, buffer);
        // Sunucu üzerindeki URL'i oluştur
        const profilePictureUrl = `/uploads/profile-pictures/${fileName}`;
        // Kullanıcının employee kaydını bul
        const employee = yield prisma_1.prisma.employee.findUnique({
            where: { userId: id }
        });
        if (!employee) {
            res.status(404).json({
                success: false,
                message: 'Kullanıcı için personel kaydı bulunamadı'
            });
            return;
        }
        // Eski profil resmini sil (varsa)
        if (employee.profilePictureUrl) {
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
        // Employee tablosunu güncelle
        yield prisma_1.prisma.employee.update({
            where: { userId: id },
            data: { profilePictureUrl }
        });
        // Güncellenmiş kullanıcı bilgilerini getir
        const updatedUser = yield prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                employee: {
                    select: {
                        profilePictureUrl: true
                    }
                }
            }
        });
        res.status(200).json({
            success: true,
            message: 'Profil resmi başarıyla yüklendi',
            profilePictureUrl,
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Profil resmi yükleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Profil resmi yüklenirken bir hata oluştu',
            error: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.uploadProfileImage = uploadProfileImage;
/**
 * Kullanıcının profil resmi yüklemesi için handler
 * @param req Request - form-data profil resmi dosyası içerir
 * @param res Response
 */
const uploadProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Dosya yüklenmemiş mi kontrol et
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Hiçbir dosya yüklenmedi.'
            });
        }
        // Dosya bilgilerini al
        const file = req.file;
        // Dosya URL'ini oluştur (frontend'in erişebileceği şekilde)
        const profilePictureUrl = `/uploads/profile-pictures/${file.filename}`;
        // Kullanıcının employee kaydını bul
        const employee = yield prisma_1.prisma.employee.findUnique({
            where: { userId: id }
        });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı için personel kaydı bulunamadı.'
            });
        }
        // Eski profil resmini silmek için kaydı kontrol et
        if (employee.profilePictureUrl) {
            try {
                const oldPicturePath = employee.profilePictureUrl.split('/').pop(); // Dosya adını çıkar
                if (oldPicturePath) {
                    const fullPath = path_1.default.join(__dirname, `../../uploads/profile-pictures/${oldPicturePath}`);
                    if (fs_1.default.existsSync(fullPath)) {
                        fs_1.default.unlinkSync(fullPath);
                        console.log(`Eski profil resmi silindi: ${fullPath}`);
                    }
                }
            }
            catch (err) {
                console.error("Eski profil resmi silinirken hata:", err);
                // Silme hatası kritik değil, işleme devam et
            }
        }
        // Profil resmini güncelle
        const updatedEmployee = yield prisma_1.prisma.employee.update({
            where: { userId: id },
            data: {
                profilePictureUrl: profilePictureUrl
            }
        });
        // Frontend'in beklediği yanıt formatına göre dön
        return res.status(200).json({
            success: true,
            profilePictureUrl: profilePictureUrl,
            message: 'Profil resmi başarıyla güncellendi.'
        });
    }
    catch (error) {
        console.error('Profil resmi yükleme hatası:', error);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
        return res.status(500).json({
            success: false,
            message: 'Profil resmi güncellenirken bir hata oluştu.',
            error: errorMessage
        });
    }
});
exports.uploadProfilePicture = uploadProfilePicture;
/**
 * Kullanıcıyı ve ilişkili tüm verilerini (personel, dökümanlar, profil resmi) siler.
 * @param req Request - params içinde kullanıcı ID'si bulunur
 * @param res Response
 */
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Kullanıcıya ait Employee kaydını bul (profil resmi ve employee ID için)
            const employee = yield tx.employee.findUnique({
                where: { userId: id },
                select: { id: true, profilePictureUrl: true }
            });
            if (employee) {
                const employeeId = employee.id;
                // 2. İlişkili EmployeeDocument'ları sil
                yield tx.employeeDocument.deleteMany({
                    where: { employeeId: employeeId }
                });
                // 3. Profil resmini diskten sil (varsa)
                if (employee.profilePictureUrl) {
                    const profilePicturePath = path_1.default.join(__dirname, '../../', employee.profilePictureUrl);
                    try {
                        if (fs_1.default.existsSync(profilePicturePath)) {
                            fs_1.default.unlinkSync(profilePicturePath);
                            console.log(`Profil resmi silindi: ${profilePicturePath}`);
                        }
                    }
                    catch (unlinkError) {
                        console.error(`Profil resmi silinirken hata oluştu (${profilePicturePath}):`, unlinkError);
                        // Dosya silme hatası işlemi durdurmamalı, loglamak yeterli.
                    }
                }
                // 4. Employee kaydını sil
                yield tx.employee.delete({
                    where: { id: employeeId }
                });
            }
            // 5. User kaydını sil
            const deletedUser = yield tx.user.delete({
                where: { id: id }
            });
            // Kullanıcı bulunamazsa Prisma otomatik olarak hata fırlatacaktır.
            // Başarılı olursa buraya gelinir.
            res.status(200).json({
                success: true,
                message: 'Kullanıcı ve ilişkili tüm veriler başarıyla silindi.',
                data: { id: deletedUser.id }
            });
        }));
    }
    catch (error) {
        console.error(`Kullanıcı silinirken hata oluştu (ID: ${id}):`, error);
        // Prisma'nın "Record to delete does not exist" hatasını kontrol et
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Silinecek kullanıcı bulunamadı.'
            });
        }
        // Diğer hatalar için genel hata mesajı
        res.status(500).json({
            success: false,
            message: 'Kullanıcı silinirken bir sunucu hatası oluştu.',
            error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
        });
    }
});
exports.deleteUser = deleteUser;
// Kullanıcı oluşturma/güncelleme/silme fonksiyonları da buraya eklenebilir 
// Kullanıcı oluşturma/güncelleme/silme fonksiyonları da buraya eklenebilir 
