import React from 'react';
import { getTeknisyenRaporu } from '@/services/teknisyenRaporService';
import { notFound } from 'next/navigation';
import TeknisyenRaporForm from '@/components/teknisyenraporlari/TeknisyenRaporForm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TeknisyenRaporu } from '@/types/teknisyen';

interface RaporDuzenlePageProps {
  params: {
    id: string;
  };
}

async function loadRaporData(id: string): Promise<TeknisyenRaporu | null> {
  try {
    if (!id || typeof id !== 'string') {
      console.warn("Geçersiz rapor ID sağlandı: ", id);
      return null;
    }
    const rapor = await getTeknisyenRaporu(id);
    return rapor;
  } catch (error: any) {
    if (error.message && error.message.includes('bulunamadı')) {
      console.warn(`Rapor bulunamadı, ID: ${id}`);
      return null;
    } else {
      console.error(`Rapor getirilirken beklenmedik hata, ID: ${id}:`, error);
      return null;
    }
  }
}

const RaporDuzenlePage = async ({ params }: RaporDuzenlePageProps) => {
  const rapor = await loadRaporData(params.id);

  if (!rapor) {
    notFound();
  }

  const initialData = {
    isinAdi: rapor.isinAdi,
    teknisyenNo: rapor.teknisyenNo,
    durum: rapor.durum,
    baslangicTarihi: rapor.baslangicTarihi,
    bitisTarihi: rapor.bitisTarihi,
    personeller: rapor.personeller || [],
  };

  return (
    <div className="container mx-auto py-10">
        <Button variant="outline" size="sm" asChild className='mb-4'>
           <Link href="/teknisyenraporlari">
                <ArrowLeft className="mr-2 h-4 w-4" /> Listeye Dön
           </Link>
       </Button>
       <Card className="max-w-4xl mx-auto">
         <CardHeader>
           <CardTitle>Teknisyen Raporunu Düzenle</CardTitle>
         </CardHeader>
         <CardContent>
            <TeknisyenRaporForm initialData={initialData} raporId={rapor.id} />
         </CardContent>
       </Card>
    </div>
  );
};

export default RaporDuzenlePage; 