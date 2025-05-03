import React from 'react';
import TeknisyenRaporForm from '@/components/teknisyenraporlari/TeknisyenRaporForm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const YeniTeknisyenRaporuPage = () => {
  return (
    <div className="container mx-auto py-10">
        <Button variant="outline" size="sm" asChild className='mb-4'>
           <Link href="/teknisyenraporlari">
                <ArrowLeft className="mr-2 h-4 w-4" /> Listeye Dön
           </Link>
       </Button>
       <Card className="max-w-4xl mx-auto">
         <CardHeader>
           <CardTitle>Yeni Teknisyen Raporu Oluştur</CardTitle>
         </CardHeader>
         <CardContent>
            {/* Formu reportId olmadan çağırarak oluşturma modunu belirtiyoruz */}
            <TeknisyenRaporForm />
         </CardContent>
       </Card>
    </div>
  );
};

export default YeniTeknisyenRaporuPage; 