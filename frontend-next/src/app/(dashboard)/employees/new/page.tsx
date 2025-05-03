"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Upload, X, XCircle, FileText, User, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  createEmployee, 
  uploadProfilePicture, 
  uploadEmployeeDocuments, 
  BackendEmployeeWithUser
} from "@/services/employeeService";
import { getAllDepartments } from "@/services/departmentService"; 
import { toast } from "sonner";
import { Department } from "@/types/department";
import { 
  EmployeeDocument, 
  EmployeeWithRelations, 
  NewEmployeePayload 
} from "@/types/employee"; 
import axios, { AxiosError } from "axios";

type CreatedEmployeeResponse = BackendEmployeeWithUser;

type NewEmployeeFormState = Partial<Omit<NewEmployeePayload, 'roleId'> > & { 
  password?: string;
  birthDate?: string; 
  hireDate?: string;  
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  departmentId?: string;
};

export default function NewEmployeePage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  
  const [newEmployeeForm, setNewEmployeeForm] = useState<NewEmployeeFormState>({ 
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    position: '',
    tcKimlikNo: '',
    departmentId: '',
    birthDate: '',
    hireDate: '',
    bloodType: '',
    drivingLicense: '',
    address: '',
    iban: '',
    salary: undefined,
    militaryStatus: '',
    education: '',
    annualLeaveAllowance: undefined,
    profilePictureUrl: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<(EmployeeDocument & { file?: File })[]>([]);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingDepartments(true);
      try {
        const fetchedDepartments = await getAllDepartments();
        
        if (Array.isArray(fetchedDepartments) && fetchedDepartments.length > 0) {
          setDepartments(fetchedDepartments);
        } else {
          setDepartments([]);
          toast.error("Departmanlar yüklenemedi.");
        }

      } catch (fetchError) {
        console.error("Departman verileri yüklenirken hata oluştu:", fetchError);
        setDepartments([]);
        toast.error("Departmanlar yüklenirken bir hata oluştu.");
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    fetchData();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'salary' || name === 'annualLeaveAllowance') {
       const numericValue = value === '' ? undefined : parseFloat(value);
       setNewEmployeeForm((prev: NewEmployeeFormState) => ({ ...prev, [name]: numericValue }));
    } else {
       setNewEmployeeForm((prev: NewEmployeeFormState) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: keyof NewEmployeeFormState, value: string | undefined) => {
    setNewEmployeeForm((prev: NewEmployeeFormState) => ({ ...prev, [name]: value ?? '' }));
  };
  
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
      if (file.size > 2 * 1024 * 1024) { toast.error("Profil fotoğrafı 2MB'dan küçük olmalı."); return; }
      if (!file.type.startsWith('image/')) { toast.error("Sadece resim dosyası yükleyebilirsiniz."); return; }

      setProfileImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
          setProfileImagePreview(reader.result as string);
          toast.info("Profil fotoğrafı önizlemesi hazırlandı.");
      };
      reader.onerror = () => {
          toast.error("Dosya okunamadı.");
          setProfileImageFile(null);
          setProfileImagePreview(null);
      };
      reader.readAsDataURL(file);
      
      if (profileImageInputRef.current) profileImageInputRef.current.value = '';
  };

  const removeProfileImage = () => {
    setProfileImagePreview(null);
      setProfileImageFile(null);
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = '';
    }
  };
  
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
      const validFiles: File[] = [];
      const oversizedFiles: string[] = [];

      Array.from(files).forEach(file => {
          if (file.size > 5 * 1024 * 1024) {
              oversizedFiles.push(file.name);
          } else {
              validFiles.push(file);
          }
      });

      if (oversizedFiles.length > 0) {
          toast.error(`${oversizedFiles.join(", ")} dosyaları 5MB sınırını aşıyor.`);
      }
      if (validFiles.length === 0) return;

      const newDocsData: (EmployeeDocument & { file?: File })[] = validFiles.map((file, index) => ({
          id: `temp-doc-${Date.now()}-${index}`,
          name: file.name,
          url: URL.createObjectURL(file),
          file: file,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString()
      })); 
      setUploadedDocuments(prev => [...prev, ...newDocsData]);
      toast.info(`${newDocsData.length} döküman yüklenecekler listesine eklendi.`);
      if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const removeDocument = (id: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== id));
  };
  
  const handleAddEmployee = async () => {
    if (!newEmployeeForm.firstName || !newEmployeeForm.lastName || !newEmployeeForm.email || 
        !newEmployeeForm.password || !newEmployeeForm.departmentId || 
        !newEmployeeForm.position || !newEmployeeForm.tcKimlikNo) 
    {
      toast.error("İsim, Soyisim, E-posta, Şifre, Departman, Pozisyon ve TCKN alanları zorunludur.");
      return;
    }
    
    setLoading(true);
    let employeeId: string | null = null;
    let userId: string | null = null;
    const uploadErrors: string[] = [];

    try {
      const apiPayload: Omit<NewEmployeePayload, 'roleId'> = {
        firstName: newEmployeeForm.firstName!,
        lastName: newEmployeeForm.lastName!,
        email: newEmployeeForm.email!,
        password: newEmployeeForm.password,
        departmentId: newEmployeeForm.departmentId!,
        position: newEmployeeForm.position!,
        tcKimlikNo: newEmployeeForm.tcKimlikNo!,
        phoneNumber: newEmployeeForm.phoneNumber || undefined,
        hireDate: newEmployeeForm.hireDate || null,
        birthDate: newEmployeeForm.birthDate || null,
        address: newEmployeeForm.address || undefined,
        iban: newEmployeeForm.iban || undefined,
        bloodType: newEmployeeForm.bloodType || null,
        drivingLicense: newEmployeeForm.drivingLicense || null,
        education: newEmployeeForm.education || undefined,
        militaryStatus: newEmployeeForm.militaryStatus || null,
        salary: newEmployeeForm.salary,
        annualLeaveAllowance: newEmployeeForm.annualLeaveAllowance,
        emergencyContactName: newEmployeeForm.emergencyContactName || undefined,
        emergencyContactPhone: newEmployeeForm.emergencyContactPhone || undefined,
        emergencyContactRelation: newEmployeeForm.emergencyContactRelation || undefined,
        profilePictureUrl: newEmployeeForm.profilePictureUrl || null
      };

      console.log("Adım 1: Personel Oluşturma İsteği Gönderiliyor (roleId olmadan):", JSON.stringify(apiPayload, null, 2));
      
      let createdEmployeeResponse: CreatedEmployeeResponse | null = null;
      try {
         createdEmployeeResponse = await createEmployee(apiPayload); 
      } catch (error) {
          console.error("createEmployee API hatası:", error);
          if (axios.isAxiosError(error)) {
              const axiosError = error as AxiosError<any>;
              const backendMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.message;
              toast.error(`Personel oluşturulamadı: ${backendMessage}`);
          } else {
              toast.error(`Personel oluşturulamadı: ${error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'}`);
          }
          setLoading(false);
          return;
      }

      if (!createdEmployeeResponse || !createdEmployeeResponse.id || !createdEmployeeResponse.user?.id) {
          console.error("API'den geçerli bir personel veya kullanıcı ID'si alınamadı.", createdEmployeeResponse);
          toast.error("Personel oluşturuldu ancak sunucudan geçerli yanıt alınamadı.");
          setLoading(false);
          return;
      }
      
      employeeId = createdEmployeeResponse.id;
      userId = createdEmployeeResponse.user.id;
      console.log(`Adım 1 Başarılı: Personel oluşturuldu (Employee ID: ${employeeId}, User ID: ${userId})`);
      toast.success(`Personel ${createdEmployeeResponse.user?.firstName || ''} ${createdEmployeeResponse.user?.lastName || ''} temel bilgileriyle oluşturuldu.`);

      if (profileImageFile && userId) {
          console.log(`Adım 2: Profil fotoğrafı yükleniyor (User ID: ${userId})...`);
          const profileToastId = toast.loading("Profil fotoğrafı yükleniyor...");
          try {
              await uploadProfilePicture(userId, profileImageFile);
              console.log("Adım 2 Başarılı: Profil fotoğrafı yüklendi.");
              toast.success("Profil fotoğrafı başarıyla yüklendi.");
              toast.dismiss(profileToastId);
          } catch (profileError) {
              const errorMessage = `Profil fotoğrafı yüklenemedi: ${profileError instanceof Error ? profileError.message : 'Bilinmeyen hata'}`;
              console.error("Adım 2 Hatası:", errorMessage);
              toast.error(errorMessage);
              uploadErrors.push("Profil fotoğrafı yüklenemedi.");
              toast.dismiss(profileToastId);
          }
      }
      
      const documentsToUpload = uploadedDocuments.filter(doc => doc.file);
      if (documentsToUpload.length > 0 && employeeId) {
          console.log(`Adım 3: ${documentsToUpload.length} döküman yükleniyor (Employee ID: ${employeeId})...`);
          const docToastId = toast.loading(`${documentsToUpload.length} döküman yükleniyor...`);
          try {
              const filesToUpload = documentsToUpload.map(doc => doc.file as File);
              await uploadEmployeeDocuments(employeeId, filesToUpload);
              console.log("Adım 3 Başarılı: Dökümanlar yüklendi.");
              toast.success(`${filesToUpload.length} döküman başarıyla yüklendi.`);
              toast.dismiss(docToastId);
          } catch (docError) {
              const errorMessage = `Dökümanlar yüklenemedi: ${docError instanceof Error ? docError.message : 'Bilinmeyen hata'}`;
              console.error("Adım 3 Hatası:", errorMessage);
              toast.error(errorMessage);
              uploadErrors.push("Dökümanlar yüklenemedi.");
              toast.dismiss(docToastId);
          }
      }

      if (uploadErrors.length === 0) {
          toast.info("Tüm işlemler tamamlandı. Personel listesine yönlendiriliyorsunuz...");
          router.push('/employees');
      } else {
          toast.warning(`Personel oluşturuldu ancak ${uploadErrors.length} yükleme hatası oluştu: ${uploadErrors.join(', ')}`);
      }

    } catch (error) {
       console.error("Beklenmedik Genel Hata:", error);
       toast.error("Personel eklenirken beklenmedik bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };
  
  const formatFileSize = (size: number | undefined): string => {
    if (size === undefined || size === null) return 'Bilinmiyor';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      return new Intl.DateTimeFormat('tr-TR').format(new Date(dateString));
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">Yeni Personel Ekle</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleAddEmployee(); }} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
             <User className="mr-2 h-5 w-5 text-indigo-600" /> Temel Bilgiler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2 flex flex-col items-center space-y-3">
                  <Label htmlFor="profilePicture" className="text-gray-600 font-medium">Profil Fotoğrafı</Label>
                  <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100 overflow-hidden relative group">
                      {profileImagePreview ? (
                          <>
                              <img src={profileImagePreview} alt="Profil Önizleme" className="w-full h-full object-cover" />
                              <Button 
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                                  onClick={removeProfileImage}
                                  type="button"
                              >
                                  <X className="h-4 w-4" />
                              </Button>
                          </>
                      ) : (
                          <User className="h-16 w-16 text-gray-400" />
                      )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => profileImageInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Yükle
                  </Button>
                  <Input 
                      id="profilePicture" 
                      name="profilePicture" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProfileImageUpload}
                      ref={profileImageInputRef}
                      className="hidden" 
                  />
                  <p className="text-xs text-gray-500">Max 2MB. JPG, PNG, GIF.</p>
              </div>
              
              <div>
                  <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">İsim <span className="text-red-500">*</span></Label>
                  <Input id="firstName" name="firstName" value={newEmployeeForm.firstName ?? ''} onChange={handleInputChange} required />
              </div>
               <div>
                  <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Soyisim <span className="text-red-500">*</span></Label>
                  <Input id="lastName" name="lastName" value={newEmployeeForm.lastName ?? ''} onChange={handleInputChange} required />
              </div>
               <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-posta <span className="text-red-500">*</span></Label>
                  <Input id="email" name="email" type="email" value={newEmployeeForm.email ?? ''} onChange={handleInputChange} required />
              </div>
               <div>
                   <Label htmlFor="password">Şifre <span className="text-red-500">*</span></Label>
                   <Input id="password" name="password" type="password" value={newEmployeeForm.password ?? ''} onChange={handleInputChange} required />
               </div>

              <div>
                  <Label htmlFor="departmentId">Departman <span className="text-red-500">*</span></Label>
                  <Select name="departmentId" value={newEmployeeForm.departmentId ?? ''} onValueChange={(value) => handleSelectChange("departmentId", value)} required>
                      <SelectTrigger disabled={isLoadingDepartments}>
                          <SelectValue placeholder={isLoadingDepartments ? "Yükleniyor..." : "Departman Seçin"} />
                      </SelectTrigger>
                      <SelectContent>
                          {departments.map(dep => (
                              <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>

              <div>
                  <Label htmlFor="position">Pozisyon <span className="text-red-500">*</span></Label>
                  <Input id="position" name="position" value={newEmployeeForm.position ?? ''} onChange={handleInputChange} required />
              </div>
              <div>
                  <Label htmlFor="tcKimlikNo">TC Kimlik No <span className="text-red-500">*</span></Label>
                  <Input id="tcKimlikNo" name="tcKimlikNo" value={newEmployeeForm.tcKimlikNo ?? ''} onChange={handleInputChange} maxLength={11} required />
              </div>

              <div>
                  <Label htmlFor="phoneNumber">Telefon Numarası</Label>
                  <Input id="phoneNumber" name="phoneNumber" value={newEmployeeForm.phoneNumber ?? ''} onChange={handleInputChange} />
              </div>
              <div>
                  <Label htmlFor="birthDate">Doğum Tarihi</Label>
                  <Input id="birthDate" name="birthDate" type="date" value={newEmployeeForm.birthDate ?? ''} onChange={handleInputChange} />
              </div>
              <div>
                  <Label htmlFor="hireDate">İşe Giriş Tarihi</Label>
                  <Input id="hireDate" name="hireDate" type="date" value={newEmployeeForm.hireDate ?? ''} onChange={handleInputChange} />
              </div>
              <div>
                   <Label htmlFor="bloodType">Kan Grubu</Label>
                   <Select name="bloodType" value={newEmployeeForm.bloodType ?? ''} onValueChange={(value) => handleSelectChange("bloodType", value)}>
                       <SelectTrigger>
                           <SelectValue placeholder="Kan Grubu Seçin" />
                       </SelectTrigger>
                       <SelectContent>
                           <SelectItem value="A+">A+</SelectItem>
                           <SelectItem value="A-">A-</SelectItem>
                           <SelectItem value="B+">B+</SelectItem>
                           <SelectItem value="B-">B-</SelectItem>
                           <SelectItem value="AB+">AB+</SelectItem>
                           <SelectItem value="AB-">AB-</SelectItem>
                           <SelectItem value="0+">0+</SelectItem>
                           <SelectItem value="0-">0-</SelectItem>
                       </SelectContent>
                   </Select>
               </div>
               <div>
                  <Label htmlFor="drivingLicense">Ehliyet</Label>
                  <Select name="drivingLicense" value={newEmployeeForm.drivingLicense ?? ''} onValueChange={(value) => handleSelectChange("drivingLicense", value)}>
                      <SelectTrigger>
                          <SelectValue placeholder="Ehliyet Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="YOK">Yok</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="A1">A1</SelectItem>
                          <SelectItem value="A2">A2</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B1">B1</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="BE">BE</SelectItem>
                          <SelectItem value="C1">C1</SelectItem>
                          <SelectItem value="C1E">C1E</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="CE">CE</SelectItem>
                          <SelectItem value="D1">D1</SelectItem>
                          <SelectItem value="D1E">D1E</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="DE">DE</SelectItem>
                          <SelectItem value="F">F</SelectItem>
                          <SelectItem value="G">G</SelectItem>
                      </SelectContent>
                  </Select>
               </div>
               <div>
                  <Label htmlFor="iban">IBAN</Label>
                  <Input id="iban" name="iban" value={newEmployeeForm.iban ?? ''} onChange={handleInputChange} />
              </div>
              <div>
                  <Label htmlFor="salary">Maaş</Label>
                  <Input id="salary" name="salary" type="number" step="0.01" value={newEmployeeForm.salary ?? ''} onChange={handleInputChange} />
              </div>
              <div>
                  <Label htmlFor="annualLeaveAllowance">Yıllık İzin Hakkı (Gün)</Label>
                  <Input id="annualLeaveAllowance" name="annualLeaveAllowance" type="number" value={newEmployeeForm.annualLeaveAllowance ?? ''} onChange={handleInputChange} />
              </div>
               <div>
                  <Label htmlFor="militaryStatus">Askerlik Durumu</Label>
                  <Select name="militaryStatus" value={newEmployeeForm.militaryStatus ?? ''} onValueChange={(value) => handleSelectChange("militaryStatus", value)}>
                      <SelectTrigger>
                          <SelectValue placeholder="Askerlik Durumu Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="YAPILDI">Yapıldı</SelectItem>
                          <SelectItem value="TECİLLİ">Tecilli</SelectItem>
                          <SelectItem value="MUAF">Muaf</SelectItem>
                          <SelectItem value="YAPILMADI">Yapılmadı</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
               <div>
                  <Label htmlFor="education">Eğitim Durumu</Label>
                  <Select name="education" value={newEmployeeForm.education ?? ''} onValueChange={(value) => handleSelectChange("education", value)}>
                      <SelectTrigger>
                          <SelectValue placeholder="Eğitim Durumu Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="İLKOKUL">İlkokul</SelectItem>
                          <SelectItem value="ORTAOKUL">Ortaokul</SelectItem>
                          <SelectItem value="LISE">Lise</SelectItem>
                          <SelectItem value="ON_LISANS">Ön Lisans</SelectItem>
                          <SelectItem value="LISANS">Lisans</SelectItem>
                          <SelectItem value="YUKSEK_LISANS">Yüksek Lisans</SelectItem>
                          <SelectItem value="DOKTORA">Doktora</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="md:col-span-2">
                  <Label htmlFor="address">Adres</Label>
                  <Textarea id="address" name="address" value={newEmployeeForm.address ?? ''} onChange={handleInputChange} />
              </div>
          </div>
        </div>

         <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
           <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
             <User className="mr-2 h-5 w-5 text-orange-600" /> Acil Durum İletişim Bilgileri
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
               <Label htmlFor="emergencyContactName">Ad Soyad</Label>
               <Input id="emergencyContactName" name="emergencyContactName" value={newEmployeeForm.emergencyContactName ?? ''} onChange={handleInputChange} />
             </div>
             <div>
               <Label htmlFor="emergencyContactPhone">Telefon</Label>
               <Input id="emergencyContactPhone" name="emergencyContactPhone" value={newEmployeeForm.emergencyContactPhone ?? ''} onChange={handleInputChange} />
             </div>
             <div>
               <Label htmlFor="emergencyContactRelation">Yakınlık Derecesi</Label>
               <Input id="emergencyContactRelation" name="emergencyContactRelation" value={newEmployeeForm.emergencyContactRelation ?? ''} onChange={handleInputChange} />
             </div>
           </div>
         </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
           <div className="mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => documentInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                    Döküman Yükle (Maks 5MB)
                </Button>
                <input
                  type="file"
                  ref={documentInputRef}
                  className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                  onChange={handleDocumentUpload}
                  multiple
                />
              </div>
              
              {uploadedDocuments.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {uploadedDocuments.map(doc => (
                    <div 
                      key={doc.id} 
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700"
                        >
                        <div className="flex items-center overflow-hidden space-x-2">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <div className="flex-grow truncate">
                            <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(doc.size)} {doc.uploadDate ? ` • ${formatDate(doc.uploadDate)}` : ''}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                            size="icon"
                            className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 h-7 w-7 ml-2 flex-shrink-0"
                        onClick={() => removeDocument(doc.id)}
                            title="Dökümanı kaldır"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-3 text-sm border-t border-dashed mt-3">
                  Henüz döküman yüklenmedi
                </div>
              )}
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            İptal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Personeli Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
} 