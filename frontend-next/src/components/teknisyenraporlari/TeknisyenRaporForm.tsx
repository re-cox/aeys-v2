"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TeknisyenRaporu, TeknisyenRaporuDurum } from "@/types/teknisyen";
import { createTeknisyenRaporu, updateTeknisyenRaporu, getPersoneller } from "@/services/teknisyenRaporService";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Personel } from "@/types/teknisyen";

interface TeknisyenRaporFormProps {
  initialData?: Partial<TeknisyenRaporu>;
  raporId?: string;
}

// Tarih ve saati birleştiren yardımcı fonksiyon
const combineDateAndTime = (date: Date | undefined, time: string): Date | undefined => {
  if (!date) return undefined;
  const [hours, minutes] = time.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0); // Saat ve dakikayı ayarla, saniye ve milisaniyeyi sıfırla
  return newDate;
};

// Date nesnesinden saati 'HH:mm' formatında alan yardımcı fonksiyon
const formatTime = (date: Date | undefined): string => {
  if (!date) return "00:00";
  return format(date, "HH:mm");
};

export default function TeknisyenRaporForm({ initialData, raporId }: TeknisyenRaporFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isinAdi, setIsinAdi] = useState(initialData?.isinAdi || "");
  const [teknisyenNo, setTeknisyenNo] = useState(initialData?.teknisyenNo || "");
  const [durum, setDurum] = useState<TeknisyenRaporuDurum>(
    initialData?.durum || "Beklemede"
  );
  // Sadece tarih kısmını saklamak için
  const [baslangicTarihiDate, setBaslangicTarihiDate] = useState<Date | undefined>(
    initialData?.baslangicTarihi
      ? new Date(initialData.baslangicTarihi)
      : new Date()
  );
  // Saati ayrı saklamak için
  const [baslangicSaati, setBaslangicSaati] = useState<string>(
    formatTime(initialData?.baslangicTarihi ? new Date(initialData.baslangicTarihi) : new Date())
  );

  const [bitisTarihiDate, setBitisTarihiDate] = useState<Date | undefined>(
    initialData?.bitisTarihi
      ? new Date(initialData.bitisTarihi as string)
      : undefined
  );
  const [bitisSaati, setBitisSaati] = useState<string>(
    formatTime(initialData?.bitisTarihi ? new Date(initialData.bitisTarihi as string) : undefined)
  );
  
  const [personeller, setPersoneller] = useState<Personel[]>([]);
  const [seciliPersoneller, setSeciliPersoneller] = useState<string[]>(
    initialData?.personeller || []
  );
  const [dosyalar, setDosyalar] = useState<File[]>([]);
  
  useEffect(() => {
    const fetchPersoneller = async () => {
      try {
        // Doğru servis fonksiyonunu çağırdığımızdan emin olalım
        const data = await getPersoneller();
        console.log("Forma Gelen Personel Verisi:", data);
        setPersoneller(data);
      } catch (error) {
        console.error("Personel listesi getirilirken hata:", error);
        toast({
          title: "Hata",
          description: "Personel listesi yüklenemedi.",
          variant: "destructive",
        });
      }
    };
    
    fetchPersoneller();
  }, [toast]); // toast'ı dependency array'e ekleyelim
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isinAdi || !teknisyenNo) {
      toast({
        title: "Hata",
        description: "Lütfen işin adını ve teknisyen numarasını belirtin.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Tarih ve saatleri birleştir
    const combinedBaslangicTarihi = combineDateAndTime(baslangicTarihiDate, baslangicSaati);
    const combinedBitisTarihi = combineDateAndTime(bitisTarihiDate, bitisSaati);

    // API'ye gönderilecek veri objesini oluşturalım
    const raporData: Partial<TeknisyenRaporu> = {
      isinAdi,
      teknisyenNo,
      durum,
      baslangicTarihi: combinedBaslangicTarihi?.toISOString(),
      bitisTarihi: combinedBitisTarihi?.toISOString(),
      personeller: seciliPersoneller,
    };

    // Dosyaları FormData ile göndermek daha uygun olabilir, ancak şimdilik veri objesi kullanalım
    // Eğer dosya yükleme backend'de FormData bekliyorsa, bu kısmı tekrar düzenlemek gerekir.

    try {
      let result;
      
      if (raporId) {
        // Güncelleme
        result = await updateTeknisyenRaporu(raporId, raporData);
      } else {
        // Yeni oluşturma
        result = await createTeknisyenRaporu(raporData);
      }
      
      if (result) {
        toast({
          title: "Başarılı",
          description: `Rapor başarıyla ${raporId ? 'güncellendi' : 'oluşturuldu'}.`,
        });
        router.push(`/teknisyenraporlari`); // Listeye yönlendirelim
        router.refresh(); // Sayfayı yenileyerek güncel listeyi gösterelim
      }
    } catch (error: any) { // Hata tipini any olarak alalım veya spesifik bir tip tanımlayalım
      console.error("Form gönderimi sırasında hata:", error);
      // Backend'den gelen hata mesajını göstermeye çalışalım
      const errorMessage = error.response?.data?.error || "Rapor kaydedilirken bir hata oluştu.";
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePersonelChange = (personelId: string, checked: boolean) => {
    if (checked) {
      setSeciliPersoneller(prev => [...prev, personelId]);
    } else {
      setSeciliPersoneller(prev => prev.filter(id => id !== personelId));
    }
  };
  
  const handleDosyaEkle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setDosyalar(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  
  const handleDosyaSil = (index: number) => {
    setDosyalar(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6"> {/* Boşluğu artıralım */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Düzeni 2 sütunlu yapalım */}
          <div className="space-y-2">
            <Label htmlFor="isinAdi">İşin Adı</Label>
            <Input
              id="isinAdi"
              value={isinAdi}
              onChange={(e) => setIsinAdi(e.target.value)}
              placeholder="İşin adını girin"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teknisyenNo">Teknisyen Rapor No</Label>
            <Input
              id="teknisyenNo"
              value={teknisyenNo}
              onChange={(e) => setTeknisyenNo(e.target.value)}
              placeholder="TKN-001"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="durum">Durum</Label>
            <Select value={durum} onValueChange={(value: TeknisyenRaporuDurum) => setDurum(value)}>
              <SelectTrigger id="durum">
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beklemede">Beklemede</SelectItem>
                <SelectItem value="Fiyatlar Girildi">Fiyatlar Girildi</SelectItem>
                <SelectItem value="Fatura Kesildi">Fatura Kesildi</SelectItem>
                <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Başlangıç Tarihi ve Saati */}
          <div className="space-y-2">
             <Label htmlFor="baslangicTarihi">Başlangıç Tarihi ve Saati</Label>
             <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-normal", // flex-1 ekledik
                        !baslangicTarihiDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {baslangicTarihiDate ? (
                        format(baslangicTarihiDate, "PPP", { locale: tr })
                      ) : (
                        <span>Tarih Seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={baslangicTarihiDate}
                      onSelect={setBaslangicTarihiDate}
                      initialFocus
                      locale={tr}
                      disabled={(date) => date < new Date("1900-01-01")} // Geçmiş tarih kısıtlaması örneği
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={baslangicSaati}
                  onChange={(e) => setBaslangicSaati(e.target.value)}
                  className="w-[100px]" // Sabit genişlik
                />
             </div>
          </div>
          
          {/* Bitiş Tarihi ve Saati */}
          <div className="space-y-2">
             <Label htmlFor="bitisTarihi">Bitiş Tarihi ve Saati (Opsiyonel)</Label>
             <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-normal", // flex-1 ekledik
                        !bitisTarihiDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bitisTarihiDate ? (
                        format(bitisTarihiDate, "PPP", { locale: tr })
                      ) : (
                        <span>Tarih Seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={bitisTarihiDate}
                      onSelect={setBitisTarihiDate}
                      initialFocus
                      locale={tr}
                      disabled={(date) =>
                           date < (baslangicTarihiDate || new Date("1900-01-01")) // Bitiş tarihi başlangıçtan önce olamaz
                      }
                    />
                  </PopoverContent>
                </Popover>
                 <Input
                  type="time"
                  value={bitisSaati}
                  onChange={(e) => setBitisSaati(e.target.value)}
                  className="w-[100px]" // Sabit genişlik
                />
             </div>
          </div>
        </div> {/* grid sonu */}
        
        {/* Personeller (Tam genişlik) */}
        <div className="space-y-2">
          <Label>Görevli Personeller</Label>
          <Card>
            <CardContent className="pt-6"> {/* Padding ekleyelim */}
              {personeller.length === 0 ? (
                 <p className="text-sm text-muted-foreground">Yükleniyor veya personel bulunamadı...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto"> {/* Scroll eklendi */}
                  {personeller.map((personel) => (
                    <div key={personel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`personel-${personel.id}`}
                        checked={seciliPersoneller.includes(personel.id)}
                        onCheckedChange={(checked) => handlePersonelChange(personel.id, checked as boolean)}
                      />
                      <Label htmlFor={`personel-${personel.id}`} className="cursor-pointer">
                        {personel.name} {personel.surname} {/* Tip güncellemesine uygun */}
                      </Label>
                    </div>
                  ))}
                </div>
               )}
            </CardContent>
          </Card>
        </div>
        
        {/* Dökümanlar (Tam genişlik) */}
        <div className="space-y-2">
          <Label htmlFor="dosyalar">Dökümanlar (Opsiyonel)</Label>
          <Input
            id="dosyalar"
            type="file"
            onChange={handleDosyaEkle}
            multiple
            className="cursor-pointer"
          />
          
          {dosyalar.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {dosyalar.map((dosya, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pl-2 pr-1 py-1 text-sm"> {/* Styling */}
                  {dosya.name} ({ (dosya.size / 1024).toFixed(1) } KB) {/* Boyut */}
                  <button
                    type="button"
                    onClick={() => handleDosyaSil(index)}
                    className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-500 hover:bg-destructive hover:text-destructive-foreground transition-colors" // Styling
                    aria-label="Dosyayı kaldır"
                  >
                    &times; {/* Daha belirgin çarpı */}
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Butonlar */}
        <div className="flex justify-end space-x-4 pt-4"> {/* Üstten boşluk */}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {raporId ? "Raporu Güncelle" : "Rapor Oluştur"}
          </Button>
        </div>
      </div>
    </form>
  );
} 