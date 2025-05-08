"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, X, Upload, User, FileText, XCircle, Loader2, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  getEmployeeById, 
  updateEmployee, 
  uploadProfilePicture, 
  uploadEmployeeDocuments 
} from "@/services/employeeService";
import { API_URL } from "@/services/api";
import type { BackendUserData } from "@/services/employeeService";
import { getAllDepartments } from "@/services/departmentService";
import { toast } from "sonner";
import { Employee, EmployeeDocument, EmergencyContact, UpdateEmployeePayload } from "@/types/employee";
import { Department } from "@/types/department";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;
  const { refreshUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<Partial<Employee> | null>(null);
  
  const [uploadedDocuments, setUploadedDocuments] = useState<(EmployeeDocument & { file?: File })[]>([]);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  
  const documentInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (employeeId) {
        fetchEmployeeData();
        fetchDepartments();
    } else {
        toast.error("Personel ID bulunamadı.");
        router.push('/employees');
    }
  }, [employeeId]);

  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const data = await getAllDepartments();
      if (Array.isArray(data) && data.length > 0) {
        setDepartments(data);
      } else {
        setDepartments([]);
        toast.info("Departman bulunamadı veya yüklenemedi."); 
      }
    } catch (error) {
      console.error("Departman verileri yüklenirken hata:", error);
      toast.error("Departman bilgileri yüklenemedi");
    } finally {
      setIsLoadingDepartments(false);
    }
  };
  
  const fetchEmployeeData = async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      const apiData = await getEmployeeById(employeeId);
      console.log("API'den gelen veri:", apiData);
      
      if (!apiData) {
        toast.error("Personel bilgileri bulunamadı veya eksik.");
        router.push('/employees');
        return;
      }

      const relativeImageUrl = apiData.profilePictureUrl || null;
      if (relativeImageUrl) {
        const getFullImageUrl = (path: string) => {
          const backendBaseUrl = API_URL.replace('/api', '');
          return `${backendBaseUrl}${path}`;
        };
        
        setProfileImagePreview(getFullImageUrl(relativeImageUrl));
      }

      const formattedEmployee: Partial<Employee> = {
        id: apiData.id,
        name: apiData.name || '',
        surname: apiData.surname || '',
        email: apiData.email || '',
        phoneNumber: apiData.phoneNumber || '',
        position: apiData.position || '',
        departmentId: apiData.departmentId || '',
        tcKimlikNo: apiData.tcKimlikNo || '',
        address: apiData.address || '',
        iban: apiData.iban || '',
        hireDate: apiData.hireDate ? new Date(apiData.hireDate) : undefined,
        birthDate: apiData.birthDate ? new Date(apiData.birthDate) : undefined,
        bloodType: apiData.bloodType || '',
        drivingLicense: apiData.drivingLicense || '',
        education: apiData.education || '',
        militaryStatus: apiData.militaryStatus || '',
        annualLeaveAllowance: apiData.annualLeaveAllowance || 0,
        salary: apiData.salary || null,
        emergencyContacts: {
          id: 'temp-id',
          name: apiData.emergencyContactName || '',
          phone: apiData.emergencyContactPhone || '',
          relation: apiData.emergencyContactRelation || ''
        },
        isActive: apiData.isActive === undefined ? true : apiData.isActive,
      };
      
      console.log("Form için formatlanmış veri:", formattedEmployee);
      setEmployee(formattedEmployee);
      setUploadedDocuments(formattedEmployee.documents?.map(doc => ({...doc})) || []);
      
      fetchDepartments();
    } catch (error) {
      console.error("Personel verisi alınırken hata:", error);
      toast.error("Personel bilgileri yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employeeId) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dosya boyutu 2MB'dan küçük olmalıdır");
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error("Sadece resim dosyaları yükleyebilirsiniz");
      return;
    }
    
    const loadingToast = toast.loading("Fotoğraf yükleniyor...");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
         setProfileImagePreview(reader.result as string);
      };
      reader.onerror = () => {
         toast.error("Dosya önizlemesi oluşturulamadı.");
      };
      
      console.log(`[EditEmployee] Uploading profile picture for employee: ${employeeId}`);
      const response = await uploadProfilePicture(employeeId, file);
      
      if (!response) {
        toast.dismiss(loadingToast);
        if (profileImageInputRef.current) {
            profileImageInputRef.current.value = '';
        }
        return;
      }
      
      const profilePictureUrl = response.profilePictureUrl;
      
      console.log("[EditEmployee] Profile picture upload successful. Response:", response);
      console.log("[EditEmployee] Profile picture URL from backend:", profilePictureUrl);
      
      if (profilePictureUrl) {
        const backendBaseUrl = API_URL.replace('/api', ''); 
        const fullImageUrl = `${backendBaseUrl}${profilePictureUrl}`;
        
        console.log("[EditEmployee] Setting preview URL to full URL:", fullImageUrl);
        toast.dismiss(loadingToast);
        setProfileImagePreview(fullImageUrl);
        setProfileImageFile(file);

        setEmployee(prev => prev ? { ...prev, profilePictureUrl: profilePictureUrl } : null); 
        
        toast.success("Profil fotoğrafı güncellendi (Kaydetmeyi unutmayın)");
      } else {
        console.error("[EditEmployee] Backend response did not contain profilePictureUrl");
        toast.dismiss(loadingToast);
        toast.error("Profil fotoğrafı URL'i alınamadı.");
      }
      
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Profil fotoğrafı yüklenirken hata:", error);
      if (error instanceof Error) {
         toast.error(`Profil fotoğrafı yüklenemedi: ${error.message}`);
      } else {
         toast.error("Profil fotoğrafı yüklenemedi: Bilinmeyen hata.");
      }
      setProfileImageFile(null);
    } finally {
        if (profileImageInputRef.current) {
            profileImageInputRef.current.value = '';
        }
    }
  };
  
  const removeProfileImage = () => {
    setProfileImagePreview(null);
    setProfileImageFile(null);
    setEmployee(prev => prev ? { ...prev, profilePictureUrl: '' } : null);
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = '';
    }
    toast.info("Profil fotoğrafı kaldırıldı (Kaydetmeyi unutmayın)");
  };
  
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const oversizedFiles: string[] = [];
    const docsToAdd: (EmployeeDocument & { file?: File })[] = [];

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
          oversizedFiles.push(file.name);
      } else {
          docsToAdd.push({
              id: `new-${file.name}-${Date.now()}`,
              name: file.name,
              url: URL.createObjectURL(file),
              type: file.type,
              size: file.size,
              uploadDate: new Date().toISOString(),
              file: file
          });
      }
    });

    if (oversizedFiles.length > 0) {
        toast.error(`${oversizedFiles.join(", ")} dosyaları 5MB sınırını aşıyor.`);
    }

    if (docsToAdd.length > 0) {
        setUploadedDocuments(prev => [...prev, ...docsToAdd]);
        toast.info(`${docsToAdd.length} döküman eklendi (Kaydetmeyi unutmayın)`);
    }
    
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };
  
  const removeDocument = (id: string) => {
    const docToRemove = uploadedDocuments.find(doc => doc.id === id);
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== id));
    toast.info(`Döküman "${docToRemove?.name}" kaldırıldı (Kaydetmeyi unutmayın)`);
  };
  
  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      if (typeof dateString === 'string' && /\d{4}-\d{2}-\d{2}/.test(dateString)) {
          return dateString;
      }
      return '';
    }
  };
  
  const formatFileSize = (size: number | undefined): string => {
    if (size === undefined || size === null) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleInputChange = (field: keyof Employee | `emergencyContacts.${keyof EmergencyContact}` | 'department', value: any) => {
    setEmployee((prev) => {
      if (!prev) return null;
  
      if (field.startsWith('emergencyContacts.')) {
        const contactField = field.split('.')[1] as keyof EmergencyContact;
        const currentContact = prev.emergencyContacts || { id: 'temp', name: '', phone: '', relation: '' };
        return {
          ...prev,
          emergencyContacts: { ...currentContact, [contactField]: value },
        };
      }
  
      if (field === 'department') {
        const deptId = value as string;
        const selectedDept = departments.find((d) => d.id === deptId) || undefined;
        return {
          ...prev,
          departmentId: deptId,
          department: selectedDept,
        };
      }
  
      return { ...prev, [field]: value };
    });
  };
    
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('salary', value === '' ? null : parseFloat(value) || null);
  };
  
  const handleLeaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('annualLeaveAllowance', value === '' ? null : parseInt(value) || null);
  }; 

  const handleSaveEmployee = async () => {
    if (!employee || !employeeId) return;
    
    if (!employee.name || !employee.position) {
      toast.error("İsim ve Pozisyon alanları zorunludur");
      return;
    }
    
    setSaving(true);
    const uploadErrors: string[] = [];

    try {
      let updatedProfileUrl = employee?.profilePictureUrl || '';

      if (profileImageFile) {
          console.log(`Kaydet: Profil fotoğrafı yükleniyor...`);
          const profileToastId = toast.loading("Profil fotoğrafı yükleniyor...");
          try {
              const response = await uploadProfilePicture(employeeId, profileImageFile);
              if (!response?.profilePictureUrl) {
                toast.dismiss(profileToastId);
                uploadErrors.push("Profil fotoğrafı yüklenemedi (URL alınamadı).");
              } else {
                updatedProfileUrl = response.profilePictureUrl;
                console.log("Kaydet: Profil fotoğrafı yüklendi, GÖRECELİ URL:", updatedProfileUrl);
                toast.success("Profil fotoğrafı başarıyla yüklendi.");
                toast.dismiss(profileToastId);
                setProfileImageFile(null);
              }
          } catch (profileError) {
              const errorMessage = `Profil fotoğrafı yüklenemedi: ${profileError instanceof Error ? profileError.message : 'Bilinmeyen hata'}`;
              console.error("Kaydet: Profil fotoğrafı hatası:", errorMessage);
              toast.error(errorMessage);
              uploadErrors.push("Profil fotoğrafı yüklenemedi.");
              toast.dismiss(profileToastId);
          }
      } else if (profileImagePreview === null && employee?.profilePictureUrl) {
          updatedProfileUrl = ''; 
      }
      
      const documentsToUpload = uploadedDocuments.filter(doc => doc.file);
      if (documentsToUpload.length > 0) {
          console.log(`Kaydet: ${documentsToUpload.length} döküman yükleniyor...`);
          const docToastId = toast.loading(`${documentsToUpload.length} döküman yükleniyor...`);
          try {
              const filesToUpload = documentsToUpload.map(doc => doc.file as File); 
              await uploadEmployeeDocuments(employeeId, filesToUpload);
              console.log("Kaydet: Dökümanlar yüklendi.");
              toast.success(`${documentsToUpload.length} döküman başarıyla yüklendi.`);
              toast.dismiss(docToastId);
              setUploadedDocuments(prev => prev.map(doc => documentsToUpload.find(d => d.id === doc.id) ? { ...doc, file: undefined } : doc ));
          } catch (docError) {
              const errorMessage = `Dökümanlar yüklenemedi: ${docError instanceof Error ? docError.message : 'Bilinmeyen hata'}`;
              console.error("Kaydet: Döküman hatası:", errorMessage);
              toast.error(errorMessage);
              uploadErrors.push("Dökümanlar yüklenemedi.");
              toast.dismiss(docToastId);
          }
      }
      
      console.log("Kaydet: Personel bilgileri güncelleniyor...");
      const updateToastId = toast.loading("Personel bilgileri güncelleniyor...");

      if (typeof refreshUser === 'function') {
         try { await refreshUser(); } catch { console.warn("Token yenileme başarısız, devam ediliyor..."); }
      }
      
      const updateData: UpdateEmployeePayload = {
          firstName: employee.name || '',
          lastName: employee.surname || '',
          email: employee.email || '',
          phoneNumber: employee.phoneNumber || '',
          position: employee.position || '',
          departmentId: employee.departmentId,
          hireDate: employee.hireDate ? formatDate(employee.hireDate) : null,
          birthDate: employee.birthDate ? formatDate(employee.birthDate) : null,
          salary: employee.salary !== null ? employee.salary : undefined,
          tcKimlikNo: employee.tcKimlikNo || '',
          bloodType: employee.bloodType || null,
          drivingLicense: employee.drivingLicense || null,
          address: employee.address || '',
          iban: employee.iban || '',
          militaryStatus: employee.militaryStatus || null,
          education: employee.education || '',
          annualLeaveAllowance: employee.annualLeaveAllowance !== null ? employee.annualLeaveAllowance : undefined,
          profilePictureUrl: updatedProfileUrl,
          emergencyContactName: employee.emergencyContacts?.name || '',
          emergencyContactPhone: employee.emergencyContacts?.phone || '',
          emergencyContactRelation: employee.emergencyContacts?.relation || '',
      };

      console.log("Gönderilecek Güncelleme Verisi (Profil URL Göreceli):", updateData);
      await updateEmployee(employeeId, updateData);
      toast.dismiss(updateToastId);

      if (uploadErrors.length === 0) {
          toast.success("Personel bilgileri başarıyla güncellendi.");
      } else {
          toast.warning(`Personel bilgileri güncellendi ancak bazı dosya yüklemelerinde hata oluştu: ${uploadErrors.join(', ')}`);
      }
      router.push('/employees');

    } catch (error: any) {
      console.error("Personel güncellenirken genel hata:", error);
      toast.dismiss(uploadErrors.length > 0 ? undefined : 'updateToastId');
      if (error instanceof Error) {
         toast.error(`Personel bilgileri güncellenemedi: ${error.message}`);
      } else {
         toast.error("Personel bilgileri güncellenemedi: Bilinmeyen hata.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Personel Bulunamadı</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Düzenlemek istediğiniz personel bilgisi sistemde bulunamadı.
          </p>
          <Button 
            onClick={() => router.push('/employees')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Personel Listesine Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Geri
          </Button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Personel Düzenle
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center">
          <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden mb-3">
            {profileImagePreview ? (
              <img 
                src={profileImagePreview} 
                alt="Profil" 
                className="h-full w-full object-cover" 
                crossOrigin="anonymous"
              />
            ) : (
              <User className="h-16 w-16 text-gray-400" />
            )}
          </div>
          
          <div className="space-y-2 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => profileImageInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              Fotoğraf Yükle
            </Button>
            
            {profileImagePreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={removeProfileImage}
              >
                <X className="h-4 w-4 mr-1" />
                Kaldır
              </Button>
            )}
            
            <input
              type="file"
              ref={profileImageInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleProfileImageUpload}
            />
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            JPG, PNG veya GIF. Maksimum 2MB.
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium mb-4 border-b pb-2">Temel Bilgiler</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    İsim <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={employee?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="İsim"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Soyisim
                  </label>
                  <Input
                    value={employee?.surname || ''}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    placeholder="Soyisim"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    T.C. Kimlik No
                  </label>
                  <Input
                    value={employee?.tcKimlikNo || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 11);
                      handleInputChange('tcKimlikNo', value);
                    }}
                    placeholder="T.C. Kimlik Numarası (11 haneli)"
                    maxLength={11}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-posta
                  </label>
                  <Input
                    type="email"
                    value={employee?.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="E-posta"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefon
                  </label>
                  <Input
                    value={employee?.phoneNumber || ''}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Telefon"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium mb-4 border-b pb-2">İş Bilgileri</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pozisyon <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={employee?.position || ''}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Pozisyon"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Departman</label>
                  {isLoadingDepartments ? (
                    <p className="text-sm text-gray-500">Departmanlar yükleniyor...</p>
                  ) : (
                    <select
                      value={employee?.departmentId || ""}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Departman Seçin</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    İşe Giriş Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formatDate(employee?.hireDate)}
                    onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Doğum Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formatDate(employee?.birthDate)}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium mb-4 border-b pb-2">Diğer Bilgiler</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Kan Grubu</label>
                  <select
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md"
                    name="bloodType"
                    value={employee?.bloodType || ''}
                    onChange={(e) => handleInputChange('bloodType', e.target.value)}
                  >
                    <option value="">Seçiniz</option>
                    <option value="A Rh+">A Rh+</option>
                    <option value="A Rh-">A Rh-</option>
                    <option value="B Rh+">B Rh+</option>
                    <option value="B Rh-">B Rh-</option>
                    <option value="AB Rh+">AB Rh+</option>
                    <option value="AB Rh-">AB Rh-</option>
                    <option value="0 Rh+">0 Rh+</option>
                    <option value="0 Rh-">0 Rh-</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Ehliyet</label>
                  <Input
                    value={employee?.drivingLicense || ''}
                    onChange={(e) => handleInputChange('drivingLicense', e.target.value)}
                    placeholder="Ehliyet sınıfı"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Askerlik Durumu</label>
                  <select
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md"
                    name="militaryStatus"
                    value={employee?.militaryStatus || ''}
                    onChange={(e) => handleInputChange('militaryStatus', e.target.value)}
                  >
                    <option value="">Seçiniz</option>
                    <option value="YAPILDI">Yapıldı</option>
                    <option value="MUAF">Muaf</option>
                    <option value="TECILLI">Tecilli</option>
                    <option value="YAPILMADI">Yapılmadı</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Eğitim Durumu</label>
                  <select
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md"
                    name="education"
                    value={employee?.education || ''}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                  >
                    <option value="">Seçiniz</option>
                    <option value="ILKOKUL">İlkokul</option>
                    <option value="ORTAOKUL">Ortaokul</option>
                    <option value="LISE">Lise</option>
                    <option value="ONLISANS">Önlisans</option>
                    <option value="LISANS">Lisans</option>
                    <option value="YUKSEKLISANS">Yüksek Lisans</option>
                    <option value="DOKTORA">Doktora</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Ev Adresi</label>
                  <textarea
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={employee?.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    placeholder="Adres"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-4 border-b pb-2">Finansal Bilgiler</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="salary">
                    Maaş (TL)
                  </label>
                  <Input
                    id="salary"
                    type="text"
                    placeholder="Maaş (TL)"
                    value={employee?.salary === null ? '' : employee?.salary?.toString() || ''}
                    onChange={handleSalaryChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="iban">
                    IBAN
                  </label>
                  <Input
                    id="iban"
                    type="text"
                    placeholder="IBAN"
                    value={employee?.iban || ''}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="annualLeaveAllowance">
                    Yıllık İzin Hakkı (Gün)
                  </label>
                  <Input
                    id="annualLeaveAllowance"
                    type="number"
                    min="0"
                    max="60"
                    placeholder="Yıllık İzin Hakkı"
                    value={employee?.annualLeaveAllowance === null ? '' : employee?.annualLeaveAllowance?.toString() || ''}
                    onChange={handleLeaveChange}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-md font-medium mb-4 border-b pb-2">Acil Durum İletişim Bilgileri</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  İsim
                </label>
                <Input
                  value={employee?.emergencyContacts?.name || ''}
                  onChange={(e) => handleInputChange('emergencyContacts.name', e.target.value)}
                  placeholder="İsim"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefon
                </label>
                <Input
                  value={employee?.emergencyContacts?.phone || ''}
                  onChange={(e) => handleInputChange('emergencyContacts.phone', e.target.value)}
                  placeholder="Telefon"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yakınlık
                </label>
                <Input
                  value={employee?.emergencyContacts?.relation || ''}
                  onChange={(e) => handleInputChange('emergencyContacts.relation', e.target.value)}
                  placeholder="Yakınlık (Eş, kardeş vb.)"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-md font-medium mb-4 border-b pb-2">Dökümanlar</h3>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <div className="mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => documentInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Döküman Yükle
                </Button>
                <input
                  type="file"
                  ref={documentInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                  multiple
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  PDF, DOCX, JPG (Maks. 5MB)
                </p>
              </div>
              
              {uploadedDocuments.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {uploadedDocuments.map(doc => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                    >
                      <div className="flex items-center overflow-hidden">
                        <FileText className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        <div className="truncate">
                          <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {doc.type} 
                            {doc.size ? ` • ${formatFileSize(doc.size)}` : ''} 
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-2 text-sm">
                  Henüz döküman yüklenmedi
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            İptal
          </Button>
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSaveEmployee}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                Kaydet
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 