import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    customerId: string;
  };
}

// Belirli bir müşteriyi getir
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { customerId } = params;
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Müşteri getirme hatası (ID):", error);
    return NextResponse.json({ error: 'Müşteri alınamadı' }, { status: 500 });
  }
}

// Müşteriyi güncelle
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { customerId } = params;
    const data = await req.json();

    // E-posta ve Vergi No benzersizlik kontrolü (güncellenen ID hariç)
    if (data.email) {
      const existingByEmail = await prisma.customer.findUnique({ where: { email: data.email } });
      if (existingByEmail && existingByEmail.id !== customerId) {
        return NextResponse.json({ error: 'Bu e-posta adresi başka bir müşteriye ait' }, { status: 409 });
      }
    }
     if (data.taxNumber) {
        const existingByTax = await prisma.customer.findUnique({ where: { taxNumber: data.taxNumber } });
        if (existingByTax && existingByTax.id !== customerId) {
          return NextResponse.json({ error: 'Bu vergi numarası başka bir müşteriye ait' }, { status: 409 });
        }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        district: data.district,
        taxNumber: data.taxNumber,
        taxOffice: data.taxOffice,
        website: data.website,
        notes: data.notes,
      },
    });
    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Müşteri güncelleme hatası:", error);
    if ((error as any).code === 'P2025') {
       return NextResponse.json({ error: 'Güncellenecek müşteri bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Müşteri güncellenemedi' }, { status: 500 });
  }
}

// Müşteriyi sil
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { customerId } = params;

    await prisma.customer.delete({
      where: { id: customerId },
    });
    return NextResponse.json({ message: 'Müşteri başarıyla silindi' });

  } catch (error) {
    console.error("Müşteri silme hatası:", error);
    if ((error as any).code === 'P2025') {
       return NextResponse.json({ error: 'Silinecek müşteri bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Müşteri silinemedi' }, { status: 500 });
  }
} 