"use client";

import { useState, useEffect } from "react";
import { Check, X, Mail, Phone, Building2, Calendar, AtSign } from "lucide-react";
import api from "@/lib/api";

interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string | null;
  position: string | null;
  department: {
    id: string;
    name: string;
  } | null;
  startDate: string | null;
  isActive: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Profil verilerini yükle
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // API çağrısını yapmadan önce bir gecikme ekleyelim
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // API hazır olduğunda:
        // const response = await api.auth.me();
        // setProfile(response.data);

        // Mock veri
        setProfile({
          id: "1",
          name: "Admin",
          surname: "Kullanıcı",
          email: "admin@aydem.com",
          phone: "+90 555 123 4567",
          position: "Sistem Yöneticisi",
          department: {
            id: "1",
            name: "Yönetim"
          },
          startDate: "2022-01-01",
          isActive: true
        });
      } catch (err) {
        console.error("Profil verisi yükleme hatası:", err);
        setError("Profil bilgileri yüklenirken bir hata oluştu. API bağlantısını kontrol edin.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Şifre değişikliği
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Şifre doğrulama
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Yeni şifre ve şifre doğrulama alanları eşleşmiyor.");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }

    try {
      setLoading(true);
      setPasswordError(null);
      setPasswordSuccess(null);
      
      // API hazır olduğunda:
      // await api.auth.changePassword({
      //   currentPassword: passwordForm.currentPassword,
      //   newPassword: passwordForm.newPassword
      // });
      
      console.log("Şifre değiştiriliyor:", passwordForm);
      
      // Simüle edilmiş gecikme
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Formu sıfırla
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Başarı mesajı göster
      setPasswordSuccess("Şifreniz başarıyla değiştirildi.");
      
      // 3 saniye sonra başarı mesajını gizle
      setTimeout(() => {
        setPasswordSuccess(null);
        setShowPasswordForm(false);
      }, 3000);
    } catch (err) {
      console.error("Şifre değiştirme hatası:", err);
      setPasswordError("Şifre değiştirilirken bir hata oluştu. Mevcut şifrenizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  // Tarih formatını düzenle
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR").format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Hesap bilgilerinizi görüntüleyin ve yönetin
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-800">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading && !profile ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : profile ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Kişisel Bilgiler</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Ad Soyad
                </h3>
                <p className="text-base">
                  {profile.name} {profile.surname}
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  E-posta
                </h3>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <p className="text-base">{profile.email}</p>
                </div>
              </div>
              
              {profile.phone && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Telefon
                  </h3>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <p className="text-base">{profile.phone}</p>
                  </div>
                </div>
              )}
              
              {profile.position && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Pozisyon
                  </h3>
                  <div className="flex items-center">
                    <AtSign className="h-4 w-4 mr-2 text-gray-500" />
                    <p className="text-base">{profile.position}</p>
                  </div>
                </div>
              )}
              
              {profile.department && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Departman
                  </h3>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                    <p className="text-base">{profile.department.name}</p>
                  </div>
                </div>
              )}
              
              {profile.startDate && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Başlangıç Tarihi
                  </h3>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <p className="text-base">{formatDate(profile.startDate)}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Durum
                </h3>
                <div className="flex items-center">
                  {profile.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      <Check className="h-3 w-3 mr-1" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                      <X className="h-3 w-3 mr-1" />
                      Pasif
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Şifre Değiştir</h2>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
                >
                  Değiştir
                </button>
              )}
            </div>
            
            {showPasswordForm ? (
              <form onSubmit={handlePasswordChange}>
                {passwordError && (
                  <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm dark:bg-red-900 dark:text-red-100 dark:border-red-800">
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-sm dark:bg-green-900 dark:text-green-100 dark:border-green-800">
                    {passwordSuccess}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mevcut Şifre*
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Yeni Şifre*
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      required
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Yeni Şifre (Tekrar)*
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                        setPasswordError(null);
                        setPasswordSuccess(null);
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md dark:border-gray-600"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? "İşleniyor..." : "Kaydet"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hesabınızın şifresini değiştirmek için &ldquo;Değiştir&rdquo; düğmesine tıklayın.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
} 