import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Personel listesini getir
export async function GET(req: NextRequest) {
  try {
    const personeller = await prisma.employee.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        phoneNumber: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(personeller);
  } catch (error) {
    console.error('Personel listesi getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Personel listesi getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 