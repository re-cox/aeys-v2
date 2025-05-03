'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Info, Zap, Cable } from 'lucide-react';
import AkimHesaplama from './components/AkimHesaplama';
import KabloOnerisi from './components/KabloOnerisi';

export default function AkimSigortaIstemci() {
  const [hesaplananAkim, setHesaplananAkim] = useState<number | null>(null);
  const [sistemTipi, setSistemTipi] = useState<'trifaze' | 'monofaze'>('trifaze');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Akım ve Kablo Kesiti Hesaplama</h1>
          <p className="text-muted-foreground">
            Trifaze ve monofaze sistemler için akım hesaplaması ve uygun kablo kesiti önerisi
          </p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="calculator">
            <Calculator className="mr-2 h-4 w-4" />
            Hesaplama
          </TabsTrigger>
          <TabsTrigger value="cables">
            <Cable className="mr-2 h-4 w-4" />
            Kablo Tipi
          </TabsTrigger>
          <TabsTrigger value="info">
            <Info className="mr-2 h-4 w-4" />
            Bilgi
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator" className="mt-6 space-y-6">
          <AkimHesaplama 
            onAkimHesaplandi={(akim, tip) => {
              setHesaplananAkim(akim);
              setSistemTipi(tip);
            }} 
          />
          
          {hesaplananAkim !== null && (
            <KabloOnerisi akimDegeri={hesaplananAkim} sistemTipi={sistemTipi} />
          )}
        </TabsContent>
        
        <TabsContent value="cables" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Kablo Tipleri ve Özellikleri</CardTitle>
              <CardDescription>
                Farklı kablo tipleri ve akım taşıma kapasiteleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">NYFGBY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Bakır iletkenli, PVC izoleli, çelik zırhlı, PVC dış kılıflı kablo</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">NA2XH</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Alüminyum iletkenli, XLPE izoleli, halojen içermeyen dış kılıflı kablo</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">N2XH FE180</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Bakır iletkenli, XLPE izoleli, yangına dayanıklı, halojen içermeyen kablo</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">NHXMH</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Bakır iletkenli, XLPE izoleli, halojen içermeyen, düşük duman yoğunluklu kablo</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">NYY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Bakır iletkenli, PVC izoleli, PVC dış kılıflı kablo</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">NAYFGBY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Alüminyum iletkenli, PVC izoleli, çelik zırhlı, PVC dış kılıflı kablo</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">N2XH</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Bakır iletkenli, XLPE izoleli, halojen içermeyen dış kılıflı kablo</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Akım Hesaplama Formülleri</CardTitle>
              <CardDescription>
                Trifaze ve monofaze sistemler için akım hesaplama formülleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="overflow-hidden border-2 border-blue-200 dark:border-blue-800">
                  <CardHeader className="bg-blue-100 dark:bg-blue-900/30">
                    <CardTitle className="flex items-center text-lg">
                      <Zap className="mr-2 h-5 w-5 text-blue-600" />
                      Trifaze Sistem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-md flex items-center justify-center">
                      <div className="text-xl font-medium">
                        I = <span className="font-bold">P / (√3 × U × Cosφ)</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm"><strong>I:</strong> Akım (Amper)</p>
                      <p className="text-sm"><strong>P:</strong> Güç (Watt)</p>
                      <p className="text-sm"><strong>U:</strong> Gerilim (380 V)</p>
                      <p className="text-sm"><strong>Cosφ:</strong> Güç faktörü (0.95)</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border-2 border-green-200 dark:border-green-800">
                  <CardHeader className="bg-green-100 dark:bg-green-900/30">
                    <CardTitle className="flex items-center text-lg">
                      <Zap className="mr-2 h-5 w-5 text-green-600" />
                      Monofaze Sistem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-md flex items-center justify-center">
                      <div className="text-xl font-medium">
                        I = <span className="font-bold">P / U</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm"><strong>I:</strong> Akım (Amper)</p>
                      <p className="text-sm"><strong>P:</strong> Güç (Watt)</p>
                      <p className="text-sm"><strong>U:</strong> Gerilim (220 V)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Info className="mr-2 h-5 w-5 text-amber-600" />
                  Önemli Bilgiler
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Kablo kesiti seçiminde hesaplanan akım değeri ve kablo tipi dikkate alınmalıdır.</li>
                  <li>Kablo kesiti seçilirken, hesaplanan akım değerinden daha yüksek akım taşıma kapasitesine sahip olan en küçük kesit seçilmelidir.</li>
                  <li>Kabloların akım taşıma kapasiteleri, kablo tipine, kesitine, döşeme şekline ve ortam sıcaklığına göre değişiklik gösterebilir.</li>
                  <li>Bu hesaplamalarda sunulan değerler standart koşullar için geçerlidir ve gerçek uygulamalarda farklılık gösterebilir.</li>
                  <li>Alternatif kablo çözümleri, büyük kesitli tek kablo yerine birden fazla küçük kesitli kablo kullanarak aynı akım taşıma kapasitesini elde etmenizi sağlar.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 