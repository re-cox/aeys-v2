import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Debug API - temel CRUD işlemlerini kontrol et
export async function GET(request: Request) {
  try {
    console.log('[DEBUG] Debug API çağrıldı');
    
    // 1. Veritabanı bağlantısını kontrol et
    let isConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      isConnected = true;
      console.log('[DEBUG] Veritabanı bağlantısı başarılı');
    } catch (dbError) {
      console.error('[DEBUG] Veritabanı bağlantı hatası:', dbError);
      return NextResponse.json({ 
        error: 'Veritabanı bağlantısı kurulamadı',
        details: dbError instanceof Error ? dbError.message : 'Bilinmeyen hata'
      }, { status: 500 });
    }
    
    // 2. Çalışanları getir
    console.log('[DEBUG] Çalışanları getiriyor...');
    const employees = await prisma.employee.findMany({ take: 2 });
    console.log(`[DEBUG] ${employees.length} çalışan bulundu`);
    
    // 3. Tablo alanlarını al
    if (employees.length > 0) {
      const employeeFields = Object.keys(employees[0]);
      console.log('[DEBUG] Çalışan alanları:', employeeFields);
      
      // 4. Yazılabilir alanları belirle
      const updatableFields = [
        "name",
        "email",
        "phoneNumber",
        "position",
        "departmentId",
        "birthDate",
        "hireDate",
        "bloodType",
        "drivingLicense",
        "address",
        "profilePictureUrl", // "profileImage" değil
        "iban",
        "tcKimlikNo", // "identityNumber" değil
        "salary",
        "militaryStatus",
        "education",
        "salaryVisibleTo",
        "annualLeaveAllowance",
      ];
      
      return NextResponse.json({
        status: 'success',
        dbConnection: isConnected,
        employeeCount: employees.length,
        actualModelFields: employeeFields,
        updatableFields: updatableFields,
        sampleEmployee: employees[0] ? {
          id: employees[0].id,
          name: employees[0].name,
          email: employees[0].email,
          // Diğer alanlar için özet
          phoneNumber: employees[0].phoneNumber || null,
          position: employees[0].position || null,
          fields: `Toplam ${employeeFields.length} alan mevcut`
        } : null
      });
    } else {
      return NextResponse.json({
        status: 'warning',
        dbConnection: isConnected,
        message: 'Çalışan bulunamadı',
        suggestedAction: 'Veritabanında çalışan oluşturun'
      });
    }
  } catch (error) {
    console.error('[DEBUG] Genel hata:', error);
    
    return NextResponse.json({
      status: 'error',
      error: 'Hata oluştu',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 