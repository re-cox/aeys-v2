import { NextResponse } from 'next/server';
import { runSeed } from '../run-seed';

export async function GET() {
  try {
    const result = await runSeed();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        departments: result.departments,
        employees: result.employees
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Seed API hatası:', error);
    return NextResponse.json({
      success: false,
      message: 'Veritabanı seed işlemi sırasında bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
} 