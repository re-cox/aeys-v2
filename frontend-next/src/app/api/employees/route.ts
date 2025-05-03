import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, User, Department, Prisma } from '@prisma/client';
import prisma, { testDatabaseConnection } from "@/lib/prisma";

// Kullanıcı listesini getir (Model adı User)
export async function GET(request: NextRequest) {
  console.log("[API /employees] Çalışan listesi istendi (GET)");

  // Veritabanı bağlantısı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API /employees] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ 
        error: "Veritabanına bağlanılamadı. Lütfen veritabanı ayarlarınızı kontrol edin." 
      }, { status: 500 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // URL path'inden ID kontrolü (belirli bir çalışanı getirmek için)
    const segments = url.pathname.split('/');
    const idParam = segments[segments.length - 1];
    const isApiRoot = segments[segments.length - 1] === 'employees';

    // Belirli bir çalışanı getir (Employee üzerinden)
    if (!isApiRoot && idParam) {
      try {
        console.log(`[API /employees] Çalışan ${idParam} sorgulanıyor...`);
        const employee = await prisma.employee.findUnique({
          where: { id: idParam },
          include: {
            user: { select: { id: true, name: true, surname: true, email: true, role: { select: { id: true, name: true }} } },
            department: { select: { id: true, name: true } }
          }
        });

        if (!employee) {
          console.log(`[API /employees] Çalışan bulunamadı: ${idParam}`);
          return NextResponse.json({ error: "Çalışan bulunamadı" }, { status: 404 });
        }

        // İstenen formatta birleştirilmiş veri döndür (opsiyonel)
        const responseData = {
          id: employee.id,
          name: employee.user.name,
          surname: employee.user.surname,
          email: employee.user.email,
          position: employee.position,
          department: employee.department,
          role: employee.user.role,
          phoneNumber: employee.phoneNumber,
          hireDate: employee.hireDate,
        };

        console.log(`[API /employees] Çalışan ${idParam} başarıyla getirildi`);
        return NextResponse.json(responseData);
      } catch (findError) {
         console.error(`[API /employees] Çalışan ${idParam} getirme hatası:`, findError);
         return NextResponse.json({ error: "Çalışan getirilirken bir hata oluştu", details: findError instanceof Error ? findError.message : "Bilinmeyen hata" }, { status: 500 });
      }
    }

    // Tüm çalışanları getir (Employee üzerinden)
    try {
      console.log("[API /employees] Tüm çalışanlar getiriliyor...");
      
      const employees = await prisma.employee.findMany({
        include: {
          user: { select: { id: true, name: true, surname: true, email: true, role: { select: { id: true, name: true }} } },
          department: { select: { id: true, name: true } }
        },
        orderBy: [
          { department: { name: 'asc' } }, 
          { user: { name: 'asc' } }, 
          { user: { surname: 'asc' } }
        ]
      });

      // İstenen formatta birleştirilmiş veri döndür (opsiyonel)
      const responseData = employees.map(emp => ({
        id: emp.id,
        name: emp.user.name,
        surname: emp.user.surname,
        email: emp.user.email,
        position: emp.position,
        department: emp.department,
        role: emp.user.role,
      }));

      console.log(`[API /employees] ${responseData.length} çalışan başarıyla getirildi`);
      return NextResponse.json(responseData);
    } catch (findManyError) {
      console.error("[API /employees] Tüm çalışanları getirme hatası:", findManyError);
      return NextResponse.json({ error: "Çalışan listesi alınamadı", details: findManyError instanceof Error ? findManyError.message : "Bilinmeyen hata" }, { status: 500 });
    }
  } catch (error) {
     console.error("[API /employees] Çalışan listesi getirme hatası:", error);
     return NextResponse.json({ error: "Çalışan verileri alınamadı", details: error instanceof Error ? error.message : "Bilinmeyen hata" }, { status: 500 });
  }
}

// Yeni çalışan oluştur (User ve Employee birlikte)
export async function POST(request: NextRequest) {
  console.log("[API /employees] Yeni çalışan oluşturma isteği alındı (POST)");

  // Veritabanı bağlantısı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API /employees] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ 
        error: "Veritabanı bağlantısı kurulamadı. Lütfen veritabanı ayarlarınızı kontrol edin." 
      }, { status: 500 });
    }

    const data = await request.json();
    
    console.log("Gelen çalışan verisi:", JSON.stringify(data, null, 2));

    // Zorunlu alanları kontrol et (Hem User hem Employee için)
    if (!data.name || !data.surname || !data.email || !data.password || !data.roleId || !data.departmentId || !data.position || !data.tcKimlikNo) {
      return NextResponse.json({
        error: "Ad, soyad, e-posta, şifre, rol, departman, pozisyon ve TCKN zorunlu alanlardır."
      }, { status: 400 });
    }

    try {
      // Hash password (Use a library like bcrypt in production)
      const hashedPassword = data.password; // DANGER: Store plain text password (replace with hashing)

      // Create User and Employee within a transaction
      const newEmployee = await prisma.$transaction(async (tx) => {
        // 1. Create User
        const newUser = await tx.user.create({
          data: {
            email: data.email,
            name: data.name,
            surname: data.surname,
            passwordHash: hashedPassword,
            roleId: data.roleId,
            profilePictureUrl: data.profilePictureUrl || null,
          },
          select: { id: true } // Only select the ID
        });

        console.log("Yeni User oluşturuldu:", newUser.id);

        // 2. Create Employee, linking to the new User
        const createdEmployee = await tx.employee.create({
          data: {
            userId: newUser.id, // Link to the created user
            position: data.position,
            departmentId: data.departmentId,
            phoneNumber: data.phoneNumber || null,
            tcKimlikNo: data.tcKimlikNo,
            hireDate: data.hireDate ? new Date(data.hireDate) : new Date(), // Default to now if not provided
            birthDate: data.birthDate ? new Date(data.birthDate) : null,
            address: data.address || null,
            iban: data.iban || null,
            bloodType: data.bloodType || null,
            drivingLicense: data.drivingLicense || null,
            education: data.education || null,
            militaryStatus: data.militaryStatus || null,
            salary: data.salary ? parseFloat(data.salary) : null,
            annualLeaveAllowance: data.annualLeaveAllowance ? parseInt(data.annualLeaveAllowance) : null,
            emergencyContactName: data.emergencyContactName || null,
            emergencyContactPhone: data.emergencyContactPhone || null,
            emergencyContactRelation: data.emergencyContactRelation || null,
            profilePictureUrl: data.profilePictureUrl || null, // Also store in Employee if needed
          },
          include: {
            user: { select: { id: true, name: true, surname: true, email: true, role: { select: { id: true, name: true } } } },
            department: { select: { id: true, name: true } }
          }
        });

        console.log("Yeni Employee oluşturuldu:", createdEmployee.id);
        return createdEmployee;
      });

      console.log("[API /employees] Yeni çalışan başarıyla oluşturuldu:", newEmployee.id);
      return NextResponse.json(newEmployee, { status: 201 });

    } catch (error) {
      console.error("[API /employees] Çalışan oluşturma hatası:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation (e.g., email or tcKimlikNo already exists)
        if (error.code === 'P2002') {
          const target = (error.meta as any)?.target;
          return NextResponse.json({ 
            error: `Benzersiz alan hatası: ${target ? target.join(', ') : 'Bilinmeyen alan'} zaten mevcut.`,
          }, { status: 409 }); // Conflict
        }
        // Foreign key constraint (e.g., departmentId or roleId does not exist)
        if (error.code === 'P2003') {
           const field = (error.meta as any)?.field_name;
           return NextResponse.json({ 
            error: `İlişkili kayıt bulunamadı: ${field}. Lütfen geçerli bir ID sağlayın.`,
          }, { status: 400 });
        }
      }
      // Generic error
      return NextResponse.json({ 
        error: "Çalışan oluşturulamadı",
        details: error instanceof Error ? error.message : "Bilinmeyen veritabanı hatası"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[API /employees] Çalışan oluşturma genel hatası:", error);
    return NextResponse.json({ 
      error: "Çalışan oluşturma sırasında genel bir hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
}

// Çalışan güncelle
export async function PUT(request: NextRequest) {
  console.log("[API /employees] Çalışan güncelleme isteği alındı (PUT)");

  // Veritabanı bağlantısı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API /employees] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ error: "Veritabanına bağlanılamadı." }, { status: 500 });
    }

    // URL'den ID al
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const idParam = segments[segments.length - 1];

    if (!idParam || idParam === "employees") {
      return NextResponse.json({ error: "Güncellenecek çalışan ID'si URL'de belirtilmelidir" }, { status: 400 });
    }

    console.log(`[API /employees] Çalışan ${idParam} güncellenecek...`);

    const data = await request.json();
    console.log("Gelen güncelleme verisi:", JSON.stringify(data, null, 2));

    // Hangi alanların güncelleneceğini belirle (Employee ve ilişkili User için)
    const employeeUpdateData: Prisma.EmployeeUpdateInput = {};
    const userUpdateData: Prisma.UserUpdateInput = {};

    // Employee alanları
    if (data.position !== undefined) employeeUpdateData.position = data.position;
    if (data.departmentId !== undefined) employeeUpdateData.department = { connect: { id: data.departmentId } };
    if (data.phoneNumber !== undefined) employeeUpdateData.phoneNumber = data.phoneNumber;
    if (data.tcKimlikNo !== undefined) employeeUpdateData.tcKimlikNo = data.tcKimlikNo;
    if (data.hireDate !== undefined) employeeUpdateData.hireDate = data.hireDate ? new Date(data.hireDate) : null;
    if (data.birthDate !== undefined) employeeUpdateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.address !== undefined) employeeUpdateData.address = data.address;
    if (data.iban !== undefined) employeeUpdateData.iban = data.iban;
    if (data.bloodType !== undefined) employeeUpdateData.bloodType = data.bloodType;
    if (data.drivingLicense !== undefined) employeeUpdateData.drivingLicense = data.drivingLicense;
    if (data.education !== undefined) employeeUpdateData.education = data.education;
    if (data.militaryStatus !== undefined) employeeUpdateData.militaryStatus = data.militaryStatus;
    if (data.salary !== undefined) employeeUpdateData.salary = data.salary ? parseFloat(data.salary) : null;
    if (data.annualLeaveAllowance !== undefined) employeeUpdateData.annualLeaveAllowance = data.annualLeaveAllowance ? parseInt(data.annualLeaveAllowance) : null;
    if (data.emergencyContactName !== undefined) employeeUpdateData.emergencyContactName = data.emergencyContactName;
    if (data.emergencyContactPhone !== undefined) employeeUpdateData.emergencyContactPhone = data.emergencyContactPhone;
    if (data.emergencyContactRelation !== undefined) employeeUpdateData.emergencyContactRelation = data.emergencyContactRelation;
    if (data.profilePictureUrl !== undefined) employeeUpdateData.profilePictureUrl = data.profilePictureUrl;
    
    // User alanları
    if (data.name !== undefined) userUpdateData.name = data.name;
    if (data.surname !== undefined) userUpdateData.surname = data.surname;
    if (data.email !== undefined) userUpdateData.email = data.email;
    if (data.roleId !== undefined) userUpdateData.role = { connect: { id: data.roleId } };
    if (data.password !== undefined && data.password !== '') {
        // Hash password (Use bcrypt)
        userUpdateData.passwordHash = data.password; // DANGER: Plain text
    }
    if (data.profilePictureUrl !== undefined) userUpdateData.profilePictureUrl = data.profilePictureUrl;

    try {
        // Transaction içinde güncelle
        const updatedEmployee = await prisma.$transaction(async (tx) => {
            // 1. Employee var mı kontrol et
            const employee = await tx.employee.findUnique({ where: { id: idParam }, select: { userId: true } });
            if (!employee) {
                throw new Error("NOT_FOUND"); // Özel hata fırlat
            }

            // 2. User verilerini güncelle (eğer varsa)
            if (Object.keys(userUpdateData).length > 0) {
                 console.log("User güncelleniyor:", JSON.stringify(userUpdateData));
                await tx.user.update({
                    where: { id: employee.userId },
                    data: userUpdateData,
                });
            }

            // 3. Employee verilerini güncelle (eğer varsa)
             if (Object.keys(employeeUpdateData).length > 0) {
                 console.log("Employee güncelleniyor:", JSON.stringify(employeeUpdateData));
                 await tx.employee.update({
        where: { id: idParam },
                    data: employeeUpdateData,
                });
             }

            // 4. Güncellenmiş veriyi ilişkilerle birlikte getir
            return tx.employee.findUnique({
        where: { id: idParam },
                include: {
                  user: { select: { id: true, name: true, surname: true, email: true, role: { select: { id: true, name: true }} } },
                  department: { select: { id: true, name: true } }
                }
            });
        });

        console.log(`[API /employees] Çalışan ${idParam} başarıyla güncellendi`);
        return NextResponse.json(updatedEmployee);

    } catch (error) {
        console.error(`[API /employees] Çalışan ${idParam} güncelleme hatası:`, error);

        if (error instanceof Error && error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Güncellenecek çalışan bulunamadı" }, { status: 404 });
        }
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            const target = (error.meta as any)?.target;
             return NextResponse.json({ error: `Benzersiz alan hatası: ${target ? target.join(', ') : 'Bilinmeyen alan'} zaten mevcut.` }, { status: 409 });
          }
          if (error.code === 'P2003') {
             const field = (error.meta as any)?.field_name;
             return NextResponse.json({ error: `İlişkili kayıt bulunamadı: ${field}. Lütfen geçerli bir ID sağlayın.` }, { status: 400 });
          }
           if (error.code === 'P2025') { // Kayıt bulunamadı (genellikle update/delete için)
             return NextResponse.json({ error: "Güncellenecek veya ilişkili kayıt bulunamadı." }, { status: 404 });
           }
        }
        return NextResponse.json({ 
            error: "Çalışan güncellenemedi",
            details: error instanceof Error ? error.message : "Bilinmeyen veritabanı hatası"
        }, { status: 500 });
    }
  } catch (error) {
    console.error("[API /employees] Çalışan güncelleme genel hatası:", error);
    return NextResponse.json({ 
        error: "Çalışan güncelleme sırasında genel bir hata oluştu",
        details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
}

// Çalışan sil
export async function DELETE(request: NextRequest) {
  console.log("[API /employees] Çalışan silme isteği alındı (DELETE)");

  // Veritabanı bağlantısı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API /employees] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ error: "Veritabanına bağlanılamadı." }, { status: 500 });
    }

    // URL'den ID al
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const idParam = segments[segments.length - 1];

    if (!idParam || idParam === "employees") {
      return NextResponse.json({ error: "Silinecek çalışan ID'si URL'de belirtilmelidir" }, { status: 400 });
    }

    console.log(`[API /employees] Çalışan ${idParam} silinecek...`);

    try {
      // İlişkili User ID'sini bul
      const employee = await prisma.employee.findUnique({
        where: { id: idParam },
        select: { userId: true }
      });

      if (!employee) {
        return NextResponse.json({ error: "Silinecek çalışan bulunamadı" }, { status: 404 });
      }

      // Transaction içinde sil (önce Employee, sonra User)
      await prisma.$transaction(async (tx) => {
          // Çalışan ile ilişkili diğer kayıtları temizle/güncelle (Örn: Görevler, Raporlar vb.)
          // ÖNEMLİ: Bu kısım uygulamanızın veri modeline göre dikkatlice implemente edilmeli!
          // Örnek: await tx.task.updateMany({ where: { assignees: { some: { id: employee.userId } } }, data: { ... } });
          
          console.log(`[API /employees] Employee ${idParam} siliniyor...`);
          await tx.employee.delete({ where: { id: idParam } });
          
          console.log(`[API /employees] İlişkili User ${employee.userId} siliniyor...`);
          await tx.user.delete({ where: { id: employee.userId } });
      });

      console.log(`[API /employees] Çalışan ${idParam} ve ilişkili User başarıyla silindi`);
      return new NextResponse(null, { status: 204 }); // Başarılı silme

    } catch (error) {
      console.error(`[API /employees] Çalışan ${idParam} silme hatası:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Kayıt bulunamadı
          return NextResponse.json({ error: "Silinecek çalışan bulunamadı" }, { status: 404 });
        }
        // İlişkili kayıtlar hatası (Foreign key constraint - P2003)
        // Genellikle onDelete: Cascade ayarlanmadıysa veya başka modeller çalışana bağlıysa çıkar
        if (error.code === 'P2003') {
            console.warn(`[API /employees] Çalışana bağlı kayıtlar var, silinemiyor: ${idParam}`);
            return NextResponse.json({ 
              error: "Çalışana bağlı başka kayıtlar (görevler, raporlar vb.) bulunduğu için silinemez.",
              message: "Önce bu kayıtları silin veya başka bir çalışana atayın."
            }, { status: 409 }); // Conflict
        }
      }
      return NextResponse.json({ 
        error: "Çalışan silinemedi",
        details: error instanceof Error ? error.message : "Bilinmeyen veritabanı hatası"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[API /employees] Çalışan silme genel hatası:", error);
    return NextResponse.json({ 
        error: "Çalışan silme işlemi sırasında genel bir hata oluştu",
        details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
} 