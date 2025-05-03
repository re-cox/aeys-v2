import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// API URL'ini .env.local dosyasından al
const API_URL = process.env.API_URL || 'http://localhost:8080/api';

export async function POST(request: NextRequest) {
  try {
    console.log('[UPLOAD] Profil fotoğrafı yükleme isteği başladı');
    
    // İstek içeriğini kontrol et
    const contentType = request.headers.get('content-type') || '';
    
    let base64Image: string | null = null;
    let file: File | null = null;
    
    // İstek tipine göre farklı işlem yap
    if (contentType.includes('application/json')) {
      // JSON isteği (Base64 resim)
      const jsonData = await request.json();
      base64Image = jsonData.image as string;
      
      if (!base64Image) {
        console.error('[UPLOAD] Base64 resim verisi bulunamadı');
        return NextResponse.json(
          { error: 'Base64 resim verisi bulunamadı' }, 
          { status: 400 }
        );
      }
      
      console.log('[UPLOAD] Base64 formatında resim alındı (uzunluk):', base64Image.length);
      
      // Benzersiz bir ID oluştur
      const imageId = uuidv4();
      
      return NextResponse.json({
        id: imageId,
        url: base64Image,
        name: "profile-image.jpg",
        type: "image/jpeg",
        uploadDate: new Date().toISOString()
      });
    } else {
      // Form veri isteği (dosya)
      const formData = await request.formData();
      file = formData.get('file') as File;
      
      if (!file) {
        console.error('[UPLOAD] Dosya bulunamadı');
        return NextResponse.json(
          { error: 'Dosya bulunamadı' }, 
          { status: 400 }
        );
      }
      
      console.log(`[UPLOAD] Dosya bilgisi: ${file.name}, ${file.type}, ${file.size} bytes`);
      
      // Dosya boyutunu kontrol et
      if (file.size > 2 * 1024 * 1024) {
        console.error(`[UPLOAD] Dosya boyutu limit aşımı: ${file.size} bytes`);
        return NextResponse.json(
          { error: 'Dosya boyutu 2MB\'ı geçemez' }, 
          { status: 400 }
        );
      }
      
      // Dosya tipini kontrol et
      if (!file.type.startsWith('image/')) {
        console.error(`[UPLOAD] Geçersiz dosya tipi: ${file.type}`);
        return NextResponse.json(
          { error: 'Sadece resim dosyaları yüklenebilir' }, 
          { status: 400 }
        );
      }
      
      try {
        // Form verisi oluştur ve dosyayı ekle
        const apiFormData = new FormData();
        apiFormData.append('file', file);
        
        console.log(`[UPLOAD] API isteği gönderiliyor: ${API_URL}/employees/upload-profile-image`);
        
        // API sunucusuna bağlanmayı dene
        const response = await fetch(`${API_URL}/employees/upload-profile-image`, {
          method: 'POST',
          body: apiFormData,
          // 5 saniyelik timeout ekle
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          console.error(`[UPLOAD] API hatası: ${response.status} - ${response.statusText}`);
          throw new Error(`API yanıtı başarısız: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[UPLOAD] Profil fotoğrafı yükleme başarılı, yanıt:', data);
        
        return NextResponse.json(data);
      } catch (apiError) {
        console.error('[UPLOAD] API hatası, Base64 alternatifi kullanılıyor:', apiError);
        
        // API hata verdiğinde Base64 ile çözüm sağla
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
        
        console.log('[UPLOAD] Base64 resim oluşturuldu (uzunluk):', base64Image.length);
        
        // Benzersiz bir ID oluştur
        const imageId = uuidv4();
        
        return NextResponse.json({
          id: imageId,
          url: base64Image,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('[UPLOAD] Profil fotoğrafı yükleme işlemi sırasında beklenmeyen hata:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Profil fotoğrafı yüklenirken bir hata oluştu'
      }, 
      { status: 500 }
    );
  }
} 