'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Cable } from 'lucide-react';
import { kabloTipleri, getKabloData, monofazeKesitler } from './kablo-veri';

interface KabloAlternatifleriProps {
  akimDegeri: number;
  sistemTipi: 'trifaze' | 'monofaze';
  kabloTipi: string;
  onerilenKesit: string;
}

interface AlternatifKablo {
  adet: number;
  kesit: string;
  toplam: string;
}

export default function KabloAlternatifleri({ 
  akimDegeri, 
  sistemTipi, 
  kabloTipi, 
  onerilenKesit 
}: KabloAlternatifleriProps) {
  const [alternatifler, setAlternatifler] = useState<AlternatifKablo[]>([]);

  useEffect(() => {
    const hesaplananAlternatifler = hesaplaAlternatifler(kabloTipi, akimDegeri, onerilenKesit, sistemTipi);
    setAlternatifler(hesaplananAlternatifler);
  }, [akimDegeri, kabloTipi, onerilenKesit, sistemTipi]);

  // Kesit boyut renklerini belirleyelim
  const getKesitBadgeColor = (kesit: string) => {
    if (kesit.includes('400')) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30';
    if (kesit.includes('300')) return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/30';
    if (kesit.includes('240')) return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30';
    if (kesit.includes('185')) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900/30';
    if (kesit.includes('150')) return 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-900/30';
    if (kesit.includes('120')) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30';
    if (kesit.includes('95')) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30';
    if (kesit.includes('70')) return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-900/30';
    if (kesit.includes('50')) return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-900/30';
    if (kesit.includes('35')) return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-900/30';
    if (kesit.includes('25')) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30';
    if (kesit.includes('16')) return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-900/30';
    return 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-900/30';
  };

  if (alternatifler.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Cable className="mr-2 h-5 w-5" />
          Alternatif Kablo Çözümleri
        </CardTitle>
        <CardDescription>
          Tek büyük kablo yerine kullanılabilecek küçük kablo alternatifleri
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alternatifler.map((alternatif, index) => (
              <Card key={index} className="bg-slate-50 dark:bg-slate-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Alternatif {index + 1}</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30">
                      {alternatif.adet} adet
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Kablo kesiti:</div>
                      <Badge className={`mt-1 py-0.5 border ${getKesitBadgeColor(alternatif.kesit)}`}>
                        {alternatif.kesit}
                      </Badge>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm text-muted-foreground">Toplam:</div>
                      <div className="text-lg font-bold">{alternatif.toplam}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg mt-4 gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>Bu alternatifler, toplam akım taşıma kapasitesi gereken değere eşit veya fazla olacak şekilde hesaplanmıştır.</p>
              <p className="mt-1">Gösterilen alternatifler öneri niteliğindedir. Gerçek uygulamalarda iletim kayıplarını, maliyeti ve montaj koşullarını dikkate alarak seçim yapınız.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Alternatif kablo kombinasyonlarını hesaplama fonksiyonu
function hesaplaAlternatifler(
  kabloTipi: string, 
  akimDegeri: number, 
  onerilenKesit: string,
  sistemTipi: 'trifaze' | 'monofaze'
): AlternatifKablo[] {
  if (sistemTipi === 'monofaze') {
    return hesaplaMonofazeAlternatifler(akimDegeri, onerilenKesit);
  }

  const alternatifleri: AlternatifKablo[] = [];
  const kabloData = getKabloData(kabloTipi);
  const { kesitler, akimDegerleri } = kabloData;
  
  // Önerilen kesitin indeksini bul
  const onerilenIndex = kesitler.findIndex(kesit => kesit === onerilenKesit);
  
  if (onerilenIndex <= 0) {
    // Eğer en düşük kesitteyse veya kesit bulunamadıysa alternatif yok
    return [];
  }
  
  // Önerilen kesitten daha küçük kesitler için alternatifler oluştur
  for (let i = 0; i < onerilenIndex; i++) {
    const kucukKesitAkimDegeri = akimDegerleri[i];
    
    // Kaç adet küçük kablo gerektiğini hesapla (tavan değeri)
    let adet = Math.ceil(akimDegeri / kucukKesitAkimDegeri);
    
    // Çok fazla kablo gerektiren alternatifleri gösterme (max 4 adet)
    if (adet <= 4) {
      // Toplam akım taşıma kapasitesi
      const toplamAkimKapasitesi = kucukKesitAkimDegeri * adet;
      
      alternatifleri.push({
        adet,
        kesit: kesitler[i],
        toplam: `${adet} × ${kesitler[i]} (${toplamAkimKapasitesi.toFixed(0)} A)`
      });
    }
  }
  
  // En mantıklı 3 alternatifi göster (en az sayıda kablo gerektiren)
  return alternatifleri.sort((a, b) => a.adet - b.adet).slice(0, 3);
}

// Monofaze sistemler için alternatif kablo hesaplaması
function hesaplaMonofazeAlternatifler(akimDegeri: number, onerilenKesit: string): AlternatifKablo[] {
  const alternatifleri: AlternatifKablo[] = [];
  
  // Monofaze kablolar için yaklaşık akım taşıma kapasiteleri
  const akimKapasiteleri = [
    16, 25, 32, 40, 50, 63, 80, 100, // 2x... serileri
    16, 25, 32, 40, 50, 63, 80, 100  // 3x... serileri
  ];
  
  // Önerilen kesitin indeksini bul
  const onerilenIndex = monofazeKesitler.findIndex(kesit => kesit === onerilenKesit);
  
  if (onerilenIndex <= 0) {
    // Eğer en düşük kesitteyse veya kesit bulunamadıysa alternatif yok
    return [];
  }
  
  // Önerilen kesitten daha küçük kesitler için alternatifler oluştur
  for (let i = 0; i < onerilenIndex; i++) {
    const kucukKesitAkimDegeri = akimKapasiteleri[i];
    
    // Kaç adet küçük kablo gerektiğini hesapla (tavan değeri)
    let adet = Math.ceil(akimDegeri / kucukKesitAkimDegeri);
    
    // Çok fazla kablo gerektiren alternatifleri gösterme (max 3 adet)
    if (adet <= 3) {
      // Toplam akım taşıma kapasitesi
      const toplamAkimKapasitesi = kucukKesitAkimDegeri * adet;
      
      alternatifleri.push({
        adet,
        kesit: monofazeKesitler[i],
        toplam: `${adet} × ${monofazeKesitler[i]} (${toplamAkimKapasitesi} A)`
      });
    }
  }
  
  // En mantıklı 3 alternatifi göster (en az sayıda kablo gerektiren)
  return alternatifleri.sort((a, b) => a.adet - b.adet).slice(0, 3);
} 