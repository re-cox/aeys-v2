import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, access } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        error: 'Dosya bulunamadı',
        details: 'Yükleme için dosya gönderilmedi.'
      }, { status: 400 });
    }

    // Klasör kontrolü ve oluşturma
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await access(uploadDir);
    } catch (error) {
      // Klasör yoksa oluştur
      try {
        await mkdir(uploadDir, { recursive: true });
        console.log(`Oluşturuldu: ${uploadDir}`);
      } catch (mkdirError) {
        console.error(`Dizin oluşturma hatası: ${uploadDir}`, mkdirError);
        throw new Error('Dosya kaydetme dizini oluşturulamadı.');
      }
    }

    // Tüm dosyaları işle
    const fileResults = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const originalFileName = file.name.replace(/\s+/g, '_');
        const fileName = `${uniqueSuffix}-${originalFileName}`;
        const filePath = path.join(uploadDir, fileName);

        // Dosyayı yaz
        await writeFile(filePath, buffer);
        console.log(`Dosya kaydedildi: ${filePath}`);

        // Erişilebilir URL
        const fileUrl = `/uploads/${fileName}`;

        return {
          fileName: originalFileName,
          originalName: originalFileName,
          fileUrl: fileUrl,
          path: fileUrl,
          fileType: file.type,
          mimeType: file.type,
          fileSize: file.size,
          size: file.size
        };
      })
    );

    return NextResponse.json({
      success: true,
      files: fileResults,
      fileUrls: fileResults.map(f => f.fileUrl)
    }, { status: 201 });

  } catch (error) {
    console.error("Dosya yükleme hatası:", error);

    let errorMessage = 'Dosya yüklenemedi';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = `Dosya yükleme hatası: ${error.name}`;
      errorDetails = error.message;
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
} 