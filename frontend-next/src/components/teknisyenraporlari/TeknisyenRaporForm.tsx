"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2, X, Upload, Check } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import TimePicker from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";
import { TeknisyenRaporu, TeknisyenRaporuDurum, Personel, getDurumText } from "@/types/teknisyen";
import { getTeknisyenRaporu, createTeknisyenRaporu, updateTeknisyenRaporu, getPersoneller } from "@/services/teknisyenRaporService";
import UserSelector from "./UserSelector";
import { uploadTeknisyenDokuman } from "@/services/teknisyenRaporService";

// Yardımcı fonksiyonlar
const combineDateAndTime = (date?: Date, time?: string): Date | undefined => {
  if (!date) return undefined;
  
  if (!time) return date;
  
  const [hour, minute] = time.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hour || 0);
  newDate.setMinutes(minute || 0);
  return newDate;
};

interface TeknisyenRaporFormProps {
  raporId?: string;
}

export default function TeknisyenRaporForm({ raporId }: TeknisyenRaporFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // İş detayları
  const [isinAdi, setIsinAdi] = useState<string>("");
  const [raporBilgiNo, setRaporBilgiNo] = useState<string>("");
  const [durum, setDurum] = useState<TeknisyenRaporuDurum>("TASLAK"); // Backend modeline uygun
  
  // Tarih ve saat bilgileri
  const [baslangicTarihiDate, setBaslangicTarihiDate] = useState<Date | undefined>(undefined);
  const [baslangicSaati, setBaslangicSaati] = useState<string>("");
  const [bitisTarihiDate, setBitisTarihiDate] = useState<Date | undefined>(undefined);
  const [bitisSaati, setBitisSaati] = useState<string>("");
  
  // İlgili personel listesi
  const [personeller, setPersoneller] = useState<Personel[]>([]);
  const [seciliPersoneller, setSeciliPersoneller] = useState<string[]>([]);
  
  // Form durumu
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [personelYukleniyor, setPersonelYukleniyor] = useState<boolean>(true);
  
  // Doküman yönetimi için state'ler
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Personel listesini yükle
  useEffect(() => {
    const loadPersoneller = async () => {
      setPersonelYukleniyor(true);
      try {
        const personelListesi = await getPersoneller();
        console.log("Yüklenen personel listesi:", personelListesi);
        if (personelListesi && personelListesi.length > 0) {
          setPersoneller(personelListesi);
          
          // Otomatik teknisyen atama kısmını kaldırıyoruz
          // Kullanıcı kendi teknisyen numarasını girecek
        } else {
          toast({
            title: "Uyarı",
            description: "Personel listesi boş görünüyor. Lütfen sistem yöneticinize başvurun.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Personel listesi yüklenirken hata:", error);
        toast({
          title: "Hata",
          description: "Personel listesi yüklenemedi.",
          variant: "destructive",
        });
      } finally {
        setPersonelYukleniyor(false);
      }
    };
    
    loadPersoneller();
  }, [toast, raporId]);
  
  // Rapor detaylarını yükle (eğer düzenleme sayfasıysa)
  useEffect(() => {
    if (!raporId) return;
    
    const loadRaporDetaylari = async () => {
      setIsLoading(true);
      
      try {
        const rapor = await getTeknisyenRaporu(raporId);
        
        // Form alanlarını doldur
        setIsinAdi(rapor.baslik);
        setRaporBilgiNo(rapor.teknisyenId);
        setDurum(rapor.durum as TeknisyenRaporuDurum); // veritabanı durumu

        if (rapor.tarih) {
          const tarih = new Date(rapor.tarih);
          setBaslangicTarihiDate(tarih);
          setBaslangicSaati(`${tarih.getHours().toString().padStart(2, '0')}:${tarih.getMinutes().toString().padStart(2, '0')}`);
        }
        
        // Diğer alanları doldurmaya devam et...
      } catch (error) {
        console.error("Rapor detayları yüklenirken hata:", error);
        toast({
          title: "Hata",
          description: "Rapor detayları yüklenemedi.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRaporDetaylari();
  }, [raporId, toast]);
  
  // Doküman yükleme için drag-drop işleyicileri
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files);
    }
  }, []);
  
  const handleFileSelection = (files: File[]) => {
    // Dosya boyutu kontrolü (max 10MB)
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Uyarı",
        description: "10MB'dan büyük dosyalar filtrelendi.",
        variant: "destructive",
      });
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      handleFileSelection(files);
    }
  };
  
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isinAdi) {
      toast({
        title: "Hata",
        description: "Lütfen işin adını belirtin.",
        variant: "destructive",
      });
      return;
    }
    
    if (!raporBilgiNo) {
      toast({
        title: "Hata",
        description: "Lütfen bir rapor bilgi numarası girin.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Kontrollü şekilde Date nesnelerini oluştur
      let combinedBaslangicTarihi: Date | undefined;
      let combinedBitisTarihi: Date | undefined;
      
      try {
        if (baslangicTarihiDate) {
          combinedBaslangicTarihi = combineDateAndTime(baslangicTarihiDate, baslangicSaati);
          console.log("Başlangıç Tarih/Saat:", combinedBaslangicTarihi?.toISOString() || 'undefined');
        }
        
        if (bitisTarihiDate) {
          combinedBitisTarihi = combineDateAndTime(bitisTarihiDate, bitisSaati);
          console.log("Bitiş Tarih/Saat:", combinedBitisTarihi?.toISOString() || 'undefined');
        }
      } catch (dateError) {
        console.error("Tarih dönüşümü hatası:", dateError);
        toast({
          title: "Hata",
          description: "Tarih formatı hatalı.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // API'ye gönderilecek veri
      console.log("Form verileri:", {
        isinAdi,
        raporBilgiNo,
        durum,
        baslangicTarihi: combinedBaslangicTarihi?.toISOString(),
        bitisTarihi: combinedBitisTarihi?.toISOString(),
        personeller: seciliPersoneller
      });
      
      const raporData: Partial<TeknisyenRaporu> = {
        baslik: isinAdi,
        teknisyenId: raporBilgiNo,
        durum: durum,
        tarih: combinedBaslangicTarihi ? combinedBaslangicTarihi.toISOString() : undefined,
        // Bitiş tarihi ve personel bilgilerini de payload'a ekleyelim
        // Service tarafında bunlar birleştirilecek
        bitisTarihi: combinedBitisTarihi ? combinedBitisTarihi.toISOString() : undefined,
        personeller: seciliPersoneller
      };
      
      console.log("API'ye gönderilecek veri:", raporData);
      console.log("teknisyenId değeri:", raporData.teknisyenId);
      console.log("teknisyenId tipi:", typeof raporData.teknisyenId);
      console.log("durum değeri:", raporData.durum);
      console.log("durum tipi:", typeof raporData.durum);
      
      let result: TeknisyenRaporu | undefined;
      try {
        if (raporId) {
          // Güncelleme
          result = await updateTeknisyenRaporu(raporId, raporData);
        } else {
          // Yeni oluşturma
          result = await createTeknisyenRaporu(raporData);
        }
      
        // Dosya yükleme işlemi
        if (result && result.id && selectedFiles.length > 0) {
          toast({
            title: "Bilgi",
            description: `${selectedFiles.length} dosya sisteme yükleniyor...`,
          });
          
          // Dosyaları yükleyelim
          const kullaniciId = sessionStorage.getItem('userId') || localStorage.getItem('userId') || "31ba596a-c0e0-4e86-a3f4-f2b1b027d3d3"; // Mevcut kullanıcı ID'si veya varsayılan
          
          try {
            const uploadPromises = selectedFiles.map(async (file) => {
              const dosyaAciklama = ""; // Dosya açıklaması varsa buraya eklenebilir
              await uploadTeknisyenDokuman(
                result.id, // Yeni oluşturulan veya güncellenen rapor ID'si
                file,
                dosyaAciklama,
                kullaniciId // Yükleyen kişi ID'si
              );
            });
            
            // Tüm dosya yükleme işlemlerinin tamamlanmasını bekleyelim
            await Promise.all(uploadPromises);
            
            toast({
              title: "Başarılı",
              description: `${selectedFiles.length} dosya başarıyla yüklendi.`,
            });
          } catch (uploadError) {
            console.error("Dosya yükleme hatası:", uploadError);
            toast({
              title: "Uyarı",
              description: "Dosyalar yüklenirken bazı hatalar oluştu. Lütfen daha sonra tekrar deneyin.",
              variant: "destructive",
            });
          }
        }
      
        if (result) {
          toast({
            title: "Başarılı",
            description: `Rapor başarıyla ${raporId ? 'güncellendi' : 'oluşturuldu'}.`,
          });
          router.push(`/teknisyenraporlari`); // Listeye yönlendirelim
          router.refresh(); // Sayfayı yenileyerek güncel listeyi gösterelim
        }
      } catch (error: any) {
        console.error("Form gönderimi sırasında hata:", error);
        // Backend'den gelen hata mesajını göstermeye çalışalım
        const errorDetail = error.response?.data?.message;
        const errorStatus = error.response?.status;
        const errorMessage = errorDetail || error.message || "Rapor kaydedilirken bir hata oluştu.";
        
        toast({
          title: `Hata (${errorStatus || 'Bilinmiyor'})`,
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="w-full max-w-4xl mx-auto border-0 shadow-lg bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 w-full"></div>
        <div className="p-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900"></div>
        <CardContent className="pt-8 pb-8 px-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{raporId ? 'Rapor Düzenle' : 'Yeni Teknisyen Raporu'}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* İş Adı */}
              <div className="space-y-2">
                <Label htmlFor="isinAdi" className="text-sm font-medium">İşin Adı*</Label>
                <Input
                  id="isinAdi"
                  value={isinAdi}
                  onChange={(e) => setIsinAdi(e.target.value)}
                  placeholder="İşin adını girin"
                  disabled={isLoading || isSubmitting}
                  required
                  className="h-10 transition-all bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Rapor Bilgi Numarası - dropdown yerine input kullanılacak */}
              <div className="grid gap-2">
                <Label htmlFor="raporBilgiNo" className="text-sm font-medium">Rapor Bilgi Numarası*</Label>
                <Input
                  id="raporBilgiNo"
                  value={raporBilgiNo}
                  onChange={(e) => setRaporBilgiNo(e.target.value)}
                  placeholder="Rapor bilgi numarasını girin"
                  disabled={isLoading || isSubmitting}
                  required
                  className="h-10 transition-all bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Başlangıç Tarihi */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Başlangıç Tarihi</Label>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-[75%] justify-start text-left font-normal transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${!baslangicTarihiDate && "text-muted-foreground"}`}
                        disabled={isLoading || isSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {baslangicTarihiDate ? (
                          format(baslangicTarihiDate, "PPP", { locale: tr })
                        ) : (
                          <span>Tarih seçin</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-0 shadow-xl">
                      <Calendar
                        mode="single"
                        selected={baslangicTarihiDate}
                        onSelect={setBaslangicTarihiDate}
                        initialFocus
                        locale={tr}
                        className="rounded-md border border-gray-200 dark:border-gray-800"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <TimePicker
                    value={baslangicSaati}
                    onChange={setBaslangicSaati}
                    disabled={isLoading || isSubmitting}
                    className="transition-all focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                    width="110px"
                    zIndex={15}
                  />
                </div>
              </div>
              
              {/* Durum */}
              <div className="space-y-2 pl-6">
                <Label htmlFor="durum" className="text-sm font-medium">Durum</Label>
                <Select 
                  value={durum} 
                  onValueChange={(value: any) => setDurum(value)}
                  disabled={isLoading || isSubmitting}
                >
                  <SelectTrigger id="durum" className="h-10 transition-all bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-md">
                    <SelectItem value="TASLAK">{getDurumText("TASLAK")}</SelectItem>
                    <SelectItem value="INCELENIYOR">{getDurumText("INCELENIYOR")}</SelectItem>
                    <SelectItem value="ONAYLANDI">{getDurumText("ONAYLANDI")}</SelectItem>
                    <SelectItem value="REDDEDILDI">{getDurumText("REDDEDILDI")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Bitiş Tarihi */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bitiş Tarihi</Label>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-[75%] justify-start text-left font-normal transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${!bitisTarihiDate && "text-muted-foreground"}`}
                        disabled={isLoading || isSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bitisTarihiDate ? (
                          format(bitisTarihiDate, "PPP", { locale: tr })
                        ) : (
                          <span>Tarih seçin</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-0 shadow-xl">
                      <Calendar
                        mode="single"
                        selected={bitisTarihiDate}
                        onSelect={setBitisTarihiDate}
                        initialFocus
                        locale={tr}
                        className="rounded-md border border-gray-200 dark:border-gray-800"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <TimePicker
                    value={bitisSaati}
                    onChange={setBitisSaati}
                    disabled={isLoading || isSubmitting}
                    className="transition-all focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                    width="110px"
                    zIndex={10}
                  />
                </div>
              </div>
              
              {/* İlgili Personel */}
              <div className="space-y-2 pl-6">
                <Label className="text-sm font-medium">İlgili Personel</Label>
                <UserSelector
                  users={personeller}
                  selectedIds={seciliPersoneller}
                  onSelectionChange={setSeciliPersoneller}
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>
            
            {/* Dosya Yükleme Bölümü */}
            <div className="space-y-3 mt-2">
              <Label className="text-sm font-medium">Dökümanlar</Label>
              <div 
                className={`bg-gray-50 dark:bg-gray-900 rounded-lg border-2 ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-dashed border-gray-300 dark:border-gray-700'} p-6 text-center transition-colors duration-200`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <Upload className={`h-10 w-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className={`${isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    <p className="text-sm">Dökümanları buraya sürükleyin veya</p>
                    <label htmlFor="file-upload" className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      dosya seçin
                      <input 
                        id="file-upload"
                        type="file"
                        multiple
                        className="sr-only"
                        disabled={isLoading || isSubmitting}
                        onChange={handleFileInputChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF, DOC, XLS, PNG, JPG (max 10MB)
                  </p>
                </div>
              </div>
              
              {/* Seçilen dosyaların listesi */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium">Seçilen Dökümanlar ({selectedFiles.length})</p>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {selectedFiles.map((file, index) => {
                      // Dosya tipine göre farklı renk
                      let bgColor = "bg-gray-100 dark:bg-gray-900";
                      if (file.type.includes('pdf')) bgColor = "bg-red-50 dark:bg-red-900/20";
                      else if (file.type.includes('word') || file.type.includes('doc')) bgColor = "bg-blue-50 dark:bg-blue-900/20";
                      else if (file.type.includes('excel') || file.type.includes('sheet') || file.type.includes('xls')) bgColor = "bg-green-50 dark:bg-green-900/20";
                      else if (file.type.includes('image')) bgColor = "bg-purple-50 dark:bg-purple-900/20";
                      
                      return (
                        <li 
                          key={`${file.name}-${index}`} 
                          className={`flex items-center justify-between px-4 py-3 ${bgColor} text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="flex-shrink-0">
                              <Check className="h-5 w-5 text-green-500" />
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-xs">{file.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                            onClick={() => removeSelectedFile(index)}
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              {/* Yüklenen dosyaların listesi */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium">Yüklenen Dökümanlar ({uploadedFiles.length})</p>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {/* Burada yüklenen dosyaların listesi gösterilecek */}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Form düğmeleri */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor
                  </>
                ) : (
                  <>{raporId ? "Güncelle" : "Oluştur"}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 