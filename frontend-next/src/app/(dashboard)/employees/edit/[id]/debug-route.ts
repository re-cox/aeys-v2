import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Test API - temel CRUD işlemlerini kontrol et
export async function GET(request: Request) {
  try {
    // 1. Çalışanları getir
    const employees = await prisma.employee.findMany({ take: 1 });
    
    // 2. Veritabanı şemasını kontrol et
    const employeeFields = Object.keys(employees[0] || {});
    
    // 3. Yazılabilir alanları belirle
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
      message: 'Debug bilgileri',
      actualModelFields: employeeFields,
      updatableFields: updatableFields,
      sampleEmployee: employees[0] ? {
        id: employees[0].id,
        name: employees[0].name,
        email: employees[0].email,
        // Diğer alanları açığa çıkarmayalım
      } : null
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Hata oluştu',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 