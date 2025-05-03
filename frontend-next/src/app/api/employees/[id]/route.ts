import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as jwt from "jsonwebtoken";

// JWT secret should be in env vars in production
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET an employee by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Find employee by id
    const employee = await prisma.employee.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        position: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        phoneNumber: true,
        address: true,
        profilePictureUrl: true,
        tcKimlikNo: true,
        hireDate: true,
        annualLeaveAllowance: true,
        birthDate: true,
        bloodType: true,
        drivingLicense: true,
        education: true,
        militaryStatus: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { message: "Çalışan bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Employee fetch error:", error);
    return NextResponse.json(
      { message: "Çalışan bilgileri alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
}

// PUT to update an employee
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Verify token from Authorization header
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Yetkilendirme tokeni gereklidir." },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    
    // Only allow users to update their own profile or admins
    if (decoded.id !== id) {
      // TODO: Add admin check here if needed
      return NextResponse.json(
        { message: "Bu işlem için yetkiniz bulunmamaktadır." },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { name, surname, phoneNumber, address } = body;
    
    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: "Ad alanı gereklidir." },
        { status: 400 }
      );
    }
    
    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id: id },
      data: {
        name,
        surname,
        phoneNumber,
        address,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        position: true,
        phoneNumber: true,
        address: true,
      },
    });

    return NextResponse.json({
      message: "Profil bilgileri başarıyla güncellendi.",
      employee: updatedEmployee,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { message: "Geçersiz token." },
        { status: 401 }
      );
    }
    
    console.error("Employee update error:", error);
    return NextResponse.json(
      { message: "Profil bilgileri güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

// DELETE an employee
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // İlişkili tabloları temizle
    await prisma.employeeDocument.deleteMany({
      where: { employeeId: id },
    });
    
    await prisma.emergencyContact.deleteMany({
      where: { employeeId: id },
    });

    // Personeli sil
    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Personel başarıyla silindi.",
    });
  } catch (error) {
    console.error("Personel silinirken hata:", error);
    return NextResponse.json(
      { message: "Personel silinirken bir hata oluştu." },
      { status: 500 }
    );
  }
} 