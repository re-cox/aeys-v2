import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt'; // Şifre hashleme için
import { Prisma } from '@prisma/client';
import path from 'path'; // path modülü eklendi
import fs from 'fs'; // fs modülü eklendi (dosya silme için)
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// Tüm kullanıcıları (çalışanları) listele
export const getUsers = async (req: Request, res: Response) => {
  console.log('[Backend User] Tüm kullanıcılar isteniyor...');
  try {
    const users = await prisma.user.findMany({
      select: { // Güncel şemaya göre alanları seç
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
        employee: { // Employee ilişkisini dahil et
          select: {
            id: true, // Employee ID
            position: true, // Pozisyonu da ekleyelim
            profilePictureUrl: true, // Eksik olan alan eklendi
            phoneNumber: true, // Eksik olan alan eklendi
            department: { // Employee altındaki departmanı seç
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
    
  } catch (error) {
    console.error('[Backend User] Kullanıcıları getirme hatası:', error);
    // Hata mesajını logla (Prisma hatası olabilir)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası';
    console.error(errorMessage);
    return res.status(500).json({ message: 'Kullanıcılar alınırken bir sunucu hatası oluştu.', error: errorMessage });
  }
};

// Belirli bir kullanıcıyı getir (ID ile)
export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`[Backend User] ID'si ${id} olan kullanıcı isteniyor...`);

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { // Frontend'in ihtiyaç duyabileceği tüm alanları seç
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
        employee: { // İlişkili Employee bilgilerini getir
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

  } catch (error) {
    console.error(`[Backend User] ID'si ${id} olan kullanıcıyı getirme hatası:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası';
    console.error(errorMessage);
    return res.status(500).json({ message: 'Kullanıcı bilgileri alınırken bir sunucu hatası oluştu.', error: errorMessage });
  }
};

/**
 * Yeni bir kullanıcı ve ilişkili personel kaydı oluşturur (Varsayılan "Personel" rolü ile).
 * @route POST /api/users
 * @access Private (Yetkilendirme eklenecek)
 */
export const createUser = async (req: Request, res: Response) => {
    const {
        email,
        firstName,
        lastName,
        password,
        departmentId,
        position,
        phoneNumber,
        tcKimlikNo,
        hireDate,
        birthDate,
        address,
        iban,
        bloodType,
        drivingLicense,
        education,
        militaryStatus,
        salary,
        annualLeaveAllowance,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation
     } = req.body;

    // --- Temel Doğrulamalar ---
    if (!email || !password || !firstName || !lastName || !departmentId || !position || !tcKimlikNo) {
        console.error("[Controller] createUser - Eksik alanlar:", { email, firstName, lastName, password, departmentId, position, tcKimlikNo });
        res.status(400).json({ message: 'İsim, soyisim, e-posta, şifre, departman, pozisyon ve TCKN zorunludur.' });
        return;
    }

    // Varsayılan Rol ID'si ("Personel")
    const defaultRoleId = "14b9ffbf-e35d-4bcf-944a-3183c6e5844f"; // Personel rolünün ID'si

    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = await prisma.$transaction(async (tx) => {
            // 1. User oluştur
            const createdUser = await tx.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    passwordHash,
                    role: { connect: { id: defaultRoleId } },
                },
                select: { id: true }
            });

            // 2. Employee oluştur ve User'a bağla
            // departmentId varsa connect ile bağla, yoksa bu alanı hiç ekleme
            const employeeCreateData: Prisma.EmployeeCreateInput = {
                user: { connect: { id: createdUser.id } },
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
            
            // Departman bağlantısını sadece departmentId varsa ekle
            if (departmentId) {
                employeeCreateData.department = { connect: { id: departmentId } };
            }

            await tx.employee.create({ data: employeeCreateData });

            // 3. Tam User bilgisini (ilişkili Employee bilgileri dahil) geri döndür
             return await tx.user.findUnique({
                 where: { id: createdUser.id },
                 select: {
                     id: true,
                     email: true,
                     firstName: true,
                     lastName: true,
                     role: { select: { id: true, name: true } },
                     employee: { // Employee ilişkisini ve içindeki departmanı seç
                        select: {
                            id: true, // Employee ID'yi de seçmek faydalı olabilir
                            position: true,
                            department: { // Employee altındaki departman ilişkisi
                                select: { id: true, name: true } 
                            }
                        }
                     },
                     createdAt: true
                 }
             });
        });

        res.status(201).json(newUser);

    } catch (error) {
        console.error("Kullanıcı oluşturma hatası:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const target = (error.meta?.target as string[])?.join(', ') || 'belirtilmemiş alan';
                // TC Kimlik No için özel mesaj
                if (target.includes('tcKimlikNo')) {
                     res.status(409).json({ message: `Bu T.C. Kimlik Numarası zaten kayıtlı.` });
                     return;
                }
                if (target.includes('iban')) {
                     res.status(409).json({ message: `Bu IBAN zaten kullanımda.` });
                     return;
                }
                 res.status(409).json({ message: `Bu ${target.includes('email') ? 'e-posta' : target} zaten kullanımda.` });
                return;
            }
            if (error.code === 'P2003' || error.code === 'P2025') {
                 const field = (error.meta?.field_name as string) || 'ilişkili alan';
                 let detailedMessage = `Geçersiz ${field}. İlişkili kayıt bulunamadı.`;
                 // Varsayılan Rol bulunamazsa özel mesaj göster
                 if ((error.code === 'P2025' || error.message.includes('RoleToUser')) && field.includes('role')) {
                    detailedMessage = `Varsayılan \"Personel\" rolü (ID: ${defaultRoleId}) veritabanında bulunamadı.`
                 } else if (field.includes('department')) { // Employee üzerindeki departman kontrolü
                     detailedMessage = `Seçilen departman bulunamadı.`
                 }
                 res.status(400).json({ message: detailedMessage });
                 return;
            }
        }
        res.status(500).json({ message: 'Kullanıcı oluşturulurken bir sunucu hatası oluştu.' });
    }
};

/**
 * Belirli bir kullanıcıyı ve ilişkili personel bilgilerini günceller.
 * @route PUT /api/users/:id
 * @access Private (Yetkilendirme eklenecek)
 */
export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    // Frontend'den gelen Employee partial tipine benzer alanlar
    const {
        email,
        firstName,
        lastName,
        departmentId,
        position,
        phoneNumber, // Frontend'den phone olarak gelirse burada handle et
        tcKimlikNo,  // Frontend'den identityNumber olarak gelirse burada handle et
        hireDate,
        birthDate,
        address,
        iban,
        bloodType,
        drivingLicense,
        education,
        militaryStatus,
        salary,
        annualLeaveAllowance,
        profilePictureUrl, // Frontend'den profileImage olarak gelirse burada handle et
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
        // password, roleId gibi alanlar ayrı endpointlerde veya yetkiyle güncellenmeli
    } = req.body;

    console.log(`[Backend User] ID'si ${id} olan kullanıcıyı güncelleme isteği alındı. Veri:`, req.body);

    try {
        // 1. Güncellenecek Kullanıcıyı Bul
        const existingUser = await prisma.user.findUnique({
            where: { id },
            include: { employee: true } // İlişkili employee kaydını da getir
        });

        if (!existingUser) {
            return res.status(404).json({ message: 'Güncellenecek kullanıcı bulunamadı.' });
        }

        // 2. Verileri Hazırla (User ve Employee için ayrı ayrı)
        const userDataToUpdate: Prisma.UserUpdateInput = {};
        if (email !== undefined) userDataToUpdate.email = email;
        if (firstName !== undefined) userDataToUpdate.firstName = firstName;
        if (lastName !== undefined) userDataToUpdate.lastName = lastName;
        // Şifre ve rol güncellemesi burada yapılmamalı (ayrı/yetkili endpoint)

        const employeeDataToUpdate: Prisma.EmployeeUpdateInput = {};
        if (position !== undefined) employeeDataToUpdate.position = position;
        if (phoneNumber !== undefined) employeeDataToUpdate.phoneNumber = phoneNumber;
        if (tcKimlikNo !== undefined) employeeDataToUpdate.tcKimlikNo = tcKimlikNo;
        if (hireDate !== undefined) employeeDataToUpdate.hireDate = hireDate ? new Date(hireDate) : null;
        if (birthDate !== undefined) employeeDataToUpdate.birthDate = birthDate ? new Date(birthDate) : null;
        if (address !== undefined) employeeDataToUpdate.address = address;
        if (iban !== undefined) employeeDataToUpdate.iban = iban;
        if (bloodType !== undefined) employeeDataToUpdate.bloodType = bloodType;
        if (drivingLicense !== undefined) employeeDataToUpdate.drivingLicense = drivingLicense;
        if (education !== undefined) employeeDataToUpdate.education = education;
        if (militaryStatus !== undefined) employeeDataToUpdate.militaryStatus = militaryStatus;
        if (salary !== undefined) employeeDataToUpdate.salary = salary === null ? null : parseFloat(salary);
        if (annualLeaveAllowance !== undefined) employeeDataToUpdate.annualLeaveAllowance = annualLeaveAllowance === null ? null : parseInt(annualLeaveAllowance);
        if (profilePictureUrl !== undefined) employeeDataToUpdate.profilePictureUrl = profilePictureUrl;
        if (emergencyContactName !== undefined) employeeDataToUpdate.emergencyContactName = emergencyContactName;
        if (emergencyContactPhone !== undefined) employeeDataToUpdate.emergencyContactPhone = emergencyContactPhone;
        if (emergencyContactRelation !== undefined) employeeDataToUpdate.emergencyContactRelation = emergencyContactRelation;
        
        // Departman bağlantısı güncellemesi
        if (departmentId !== undefined) {
            if (departmentId === null || departmentId === '') {
                // Departmanı kaldırmak için disconnect kullan (eğer employee varsa)
                if (existingUser.employee) {
                   employeeDataToUpdate.department = { disconnect: true };
                }
            } else {
                 // Yeni departmana bağlamak için connect kullan
                employeeDataToUpdate.department = { connect: { id: departmentId } };
            }
        }

        // 3. İşlemi Transaction İçinde Gerçekleştir
        const updatedUser = await prisma.$transaction(async (tx) => {
            // User verisini güncelle (eğer güncellenecek alan varsa)
            if (Object.keys(userDataToUpdate).length > 0) {
                await tx.user.update({ where: { id }, data: userDataToUpdate });
            }

            // Employee verisini güncelle (eğer güncellenecek alan varsa)
            // Employee kaydı olmayabilir, bu durumu kontrol et!
            if (existingUser.employee && Object.keys(employeeDataToUpdate).length > 0) {
                await tx.employee.update({ 
                    where: { userId: id }, // Employee'yi userId ile bulmak daha güvenli olabilir
                    data: employeeDataToUpdate 
                });
            } else if (!existingUser.employee && Object.keys(employeeDataToUpdate).length > 0) {
                // Eğer employee yoksa ve güncellenecek employee verisi varsa, 
                // yeni employee kaydı oluşturulabilir mi? Bu senaryo gözden geçirilmeli.
                // Şimdilik sadece var olanı güncelliyoruz.
                console.warn(`[Backend User Update] User ID ${id} için Employee kaydı bulunamadı, güncelleme atlandı.`);
            }

            // Güncellenmiş tam kullanıcı verisini geri döndür (getUserById'daki gibi)
            return await tx.user.findUnique({ 
                where: { id },
                select: { /* getUserById içindeki select alanları */
                    id: true, email: true, firstName: true, lastName: true, roleId: true, createdAt: true, updatedAt: true,
                    role: { select: { name: true, permissions: true } },
                    employee: {
                        select: {
                            id: true, position: true, phoneNumber: true, tcKimlikNo: true, hireDate: true, birthDate: true, address: true, iban: true, bloodType: true, drivingLicense: true, education: true, militaryStatus: true, salary: true, annualLeaveAllowance: true, profilePictureUrl: true, departmentId: true,
                            department: { select: { id: true, name: true } },
                            emergencyContactName: true, emergencyContactPhone: true, emergencyContactRelation: true,
                            documents: { select: { id: true, name: true, url: true, type: true, size: true, uploadDate: true }, orderBy: { uploadDate: 'desc' } }
                        }
                    }
                 } 
            });
        });

        console.log(`[Backend User] ID'si ${id} olan kullanıcı başarıyla güncellendi.`);
        res.status(200).json(updatedUser);

    } catch (error) {
        console.error(`[Backend User] Kullanıcı ${id} güncelleme hatası:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Unique constraint hatası (örn: email zaten kullanılıyor)
            if (error.code === 'P2002') {
                const target = (error.meta?.target as string[])?.join(', ') || 'alan';
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
};

/**
 * Base64 formatındaki profil resmini kullanıcı için kaydeder
 * @param req Request - { body: { base64Image } }
 * @param res Response
 */
export const uploadProfileImage = async (req: Request, res: Response) => {
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
    } else if (imageType.includes('gif')) {
      fileExtension = 'gif';
    }
    
    // Benzersiz dosya adı ve kaydetme yolu
    const fileName = `${id}-${uuidv4()}.${fileExtension}`;
    const uploadPath = path.join(__dirname, '../../uploads/profile-pictures');
    
    // Klasörün var olduğunu kontrol et, yoksa oluştur
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    const filePath = path.join(uploadPath, fileName);
    
    // Dosyayı kaydet
    fs.writeFileSync(filePath, buffer);
    
    // Sunucu üzerindeki URL'i oluştur
    const profilePictureUrl = `/uploads/profile-pictures/${fileName}`;
    
    // Kullanıcının employee kaydını bul
    const employee = await prisma.employee.findUnique({
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
        const oldFilePath = path.join(__dirname, '../../uploads/profile-pictures', oldFileName);
        
        // Dosya varsa sil
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`Eski profil resmi silindi: ${oldFilePath}`);
        }
      }
    }
    
    // Employee tablosunu güncelle
    await prisma.employee.update({
      where: { userId: id },
      data: { profilePictureUrl }
    });
    
    // Güncellenmiş kullanıcı bilgilerini getir
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true,
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
  } catch (error) {
    console.error('Profil resmi yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Profil resmi yüklenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Kullanıcının profil resmi yüklemesi için handler
 * @param req Request - form-data profil resmi dosyası içerir
 * @param res Response
 */
export const uploadProfilePicture = async (req: Request, res: Response) => {
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
    const employee = await prisma.employee.findUnique({
      where: { userId: id }
    });
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı için personel kaydı bulunamadı.'
      });
    }
    
    // Eski profil resmini sil (varsa)
    if (employee.profilePictureUrl) {
      // URL'den dosya adını çıkar
      const oldFileName = employee.profilePictureUrl.split('/').pop();
      if (oldFileName) {
        const oldFilePath = path.join(__dirname, '../../uploads/profile-pictures', oldFileName);
        
        // Dosya varsa sil
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`Eski profil resmi silindi: ${oldFilePath}`);
        }
      }
    }
    
    // Employee'i güncelle
    await prisma.employee.update({
      where: { userId: id },
      data: { profilePictureUrl }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Profil resmi başarıyla yüklendi',
      profilePictureUrl
    });
  } catch (error) {
    console.error('Profil resmi yükleme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Profil resmi yüklenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Kullanıcıyı ve ilişkili tüm verilerini (personel, dökümanlar, profil resmi) siler.
 * @param req Request - params içinde kullanıcı ID'si bulunur
 * @param res Response
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Kullanıcıya ait Employee kaydını bul (profil resmi ve employee ID için)
      const employee = await tx.employee.findUnique({
        where: { userId: id },
        select: { id: true, profilePictureUrl: true }
      });

      if (employee) {
        const employeeId = employee.id;

        // 2. İlişkili EmployeeDocument'ları sil
        await tx.employeeDocument.deleteMany({
          where: { employeeId: employeeId }
        });

        // 3. Profil resmini diskten sil (varsa)
        if (employee.profilePictureUrl) {
          const profilePicturePath = path.join(__dirname, '../../', employee.profilePictureUrl);
          try {
            if (fs.existsSync(profilePicturePath)) {
              fs.unlinkSync(profilePicturePath);
              console.log(`Profil resmi silindi: ${profilePicturePath}`);
            }
          } catch (unlinkError) {
            console.error(`Profil resmi silinirken hata oluştu (${profilePicturePath}):`, unlinkError);
            // Dosya silme hatası işlemi durdurmamalı, loglamak yeterli.
          }
        }

        // 4. Employee kaydını sil
        await tx.employee.delete({
          where: { id: employeeId }
        });
      }

      // 5. User kaydını sil
      const deletedUser = await tx.user.delete({
        where: { id: id }
      });

      // Kullanıcı bulunamazsa Prisma otomatik olarak hata fırlatacaktır.
      // Başarılı olursa buraya gelinir.
      res.status(200).json({
        success: true,
        message: 'Kullanıcı ve ilişkili tüm veriler başarıyla silindi.',
        data: { id: deletedUser.id }
      });
    });
  } catch (error) {
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
};

// Kullanıcı oluşturma/güncelleme/silme fonksiyonları da buraya eklenebilir 