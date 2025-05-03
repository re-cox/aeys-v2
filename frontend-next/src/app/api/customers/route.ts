import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { CustomerStatus } from '@/types/customer';
import { randomUUID } from 'crypto';

// Tüm müşterileri getir
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let whereClause: any = {};

    // Durum filtreleme
    if (status && Object.values(CustomerStatus).includes(status as CustomerStatus)) {
      whereClause.status = status;
    }

    // Arama filtreleme
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        Contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true
          }
        },
        proposals: {
          select: {
            id: true,
            proposalNo: true,
            status: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Müşterileri getirme hatası:", error);
    return NextResponse.json(
      { error: 'Müşteriler alınamadı', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Yeni müşteri oluştur
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { contacts, ...customerData } = data;

    // Gerekli alan kontrolü
    if (!customerData.name) {
      return NextResponse.json(
        { error: 'Müşteri adı zorunludur' },
        { status: 400 }
      );
    }

    // Müşteri oluştur
    const newCustomer = await prisma.customer.create({
      data: {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        taxId: customerData.taxId,
        status: customerData.status || CustomerStatus.ACTIVE,
        Contact: contacts && contacts.length > 0 ? {
          create: contacts.map((contact: any) => ({
            id: randomUUID(),
            name: contact.name,
            position: contact.position,
            email: contact.email,
            phone: contact.phone
          }))
        } : undefined
      },
      include: {
        Contact: true
      }
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error("Müşteri oluşturma hatası:", error);
    return NextResponse.json(
      { error: 'Müşteri oluşturulamadı', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT: Bir müşteriyi güncelle
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, contacts, ...customerData } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Müşteri ID\'si belirtilmemiş' },
        { status: 400 }
      );
    }

    // Müşterinin var olup olmadığını kontrol et
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: { Contact: true }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Müşteriyi güncelle
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        taxId: customerData.taxId,
        status: customerData.status,
      },
      include: {
        Contact: true
      }
    });

    // İletişim bilgilerini güncelle
    if (contacts && Array.isArray(contacts)) {
      // Mevcut iletişim bilgilerini sil
      await prisma.contact.deleteMany({
        where: { customerId: id }
      });

      // Yeni iletişim bilgilerini ekle
      if (contacts.length > 0) {
        for (const contact of contacts) {
          await prisma.contact.create({
            data: {
              id: randomUUID(),
              name: contact.name,
              position: contact.position,
              email: contact.email,
              phone: contact.phone,
              customerId: id
            }
          });
        }
      }
    }

    // Güncellenmiş müşteriyi tekrar getir
    const refreshedCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        Contact: true,
        proposals: {
          select: {
            id: true,
            proposalNo: true,
            status: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(refreshedCustomer);
  } catch (error) {
    console.error("Müşteri güncelleme hatası:", error);
    return NextResponse.json(
      { error: 'Müşteri güncellenemedi', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Bir müşteriyi sil
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Müşteri ID\'si belirtilmemiş' },
        { status: 400 }
      );
    }

    // İlişkili iletişim bilgilerini sil
    await prisma.contact.deleteMany({
      where: { customerId: id }
    });

    // Müşteriyi sil
    await prisma.customer.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Müşteri başarıyla silindi' });
  } catch (error) {
    console.error("Müşteri silme hatası:", error);
    
    // İlişkili kayıtlar nedeniyle silme hatası
    if (
      typeof error === 'object' && 
      error !== null && 
      'code' in error && 
      error.code === 'P2003'
    ) {
      return NextResponse.json(
        { error: 'Bu müşteri diğer kayıtlarla ilişkilendirildiği için silinemiyor. Önce ilişkili kayıtları kaldırın.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Müşteri silinemedi', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 