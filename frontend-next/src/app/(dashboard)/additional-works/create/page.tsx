"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdditionalWorkForm } from "@/components/forms/AdditionalWorkForm";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CreateAdditionalWorkPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/additional-works")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Ek İşlere Dön
        </Button>
        <h1 className="text-3xl font-bold">Ek İş Oluştur</h1>
      </div>
      
      <Separator />
      
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Ek İş Detayları</CardTitle>
          <CardDescription>
            Düzenli projeler dışında kalan görevleri takip etmek için yeni bir ek iş öğesi oluşturun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdditionalWorkForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
} 