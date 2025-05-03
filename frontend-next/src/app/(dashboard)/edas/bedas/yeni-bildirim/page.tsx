"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

export default function NewBedasNotificationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formState, setFormState] = useState({
    refNo: "",
    projectName: "",
    applicationType: "",
    customerName: "",
    city: "",
    district: "",
    parcelBlock: "",
    parcelNo: "",
  });
  
  // Form handling
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Zorunlu alanları kontrol et
    const requiredFields = ["refNo", "customerName", "applicationType"];
    const missingFields = requiredFields.filter(field => !formState[field as keyof typeof formState]);
    
    if (missingFields.length > 0) {
      toast.error(`Lütfen zorunlu alanları doldurun: ${missingFields.join(", ")}`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // İsteği göndermeden önce konsola yazdır (debug için)
      console.log("[BEDAS Frontend] Gönderilecek bildirim verisi:", formState);
      
      const response = await fetch("/api/edas/bedas/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });
      
      console.log("[BEDAS Frontend] API yanıt durumu:", response.status, response.statusText);
      
      const result = await response.json();
      console.log("[BEDAS Frontend] API yanıt içeriği:", result);
      
      if (result.success) {
        toast.success("Bildirim başarıyla oluşturuldu!");
        router.push(`/edas/bedas/bildirim/${result.data.id}`);
      } else {
        // Hata detaylarını konsola yazdır
        console.error("[BEDAS Frontend] API başarısız yanıt:", result.message);
        throw new Error(result.message || "Bildirim oluşturulurken bir hata oluştu.");
      }
    } catch (error) {
      console.error("[BEDAS Frontend] Bildirim oluşturulurken hata:", error);
      
      // Hatanın tipini kontrol et ve detaylı mesaj oluştur
      let errorMessage = "Bildirim oluşturulurken bir hata oluştu.";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("[BEDAS Frontend] Hata detayı:", error.stack);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      {/* Geri Dön Butonu */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push("/edas/bedas")} 
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          BEDAŞ Bildirimlerine Dön
        </Button>
      </div>
      
      {/* Form Kartı */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Yeni BEDAŞ Bildirimi</CardTitle>
          <CardDescription>
            Yeni bir BEDAŞ bildirimi oluşturmak için formu doldurun. Girdiğiniz referans numarası, "Proje" adımının başvuru numarası olarak kaydedilecektir.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Referans No (Zorunlu) */}
              <div className="space-y-2">
                <Label htmlFor="refNo" className="flex items-center">
                  Referans No <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="refNo"
                  name="refNo"
                  value={formState.refNo}
                  onChange={handleChange}
                  placeholder="Referans numarası girin"
                  required
                />
                <p className="text-xs text-slate-500">Benzersiz bir referans numarası girin.</p>
              </div>
              
              {/* Başvuru Türü (Zorunlu) */}
              <div className="space-y-2">
                <Label htmlFor="applicationType" className="flex items-center">
                  Başvuru Türü <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formState.applicationType}
                  onValueChange={(value) => handleSelectChange("applicationType", value)}
                  required
                >
                  <SelectTrigger id="applicationType">
                    <SelectValue placeholder="Başvuru türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIHAI_BAGLANTI">Nihai Bağlantı</SelectItem>
                    <SelectItem value="SANTIYE">Şantiye</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Proje Adı */}
              <div className="space-y-2">
                <Label htmlFor="projectName">Proje Adı</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={formState.projectName}
                  onChange={handleChange}
                  placeholder="Proje adı girin"
                />
              </div>
              
              {/* Müşteri Adı (Zorunlu) */}
              <div className="space-y-2">
                <Label htmlFor="customerName" className="flex items-center">
                  Müşteri Adı/Unvanı <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formState.customerName}
                  onChange={handleChange}
                  placeholder="Müşteri adını girin"
                  required
                />
              </div>
              
              {/* İl */}
              <div className="space-y-2">
                <Label htmlFor="city">İl</Label>
                <Input
                  id="city"
                  name="city"
                  value={formState.city}
                  onChange={handleChange}
                  placeholder="İl girin"
                />
              </div>
              
              {/* İlçe */}
              <div className="space-y-2">
                <Label htmlFor="district">İlçe</Label>
                <Input
                  id="district"
                  name="district"
                  value={formState.district}
                  onChange={handleChange}
                  placeholder="İlçe girin"
                />
              </div>
              
              {/* Ada */}
              <div className="space-y-2">
                <Label htmlFor="parcelBlock">Ada</Label>
                <Input
                  id="parcelBlock"
                  name="parcelBlock"
                  value={formState.parcelBlock}
                  onChange={handleChange}
                  placeholder="Ada numarasını girin"
                />
              </div>
              
              {/* Parsel */}
              <div className="space-y-2">
                <Label htmlFor="parcelNo">Parsel</Label>
                <Input
                  id="parcelNo"
                  name="parcelNo"
                  value={formState.parcelNo}
                  onChange={handleChange}
                  placeholder="Parsel numarasını girin"
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/edas/bedas")}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Oluşturuluyor..." : "Bildirimi Oluştur"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 