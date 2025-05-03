import { NextRequest, NextResponse } from "next/server";

// API URL'ini .env.local dosyasından al veya DOĞRU varsayılan değeri kullan
const API_URL = process.env.API_URL || 'http://localhost:5001/api';

// --- Yardımcı Fonksiyon: Başlıkları Kopyala ---
function copyHeaders(incomingHeaders: Headers): Headers {
  // Headers nesnesi oluşturalım, set metodu için daha uygun
  const headers = new Headers(); 
  const authHeader = incomingHeaders.get('Authorization');
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }
  const acceptHeader = incomingHeaders.get('Accept');
  if (acceptHeader) {
    headers.set('Accept', acceptHeader);
  }
  // Content-Type'ı burada ayarlamıyoruz, isteğe göre aşağıda yapacağız
  return headers;
}

// API isteklerini yönlendirmek için proxy
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Next.js uyarısını önlemek için params.path özelliğini kopyalayalım
    const pathSegments = [...params.path];
    const path = pathSegments.join('/');
    const queryString = request.nextUrl.search || '';
    
    const apiURL = `${API_URL}/${path}${queryString}`;
    console.log(`[API Proxy] GET isteği: ${apiURL}`);
    
    const requestHeaders = copyHeaders(request.headers);
    // GET için Cache-Control ekleyebiliriz (isteğe bağlı)
    // requestHeaders['Cache-Control'] = 'no-cache';
     console.log(`[API Proxy] GET Başlıklar:`, JSON.stringify(Object.fromEntries(requestHeaders.entries())));

    try {
      const response = await fetch(apiURL, {
        method: 'GET',
        headers: requestHeaders, // Düzeltilmiş başlıklar
      });
      
      // Yanıt boş olabilir
      if (!response.ok) {
        console.error(`[API Proxy] Sunucu hatası: ${response.status} - ${response.statusText}`);
        try {
          const errorData = await response.json();
          return NextResponse.json(errorData, { status: response.status });
        } catch (e) {
          const errorText = await response.text();
          return NextResponse.json(
            { message: errorText || `Sunucu hatası: ${response.status} - ${response.statusText}` }, 
            { status: response.status }
          );
        }
      }
      
      // 204 No Content durumu
      if (response.status === 204) {
        return new NextResponse(null, { status: 204 });
      }

      // Content-Type'ı kontrol et
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        // JSON yanıtı
        try {
          const data = await response.json();
          // Orijinal Content-Type başlığını koruyalım
          const headers = new Headers(response.headers); 
          return NextResponse.json(data, { status: response.status, headers: headers });
        } catch (parseError) {
          console.error(`[API Proxy] Yanıt JSON olarak ayrıştırılamadı (bekleniyordu): ${parseError}`);
          // Bu durum aslında olmamalı, çünkü content-type json idi.
          // Güvenlik için düz metin olarak dönelim
          const text = await response.text(); // .text() çağrısı JSON hatası sonrası yapılabilir mi? Test edilmeli.
          return new NextResponse(text, { 
            status: 500, // İçerik tipi uyuşmazlığı nedeniyle sunucu hatası verelim
            headers: {
              'Content-Type': 'text/plain',
            }
          });
        }
      } else {
        // JSON olmayan yanıt (örn. dosya)
        console.log(`[API Proxy] JSON olmayan yanıt alınıyor, Content-Type: ${contentType}`);
        // Yanıt gövdesini (ReadableStream) ve başlıkları doğrudan ilet
        // response.body null olabilir mi kontrol et
        if (!response.body) {
           return new NextResponse(null, { status: response.status, headers: response.headers });
        }
        
        // Önemli: Orijinal başlıkları koru (Content-Type, Content-Disposition vb.)
        const headers = new Headers(response.headers); 
        
        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers, 
        });
      }

    } catch (fetchError) {
      console.error('[API Proxy] Backend sunucusuna bağlanılamadı (GET):', fetchError);
      return NextResponse.json(
        { 
          message: 'Backend sunucusuna bağlanılamadı. Sunucunun çalıştığından emin olun.',
          error: fetchError instanceof Error ? fetchError.message : 'Bilinmeyen bağlantı hatası'
        }, 
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('[API Proxy] GET isteği sırasında hata:', error);
    return NextResponse.json(
      { message: 'API isteği sırasında bir hata oluştu' }, 
      { status: 500 }
    );
  }
}

// POST metodu (Güncellenmiş)
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = [...params.path];
    const path = pathSegments.join('/');
    const apiURL = `${API_URL}/${path}`;
    console.log(`[API Proxy] POST isteği: ${apiURL}`);
    
    let requestBody: any;
    const contentType = request.headers.get('Content-Type') || '';
    const headersToForward = copyHeaders(request.headers); // Başlıkları kopyala

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      requestBody = formData;
      console.log('[API Proxy] Form verisi alındı');
      // Content-Type başlığını silebiliriz, fetch ekleyecek
      headersToForward.delete('Content-Type'); 
    } else {
      try {
        requestBody = await request.json();
        console.log('[API Proxy] JSON verisi alındı');
        headersToForward.set('Content-Type', 'application/json'); // JSON ise Content-Type ekle
      } catch (e) {
         console.warn('[API Proxy] POST isteği JSON gövdesi okunamadı veya boş:', e);
          // Eğer gövde boşsa veya JSON değilse, body'yi null veya boş bırakabiliriz
          requestBody = null; 
      }
    }
    
    const startTime = Date.now();
    console.log(`[API Proxy] ${apiURL} adresine POST isteği gönderiliyor, Başlıklar:`, JSON.stringify(Object.fromEntries(headersToForward.entries())));
    
    try {
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: headersToForward, // Kopyalanan başlıkları kullan
        body: requestBody instanceof FormData 
                ? requestBody 
                : (requestBody ? JSON.stringify(requestBody) : null), // Body null olabilir
      });
      
      const requestTime = Date.now() - startTime;
      console.log(`[API Proxy] Yanıt alındı: ${response.status}, süre: ${requestTime}ms`);
      
      // Hata durumu
      if (!response.ok) {
        console.error(`[API Proxy] Sunucu hatası: ${response.status} - ${response.statusText}`);
        
        try {
          const errorData = await response.json();
          return NextResponse.json(errorData, { status: response.status });
        } catch (jsonError) {
          const errorText = await response.text();
          return NextResponse.json(
            { message: errorText || 'Bilinmeyen sunucu hatası' }, 
            { status: response.status }
          );
        }
      }
      
      // 204 No Content durumu
      if (response.status === 204) {
        return new NextResponse(null, { status: 204 });
      }
      
      // Başarılı yanıt
      try {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } catch (parseError) {
        console.error(`[API Proxy] Yanıt JSON olarak ayrıştırılamadı: ${parseError}`);
        const text = await response.text();
        return new NextResponse(text, { 
          status: response.status,
          headers: {
            'Content-Type': 'text/plain',
          }
        });
      }
    } catch (fetchError) {
      console.error('[API Proxy] Backend sunucusuna bağlanılamadı (POST):', fetchError);
      return NextResponse.json(
        { 
          message: 'Backend sunucusuna bağlanılamadı. Sunucunun çalıştığından emin olun.',
          error: fetchError instanceof Error ? fetchError.message : 'Bilinmeyen bağlantı hatası'
        }, 
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('[API Proxy] POST isteği sırasında hata:', error);
    return NextResponse.json(
      { message: 'API isteği sırasında bir hata oluştu' }, 
      { status: 500 }
    );
  }
}

// PUT metodu (Güncellenmiş)
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = [...params.path];
    const path = pathSegments.join('/');
    const apiURL = `${API_URL}/${path}`;
    console.log(`[API Proxy] PUT isteği: ${apiURL}`);
    
    const requestBody = await request.json();
    const headersToForward = copyHeaders(request.headers); // Başlıkları kopyala
    headersToForward.set('Content-Type', 'application/json'); // PUT için Content-Type ekle

    console.log(`[API Proxy] ${apiURL} adresine PUT isteği gönderiliyor, Başlıklar:`, JSON.stringify(Object.fromEntries(headersToForward.entries())));

    try {
      const response = await fetch(apiURL, {
        method: 'PUT',
        headers: headersToForward, // Kopyalanan başlıkları kullan
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        console.error(`[API Proxy] Sunucu hatası: ${response.status} - ${response.statusText}`);
        try {
          const errorData = await response.json();
          return NextResponse.json(errorData, { status: response.status });
        } catch (jsonError) {
          const errorText = await response.text();
          return NextResponse.json(
            { message: errorText || 'Bilinmeyen sunucu hatası' }, 
            { status: response.status }
          );
        }
      }
      
      // 204 No Content durumu
      if (response.status === 204) {
        return new NextResponse(null, { status: 204 });
      }
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (fetchError) {
      console.error('[API Proxy] Backend sunucusuna bağlanılamadı (PUT):', fetchError);
      return NextResponse.json(
        { 
          message: 'Backend sunucusuna bağlanılamadı. Sunucunun çalıştığından emin olun.',
          error: fetchError instanceof Error ? fetchError.message : 'Bilinmeyen bağlantı hatası'
        }, 
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('[API Proxy] PUT isteği sırasında hata:', error);
    return NextResponse.json(
      { message: 'API isteği sırasında bir hata oluştu' }, 
      { status: 500 }
    );
  }
}

// DELETE metodu (Güncellenmiş)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = [...params.path];
    const path = pathSegments.join('/');
    const apiURL = `${API_URL}/${path}`;
    console.log(`[API Proxy] DELETE isteği: ${apiURL}`);

    const headersToForward = copyHeaders(request.headers); // Başlıkları kopyala

     console.log(`[API Proxy] ${apiURL} adresine DELETE isteği gönderiliyor, Başlıklar:`, JSON.stringify(Object.fromEntries(headersToForward.entries())));

    try {
      const response = await fetch(apiURL, {
        method: 'DELETE',
        headers: headersToForward, // Kopyalanan başlıkları kullan
      });
       
       // ... (DELETE yanıt işleme aynı)
       if (!response.ok) {
        console.error(`[API Proxy] Sunucu hatası: ${response.status} - ${response.statusText}`);
        // DELETE istekleri genellikle 404 veya 403 gibi durumlarda JSON dönmeyebilir
        const errorText = await response.text(); 
        return NextResponse.json(
          { message: errorText || `Sunucu hatası: ${response.status}` }, 
          { status: response.status }
        );
      }
      // Başarılı DELETE genellikle 204 No Content döner
      if (response.status === 204) {
        return new NextResponse(null, { status: 204 });
      }
       // Beklenmedik bir durum, belki 200 OK ile bir mesaj döndü?
       try {
         const data = await response.json();
         return NextResponse.json(data, { status: response.status });
       } catch (e) {
          // Ya da text döndü
          const text = await response.text();
          return new NextResponse(text, { 
              status: response.status, 
              headers: { 'Content-Type': 'text/plain' }
            });
       }

    } catch (fetchError) {
       console.error('[API Proxy] Backend sunucusuna bağlanılamadı (DELETE):', fetchError);
       return NextResponse.json(
         { 
           message: 'Backend sunucusuna bağlanılamadı. Sunucunun çalıştığından emin olun.',
           error: fetchError instanceof Error ? fetchError.message : 'Bilinmeyen bağlantı hatası'
         }, 
         { status: 502 }
       );
    }
  } catch (error) {
     console.error('[API Proxy] DELETE isteği sırasında hata:', error);
     return NextResponse.json(
      { message: 'API isteği sırasında bir hata oluştu' }, 
      { status: 500 }
    );
  }
}