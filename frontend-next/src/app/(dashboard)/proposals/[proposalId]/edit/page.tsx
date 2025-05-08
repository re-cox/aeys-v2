"use client";

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function EditProposalPagePlaceholder() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.proposalId as string;

  useEffect(() => {
    console.log(`Teklif Düzenleme Sayfası Yüklendi - ID: ${proposalId}`);
  }, [proposalId]);

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4"/> Geri Dön
      </Button>
      <h1 className="text-xl font-semibold">Teklif Düzenleme Sayfası</h1>
      <p className="mt-2 text-muted-foreground">Teklif ID: {proposalId}</p>
      <p className="mt-4 italic text-sm">Bu sayfanın işlevselliği geçici olarak devre dışı bırakılmıştır.</p>
    </div>
  );
} 