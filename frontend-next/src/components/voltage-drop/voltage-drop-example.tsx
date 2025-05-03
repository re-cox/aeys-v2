"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateExampleSegment, calculateTotalExampleDrop } from "@/services/voltageDropService";

export function VoltageDropExample() {
  // Örnek hesaplama sonuçları
  const e1 = calculateExampleSegment('e1');
  const e2 = calculateExampleSegment('e2');
  const e3 = calculateExampleSegment('e3');
  const eTotal = calculateTotalExampleDrop();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Örnek Gerilim Düşümü Hesabı</CardTitle>
        <CardDescription>
          Trifaze sistem için örnek bir hat üzerinde gerilim düşümü hesaplaması
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          {/* Görsel Hat Diyagramı */}
          <div className="min-w-[700px] h-[300px] relative border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
            {/* Ana Hat */}
            <div className="absolute top-[50px] left-0 right-0 h-[2px] bg-gray-800 dark:bg-gray-200"></div>
            
            {/* Başlangıç Noktası */}
            <div className="absolute top-[30px] left-[20px] transform -translate-y-1/2">
              <div className="w-[20px] h-[20px] bg-black dark:bg-white transform rotate-45"></div>
            </div>
            
            {/* YPSAYAÇ */}
            <div className="absolute top-[50px] left-[150px] transform -translate-y-1/2">
              <div className="w-[30px] h-[80px] bg-gray-300 dark:bg-gray-700 border border-gray-400 dark:border-gray-600">
                <div className="w-full h-[40px] border-b border-gray-400 dark:border-gray-600 bg-gray-400 dark:bg-gray-600"></div>
              </div>
              <div className="text-center text-xs mt-1">YPSAYAÇ</div>
              <div className="text-center text-xs mt-1">8 kW</div>
            </div>
            
            {/* YP */}
            <div className="absolute top-[50px] left-[350px] transform -translate-y-1/2">
              <div className="w-[30px] h-[80px] bg-gray-300 dark:bg-gray-700 border border-gray-400 dark:border-gray-600">
                <div className="w-full h-[40px] border-b border-gray-400 dark:border-gray-600 bg-gray-400 dark:bg-gray-600"></div>
              </div>
              <div className="text-center text-xs mt-1">YP</div>
              <div className="text-center text-xs mt-1">8 kW</div>
            </div>
            
            {/* Son Nokta */}
            <div className="absolute top-[50px] right-[20px] transform -translate-y-1/2">
              <div className="flex flex-col items-center">
                <div className="w-[10px] h-[10px] rounded-full bg-black dark:bg-white mb-1"></div>
                <div className="text-xs">7.0 kW</div>
              </div>
            </div>
            
            {/* Mesafe Etiketleri */}
            <div className="absolute top-[20px] left-[85px] text-xs text-red-600 font-bold">15 m</div>
            <div className="absolute top-[20px] left-[250px] text-xs text-red-600 font-bold">5 m</div>
            <div className="absolute top-[20px] right-[85px] text-xs text-red-600 font-bold">15 m</div>
            
            {/* Kablo Kesit Bilgileri */}
            <div className="absolute bottom-[40px] left-[85px] text-xs">4 x 6 mm²</div>
            <div className="absolute bottom-[40px] left-[250px] text-xs">4 x 6 + 6 mm²</div>
            <div className="absolute bottom-[40px] right-[85px] text-xs">4 x 6 + 6 mm²</div>
            
            {/* Segment Etiketleri */}
            <div className="absolute bottom-[10px] left-[85px] text-xs font-semibold">e1</div>
            <div className="absolute bottom-[10px] left-[250px] text-xs font-semibold">e2</div>
            <div className="absolute bottom-[10px] right-[85px] text-xs font-semibold">e3</div>
          </div>
          
          {/* Hesaplama Tablosu */}
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="font-semibold">Segment</div>
              <div className="font-semibold">=</div>
              <div className="font-semibold">Hesaplama</div>
              <div className="font-semibold">=</div>
              <div className="font-semibold">Sonuç</div>
            </div>
            
            <div className="grid grid-cols-5 gap-2 text-center">
              <div>e1</div>
              <div>=</div>
              <div className="text-sm">0,0124 × <span className="underline">15 × 8 / 6</span></div>
              <div>=</div>
              <div className="font-bold">{e1.toFixed(3)}</div>
            </div>
            
            <div className="grid grid-cols-5 gap-2 text-center">
              <div>e2</div>
              <div>=</div>
              <div className="text-sm">0,0124 × <span className="underline">5 × 8 / 6</span></div>
              <div>=</div>
              <div className="font-bold">{e2.toFixed(3)}</div>
            </div>
            
            <div className="grid grid-cols-5 gap-2 text-center">
              <div>e3</div>
              <div>=</div>
              <div className="text-sm">0,0124 × <span className="underline">15 × 7 / 6</span></div>
              <div>=</div>
              <div className="font-bold">{e3.toFixed(3)}</div>
            </div>
            
            <div className="grid grid-cols-5 gap-2 text-center font-semibold border-t pt-2">
              <div>eT</div>
              <div>=</div>
              <div>e1 + e2 + e3</div>
              <div>=</div>
              <div className="font-bold">{eTotal.toFixed(3)} &lt; 3</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}