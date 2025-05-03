'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Cable, CircuitBoard, AlertTriangle } from 'lucide-react';
import { 
  kabloTipleri, 
  onerilenKabloKesiti,
  getKabloAkimKapasitesi
} from './kablo-veri';
import KabloAlternatifleri from './KabloAlternatifleri';

interface KabloOnerisiProps {
  akimDegeri: number;
  sistemTipi: 'trifaze' | 'monofaze';
}

export default function KabloOnerisi({ akimDegeri, sistemTipi }: KabloOnerisiProps) {
  const [seciliKabloTipi, setSeciliKabloTipi] = useState('NYFGBY');
  const [onerilenKesit, setOnerilenKesit] = useState<string>('');
  const [onerilenKabloAkimKapasitesi, setOnerilenKabloAkimKapasitesi] = useState<number>(0);
  
  useEffect(() => {
    // Akım ve kablo tipine göre önerilen kesiti hesapla
    const kesit = onerilenKabloKesiti(seciliKabloTipi, akimDegeri, sistemTipi);
    setOnerilenKesit(kesit);
    
    // Önerilen kablonun akım taşıma kapasitesini al
    const akimKapasitesi = getKabloAkimKapasitesi(seciliKabloTipi, kesit, sistemTipi);
    setOnerilenKabloAkimKapasitesi(akimKapasitesi);
  }, [akimDegeri, seciliKabloTipi, sistemTipi]);
  
  const kabloTipiDegisti = (tip: string) => {
    setSeciliKabloTipi(tip);
  };
  
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cable className="mr-2 h-5 w-5" />
            Önerilen Kablo Kesiti
          </CardTitle>
          <CardDescription>
            Hesaplanan akım değerine göre önerilen kablo kesiti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kablo-tipi">Kablo Tipi</Label>
              <Select value={seciliKabloTipi} onValueChange={kabloTipiDegisti}>
                <SelectTrigger id="kablo-tipi" className="mt-1.5">
                  <SelectValue placeholder="Kablo tipini seçin" />
                </SelectTrigger>
                <SelectContent>
                  {kabloTipleri.map((tip) => (
                    <SelectItem key={tip.id} value={tip.id}>
                      {tip.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Sistem Tipi</Label>
              <div className="mt-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30">
                  {sistemTipi === 'trifaze' ? 'Trifaze (380V)' : 'Monofaze (220V)'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="py-4 border-t border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Hesaplanan Akım Değeri</Label>
                <p className="mt-1 text-2xl font-bold">{akimDegeri} A</p>
              </div>
              
              <div>
                <Label>Önerilen Kablo Kesiti</Label>
                <div className="mt-1">
                  <Badge className={`text-lg font-bold py-1.5 border ${getKesitBadgeColor(onerilenKesit)}`}>
                    {onerilenKesit}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Akım Taşıma Kapasitesi</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30 font-bold text-lg py-1.5">
                    {onerilenKabloAkimKapasitesi} A
                  </Badge>
                  {onerilenKabloAkimKapasitesi > 0 && akimDegeri > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30">
                      {Math.round((akimDegeri / onerilenKabloAkimKapasitesi) * 100)}% kullanım
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-900/10">
            <div className="flex gap-2 items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold">Önemli Notlar</h4>
                <ul className="mt-2 text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Bu hesaplama teorik değerlere dayanmaktadır ve yalnızca bilgi amaçlıdır.</li>
                  <li>Gerçek uygulamalarda, ortam şartları, kablo döşeme şekli, kullanım amacı gibi faktörlere bağlı olarak ek hesaplamalar gerekebilir.</li>
                  <li>Profesyonel bir elektrik mühendisi veya teknik uzman tarafından doğrulanmalıdır.</li>
                  <li>Güvenlik katsayısı dikkate alınmalı, hesaplanan değerden bir üst kesit tercih edilmelidir.</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Kablo Alternatifleri bileşenini ekleyelim */}
      {onerilenKesit && (
        <KabloAlternatifleri 
          akimDegeri={akimDegeri} 
          sistemTipi={sistemTipi} 
          kabloTipi={seciliKabloTipi} 
          onerilenKesit={onerilenKesit} 
        />
      )}
    </div>
  );
} 