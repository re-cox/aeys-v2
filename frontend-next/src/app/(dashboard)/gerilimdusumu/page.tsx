import { Metadata } from "next";
import { VoltageDropForm } from "@/components/voltage-drop/voltage-drop-form";
import { VoltageDropExample } from "@/components/voltage-drop/voltage-drop-example";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Calculator, Info, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Gerilim Düşümü Hesaplama | Aydem Elektrik",
  description: "Trifaze ve monofaze sistemler için gerilim düşümü hesaplama aracı",
};

export default function VoltageDropPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerilim Düşümü Hesaplama</h1>
          <p className="text-muted-foreground">
            Trifaze ve monofaze sistemler için gerilim düşümü hesaplaması yapabilirsiniz.
          </p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="calculator">
            <Calculator className="mr-2 h-4 w-4" />
            Hesaplama
          </TabsTrigger>
          <TabsTrigger value="example">
            <BookOpen className="mr-2 h-4 w-4" />
            Örnek
          </TabsTrigger>
          <TabsTrigger value="info">
            <Info className="mr-2 h-4 w-4" />
            Bilgi
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator" className="mt-6">
          <VoltageDropForm />
        </TabsContent>
        
        <TabsContent value="example" className="mt-6">
          <VoltageDropExample />
        </TabsContent>
        
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerilim Düşümü Hesaplama Formülleri</CardTitle>
              <CardDescription>
                Bakır iletkenler için gerilim düşümü hesaplama formülleri ve açıklamaları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-100 dark:bg-blue-900/30">
                      <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">Devreler</th>
                      <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">İletken</th>
                      <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">Volt</th>
                      <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">Formüller</th>
                      <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">Sonuç</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 bg-blue-50 dark:bg-blue-900/10" rowSpan="2">TRİFAZE</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">Bakır</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">380</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">
                        %e = <span className="font-mono">100L.N / K.S.U² = 10*L.N(kW) / 56S(mm²)</span>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 font-bold">0,0124 L.N/S</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">Alüminyum</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">380</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">
                        %e = <span className="font-mono">100L.N / K.S.U² = 10*L.N(kW) / 35S(mm²)</span>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 font-bold">0,0198 L.N/S</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 bg-yellow-50 dark:bg-yellow-900/10" rowSpan="2">MONOFAZE</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">Bakır</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">220</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">
                        %e = <span className="font-mono">200L.N / K.S.U² = 2*10*L.N(kW) / 56S(2*20)</span>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 font-bold">0,074 L.N/S</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">Alüminyum</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">220</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">
                        %e = <span className="font-mono">200L.N / K.S.U² = 2*10*L.N(kW) / 35S(2*20)</span>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 font-bold">0,1184 L.N/S</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Parametreler</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 w-24">% e</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">GERİLİM DÜŞÜMÜ</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">VOLTAGE FALLING</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">YÜZDE PERCENT</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800">L</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">HAT MESAFESİ</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">DISTANCE OF LINE</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">METRE METER</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800">N</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">GÜÇ</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">POWER</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">(Kw)</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800">S</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">İLETKEN KESİTİ</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">CROSS-SECTION OF CONDUCTOR</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">mm²</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800">U</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">GERİLİM</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">VOLTAGE</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">Volt</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800">K</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">İLETKEN KATSAYISI</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">COEFFICIENT OF CONDUCTOR</td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2">m/Ω.mm²</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-blue-600" />
                  Önemli Bilgiler
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Gerilim düşümü hesaplamaları bakır (K=56) ve alüminyum (K=35) iletkenler için yapılabilmektedir.</li>
                  <li>Gerilim düşümü değeri %3'ten küçük olmalıdır.</li>
                  <li>Hesaplamalarda kullanılan katsayılar standart değerlerdir ve ortam koşullarına göre değişiklik gösterebilir.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}