"use client";

import { useState } from "react";
import { Moon, Sun, Check, Laptop, X } from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("tr");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tema değişikliği
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    
    // Tema değişimini HTML'e uygula (gerçek uygulamada next-themes kullanılabilir)
    if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      // Sistem teması için burada bir mantık eklenebilir
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Ayarları kaydet
  const saveSettings = async () => {
    try {
      setError(null);
      
      // Burada ayarları kaydetme API çağrısı yapılabilir
      console.log("Ayarlar kaydediliyor:", { theme, language, notificationsEnabled });
      
      // Simüle edilmiş gecikme
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Başarı mesajı göster
      setSuccess("Ayarlarınız başarıyla kaydedildi.");
      
      // 3 saniye sonra başarı mesajını gizle
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Ayarları kaydetme hatası:", err);
      setError("Ayarlar kaydedilirken bir hata oluştu.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Uygulama ayarlarını yapılandırın
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

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative dark:bg-green-900 dark:text-green-100 dark:border-green-800">
          <span className="block sm:inline">{success}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccess(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Görünüm</h2>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Tema
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              className={`relative flex flex-col items-center p-3 rounded-lg border ${
                theme === "light"
                  ? "bg-blue-50 border-blue-600 dark:bg-blue-900 dark:border-blue-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => handleThemeChange("light")}
            >
              <Sun className="h-6 w-6 mb-2 text-gray-900 dark:text-white" />
              <span className="text-sm font-medium">Açık</span>
              {theme === "light" && (
                <span className="absolute top-2 right-2 text-blue-600 dark:text-blue-500">
                  <Check size={16} />
                </span>
              )}
            </button>
            
            <button
              type="button"
              className={`relative flex flex-col items-center p-3 rounded-lg border ${
                theme === "dark"
                  ? "bg-blue-50 border-blue-600 dark:bg-blue-900 dark:border-blue-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => handleThemeChange("dark")}
            >
              <Moon className="h-6 w-6 mb-2 text-gray-900 dark:text-white" />
              <span className="text-sm font-medium">Koyu</span>
              {theme === "dark" && (
                <span className="absolute top-2 right-2 text-blue-600 dark:text-blue-500">
                  <Check size={16} />
                </span>
              )}
            </button>
            
            <button
              type="button"
              className={`relative flex flex-col items-center p-3 rounded-lg border ${
                theme === "system"
                  ? "bg-blue-50 border-blue-600 dark:bg-blue-900 dark:border-blue-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => handleThemeChange("system")}
            >
              <Laptop className="h-6 w-6 mb-2 text-gray-900 dark:text-white" />
              <span className="text-sm font-medium">Sistem</span>
              {theme === "system" && (
                <span className="absolute top-2 right-2 text-blue-600 dark:text-blue-500">
                  <Check size={16} />
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Dil
          </h3>
          <div className="max-w-xs">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Bildirimler
          </h3>
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notificationsEnabled}
                onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                Bildirimleri etkinleştir
              </span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
} 