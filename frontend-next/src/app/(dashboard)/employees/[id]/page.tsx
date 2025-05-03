"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  User, Phone, Mail, Calendar, Briefcase, Building, 
  MapPin, CreditCard, Droplet, Shield, FileText, 
  ArrowLeft, Download, Printer, Edit, Bookmark, Info,
  UserRound, LifeBuoy, GraduationCap, CarFront
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getEmployeeById } from "@/services/employeeService";
import { API_URL } from "@/services/api";
import { Employee, EmployeeDocument } from "@/types/employee";
import { toast } from "sonner";

export default function EmployeeDetailPage() {
  const [employee, setEmployee] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await getEmployeeById(employeeId);
        setEmployee(data);
        setError(null);
      } catch (error) {
        console.error('Personel verileri alınırken hata oluştu:', error);
        setError("Personel bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
        toast.error("Personel bilgileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Belirtilmemiş";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch (error) {
      console.error("Tarih formatı hatası:", error);
      return dateString;
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return "Belirtilmemiş";
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatFileSize = (size?: number | null) => {
    if (!size) return "";
    if (size < 1024) {
      return size + ' B';
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB';
    } else {
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
  };

  const translateMilitaryStatus = (status?: string | null) => {
    if (!status) return "Belirtilmemiş";
    const translations: Record<string, string> = {
      "YAPILDI": "Yapıldı",
      "MUAF": "Muaf",
      "TECILLI": "Tecilli",
      "YAPILMADI": "Yapılmadı"
    };
    return translations[status] || status;
  };

  const translateEducation = (education?: string | null) => {
    if (!education) return "Belirtilmemiş";
    const translations: Record<string, string> = {
      "İLKOKUL": "İlkokul",
      "ORTAOKUL": "Ortaokul",
      "LISE": "Lise",
      "ONLISANS": "Ön Lisans",
      "LISANS": "Lisans",
      "YUKSEK_LISANS": "Yüksek Lisans",
      "DOKTORA": "Doktora"
    };
    return translations[education] || education;
  };

  // Resim URL'ini oluşturmak için yardımcı fonksiyon
  const getFullImageUrl = (relativeUrl: string | null | undefined): string => {
    if (!relativeUrl) return ''; // Resim yoksa boş string dön
    const backendBaseUrl = API_URL.replace('/api', '');
    return `${backendBaseUrl}${relativeUrl}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-lg text-red-800 dark:text-red-300 mb-6">
          <p>{error}</p>
        </div>
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Geri Dön
        </Button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4 rounded-lg text-amber-800 dark:text-amber-300 mb-6">
          <p>Personel bulunamadı.</p>
        </div>
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Geri Dön
        </Button>
      </div>
    );
  }

  // API yapısına göre veriyi düzenle
  const userData = employee;
  const employeeData = employee.employee || {};
  const departmentData = employeeData.department || {};
  const documents = employeeData.documents || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Geri
          </Button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Personel Detayları
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => window.print()} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" />
            Yazdır
          </Button>
          <Button onClick={() => router.push(`/employees/edit/${userData.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Edit className="h-4 w-4 mr-1" />
            Düzenle
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
        {/* Üst Profil Alanı */}
        <div className="flex flex-col md:flex-row items-start p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="md:mr-6 mb-4 md:mb-0 flex-shrink-0">
            <div className="w-full md:w-auto flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {employeeData.profilePictureUrl ? (
                  <img 
                    src={getFullImageUrl(employeeData.profilePictureUrl)}
                    alt={`${userData.name} fotoğrafı`}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-4xl font-semibold text-blue-500 dark:text-blue-300">
                      {(userData.name || '').charAt(0).toUpperCase()}{(userData.surname || '').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {userData.role && (
                <Badge variant="outline" className="px-2 py-1">
                  <UserRound className="w-3 h-3 mr-1" />
                  {userData.role.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-grow">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {userData.name} {userData.surname}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{employeeData.position || "Pozisyon belirtilmemiş"}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Building className="h-4 w-4 mr-2" />
                <span>{departmentData.name || "Departman belirtilmemiş"}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 mr-2" />
                <span>{userData.email || "Email belirtilmemiş"}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4 mr-2" />
                <span>{employeeData.phoneNumber || "Telefon belirtilmemiş"}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-2" />
                <span>İşe Başlama: {formatDate(employeeData.hireDate)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detaylı Bilgi Sekmeler */}
        <Tabs defaultValue="info" className="p-6">
          <TabsList className="mb-4">
            <TabsTrigger value="info">
              <Info className="h-4 w-4 mr-2" />
              Temel Bilgiler
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Dökümanlar
              <Badge variant="secondary" className="ml-2 text-xs">{documents.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-none bg-gray-50 dark:bg-gray-700/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Kişisel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-500 w-28">Doğum Tarihi:</span>
                    <span>{formatDate(employeeData.birthDate)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Droplet className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-500 w-28">Kan Grubu:</span>
                    <span>{employeeData.bloodType || "Belirtilmemiş"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Shield className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-500 w-28">Askerlik:</span>
                    <span>{translateMilitaryStatus(employeeData.militaryStatus)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-500 w-28">Öğrenim:</span>
                    <span>{translateEducation(employeeData.education)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-500 w-28">T.C. Kimlik No:</span>
                    <span>{employeeData.tcKimlikNo || "Belirtilmemiş"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CarFront className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-500 w-28">Ehliyet:</span>
                    <span>{employeeData.drivingLicense || "Belirtilmemiş"}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-none bg-gray-50 dark:bg-gray-700/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Finansal Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center text-sm">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-500 w-28">IBAN:</span>
                    <span className="break-all">{employeeData.iban || "Belirtilmemiş"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-500 w-28">Maaş:</span>
                    <span>{formatCurrency(employeeData.salary)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-500 w-28">Yıllık İzin:</span>
                    <span>{employeeData.annualLeaveAllowance || "Belirtilmemiş"} gün</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-none bg-gray-50 dark:bg-gray-700/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">İletişim Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-start text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <span className="text-gray-500 w-28">Adres:</span>
                    <span>{employeeData.address || "Belirtilmemiş"}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600 mt-3">
                    <h4 className="text-sm font-medium mb-2">Acil Durum Kontağı</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-500 w-28">İsim:</span>
                        <span>{employeeData.emergencyContactName || "Belirtilmemiş"}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-500 w-28">Telefon:</span>
                        <span>{employeeData.emergencyContactPhone || "Belirtilmemiş"}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <LifeBuoy className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-500 w-28">Yakınlık:</span>
                        <span>{employeeData.emergencyContactRelation || "Belirtilmemiş"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Sistemsel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-500 w-32">Kullanıcı ID:</span>
                  <span className="font-mono">{userData.id}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 w-32">Oluşturulma:</span>
                  <span>{formatDate(userData.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 w-32">Son Güncelleme:</span>
                  <span>{formatDate(userData.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            <Card>
              <CardContent className="pt-6">
                {documents && documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {documents.map((doc: EmployeeDocument) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center overflow-hidden">
                          <FileText className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {doc.type} 
                              {doc.size ? ` • ${formatFileSize(doc.size)}` : ''} 
                              {doc.uploadDate ? ` • ${formatDate(doc.uploadDate)}` : ''}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="ml-2 flex-shrink-0"
                          onClick={() => {
                            if (doc.url) {
                              window.open(doc.url, '_blank');
                            }
                          }}
                          disabled={!doc.url}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          İndir
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                    <p className="text-lg font-medium mb-1">Döküman Bulunamadı</p>
                    <p className="text-sm">Bu personel için yüklenmiş döküman bulunmamaktadır.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 