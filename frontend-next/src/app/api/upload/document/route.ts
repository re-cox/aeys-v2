import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error("[UPLOAD DOCUMENT] Dosya bulunamadı");
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Dosya boyutunu kontrol et
    if (file.size > 5 * 1024 * 1024) {
      console.error(`[UPLOAD DOCUMENT] Dosya boyutu limit aşımı: ${file.size} bytes`);
      return NextResponse.json(
        { error: 'Dosya boyutu 5MB\'ı aşamaz' }, 
        { status: 400 }
      );
    }

    console.log(`[UPLOAD DOCUMENT] Dosya bilgisi: ${file.name}, ${file.type}, ${file.size} bytes`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dosya adını benzersiz yapın
    const fileName = `${uuidv4()}-${file.name.replace(/\s/g, '-')}`;
    const documentId = uuidv4();
    
    try {
      // Klasörün var olduğundan emin ol
      const publicPath = path.join(process.cwd(), 'public/uploads/documents');
      
      // Klasör yoksa oluştur
      if (!existsSync(publicPath)) {
        console.log(`[UPLOAD DOCUMENT] Klasör oluşturuluyor: ${publicPath}`);
        await mkdir(publicPath, { recursive: true });
      }
      
      const filePath = path.join(publicPath, fileName);
      console.log(`[UPLOAD DOCUMENT] Dosya kaydediliyor: ${filePath}`);
      
      // Dosyayı yaz
      await writeFile(filePath, buffer);
      console.log(`[UPLOAD DOCUMENT] Dosya başarıyla kaydedildi: ${filePath}`);
      
      return NextResponse.json({ 
        id: documentId,
        url: `/uploads/documents/${fileName}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString()
      });
    } catch (fileError) {
      console.error('[UPLOAD DOCUMENT] Dosya yazma hatası, Base64 alternatifi kullanılıyor:', fileError);
      
      // Dosya yazılamazsa Base64 ile döndür
      const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;
      
      return NextResponse.json({ 
        id: documentId,
        url: base64Data,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        isBase64: true // Base64 formatında olduğunu belirt
      });
    }
  } catch (error) {
    console.error('[UPLOAD DOCUMENT] Döküman yüklenirken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Döküman yüklenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
} 