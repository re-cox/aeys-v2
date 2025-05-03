import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true, // Only active employees
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        profilePictureUrl: true,
        departmentId: true,
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc', // Alphabetical ordering
      },
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error('[API Employee List] Error:', error);
    let errorMessage = 'Çalışan listesi alınırken bir hata oluştu.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 