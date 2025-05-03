"use client";

import { useState, useEffect } from "react";
import {
  Users,
  ClipboardList,
  Package,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  Building2,
  Folders,
  Store,
  TrendingUp,
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  ThermometerSun,
} from "lucide-react";
import Link from "next/link";
import { getWeatherData } from '@/services/weatherService';
import { getCurrencyRates } from '@/services/currency.service';
import { toast } from "sonner";

interface DashboardStats {
  departments: number;
  employees: number;
  projects: number;
  tasks: number;
  customers: number;
  recentProjects: {
    id: string;
    name: string;
    status: string;
    date: string;
  }[];
  upcomingTasks: {
    id: string;
    title: string;
    dueDate: string;
    priority: string;
  }[];
}

// Hava durumu için tip tanımlaması
interface WeatherData {
  location: string;
  temperature: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  pressure: number;
  sunrise: number;
  sunset: number;
  timestamp: number;
}

// Döviz kurları için tip tanımlaması
interface CurrencyData {
  USD: {
    alis: string;
    satis: string;
    degisim: string;
  };
  EUR: {
    alis: string;
    satis: string;
    degisim: string;
  };
  GBP: {
    alis: string;
    satis: string;
    degisim: string;
  };
}

// Weather icon mapping
const weatherIcons: { [key: string]: any } = {
  "01d": Sun, // Açık (gündüz)
  "01n": Sun, // Açık (gece)
  "02d": Cloud, // Az bulutlu (gündüz)
  "02n": Cloud, // Az bulutlu (gece)
  "03d": Cloud, // Parçalı bulutlu (gündüz)
  "03n": Cloud, // Parçalı bulutlu (gece)
  "04d": Cloud, // Bulutlu (gündüz)
  "04n": Cloud, // Bulutlu (gece)
  "09d": CloudRain, // Sağanak yağışlı (gündüz)
  "09n": CloudRain, // Sağanak yağışlı (gece)
  "10d": CloudRain, // Yağmurlu (gündüz)
  "10n": CloudRain, // Yağmurlu (gece)
  "11d": CloudRain, // Gök gürültülü (gündüz)
  "11n": CloudRain, // Gök gürültülü (gece)
  "13d": CloudRain, // Karlı (gündüz)
  "13n": CloudRain, // Karlı (gece)
  "50d": Cloud, // Sisli (gündüz)
  "50n": Cloud, // Sisli (gece)
  default: Cloud,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [currencyData, setCurrencyData] = useState<CurrencyData | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // API çağrısını yapmadan önce bir gecikme ekleyelim
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // API hazır olduğunda:
        // const response = await api.dashboard.getStats();
        // setStats(response.data);

        // Mock veri
        setStats({
          departments: 5,
          employees: 22,
          projects: 8,
          tasks: 34,
          customers: 12,
          recentProjects: [
            {
              id: "1",
              name: "İzmir Trafo Bakım Projesi",
              status: "IN_PROGRESS",
              date: "2023-02-15"
            },
            {
              id: "2",
              name: "Ankara Elektrik Altyapı Projesi",
              status: "PLANNING",
              date: "2023-03-20"
            },
            {
              id: "3",
              name: "İstanbul Enerji Verimliliği Projesi",
              status: "COMPLETED",
              date: "2023-01-10"
            }
          ],
          upcomingTasks: [
            {
              id: "1",
              title: "Trafo bakımı yapılacak",
              dueDate: "2023-04-15",
              priority: "HIGH"
            },
            {
              id: "2",
              title: "Yeni kablo hattı çekilecek",
              dueDate: "2023-05-20",
              priority: "MEDIUM"
            },
            {
              id: "3",
              title: "Enerji analiz raporu hazırlanacak",
              dueDate: "2023-02-10",
              priority: "LOW"
            }
          ]
        });
      } catch (err) {
        console.error("Dashboard verisi yükleme hatası:", err);
        setError("Dashboard verileri yüklenirken bir hata oluştu. API bağlantısını kontrol edin.");
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      try {
        // Gerçek hava durumu verisini API'den al
        const weather = await getWeatherData()
          .catch(error => {
            console.error("Hava durumu verileri alınamadı:", error);
            toast.error("Hava durumu bilgileri alınamadı");
            // Varsayılan hava durumu verisi dön
            return {
              location: 'İstanbul, Esenyurt',
              temperature: 0,
              feels_like: 0,
              description: 'Veri alınamadı',
              icon: 'default',
              humidity: 0,
              wind_speed: 0,
              pressure: 0,
              sunrise: 0,
              sunset: 0,
              timestamp: Date.now() / 1000
            };
          });

        setWeatherData(weather);

        // Şu an için döviz kurları sabit tutuluyor, gerektiğinde API eklenebilir
        const mockCurrencyData = {
          USD: {
            alis: "32.5678",
            satis: "32.6543",
            degisim: "0.32"
          },
          EUR: {
            alis: "35.2345",
            satis: "35.3456",
            degisim: "-0.15"
          },
          GBP: {
            alis: "41.3456",
            satis: "41.5678",
            degisim: "0.22"
          }
        };

        setCurrencyData(mockCurrencyData);
      } catch (error) {
        console.error("Dış API verisi alınırken hata oluştu:", error);
        // Hata bildirimini kullanıcıya gösterme
        toast.error("Bazı veriler yüklenemedi");
      }
    };

    loadStats();
    fetchData();

    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Tarih formatını düzenle
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR").format(date);
  };

  // Proje durumu renklerini tanımla
  const getProjectStatus = (status: string) => {
    switch (status) {
      case "PLANNING":
        return { text: "Planlama", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" };
      case "STARTED":
        return { text: "Başladı", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" };
      case "IN_PROGRESS":
        return { text: "Devam Ediyor", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" };
      case "COMPLETED":
        return { text: "Tamamlandı", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" };
      case "ON_HOLD":
        return { text: "Beklemede", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" };
      case "CANCELLED":
        return { text: "İptal", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" };
      default:
        return { text: "Bilinmiyor", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100" };
    }
  };

  // Görev önceliği renklerini tanımla
  const getTaskPriority = (priority: string) => {
    switch (priority) {
      case "LOW":
        return { text: "Düşük", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" };
      case "MEDIUM":
        return { text: "Orta", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" };
      case "HIGH":
        return { text: "Yüksek", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" };
      case "URGENT":
        return { text: "Acil", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" };
      default:
        return { text: "Bilinmiyor", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100" };
    }
  };

  // Hava durumu kartı
  const WeatherCard = () => {
    if (!weatherData) return null;

    const WeatherIcon = weatherIcons[weatherData.icon] || weatherIcons.default;
    
    // Güneşin doğuş ve batış saatlerini formatla
    const formatTime = (timestamp: number) => {
      if (!timestamp) return "--:--";
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Hava Durumu
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {weatherData.location}
          </span>
        </div>
        
        <div className="flex items-center mb-6">
          <WeatherIcon className="h-12 w-12 text-blue-500 mr-4" />
          <div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {Math.round(weatherData.temperature)}°C
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {weatherData.description}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <ThermometerSun className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Hissedilen
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {Math.round(weatherData.feels_like)}°C
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Droplets className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Nem
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {weatherData.humidity}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Wind className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Rüzgar
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {Math.round(weatherData.wind_speed * 3.6)} km/s
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Döviz kartı
  const CurrencyCard = () => {
    if (!currencyData) return null;

    const formatCurrency = (value: string) => {
      return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(parseFloat(value));
    };

    const getChangeColor = (change: string) => {
      const parsedChange = parseFloat(change);
      return parsedChange >= 0 
        ? 'text-green-500 dark:text-green-400' 
        : 'text-red-500 dark:text-red-400';
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Döviz Kurları
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Canlı
          </span>
        </div>
        
        <div className="space-y-4">
          {/* USD */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <span className="text-lg font-medium text-gray-900 dark:text-white mr-2">
                USD
              </span>
              <span className={`text-sm ${getChangeColor(currencyData.USD.degisim)}`}>
                {parseFloat(currencyData.USD.degisim) > 0 ? '+' : ''}{currencyData.USD.degisim}%
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Alış: {formatCurrency(currencyData.USD.alis)} ₺
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Satış: {formatCurrency(currencyData.USD.satis)} ₺
              </div>
            </div>
          </div>

          {/* EUR */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <span className="text-lg font-medium text-gray-900 dark:text-white mr-2">
                EUR
              </span>
              <span className={`text-sm ${getChangeColor(currencyData.EUR.degisim)}`}>
                {parseFloat(currencyData.EUR.degisim) > 0 ? '+' : ''}{currencyData.EUR.degisim}%
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Alış: {formatCurrency(currencyData.EUR.alis)} ₺
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Satış: {formatCurrency(currencyData.EUR.satis)} ₺
              </div>
            </div>
          </div>

          {/* GBP */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <span className="text-lg font-medium text-gray-900 dark:text-white mr-2">
                GBP
              </span>
              <span className={`text-sm ${getChangeColor(currencyData.GBP.degisim)}`}>
                {parseFloat(currencyData.GBP.degisim) > 0 ? '+' : ''}{currencyData.GBP.degisim}%
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Alış: {formatCurrency(currencyData.GBP.alis)} ₺
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Satış: {formatCurrency(currencyData.GBP.satis)} ₺
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gösterge Paneli</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Sistem istatistikleri ve son aktiviteler
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-800">
          {error}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex items-center">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-200" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Departmanlar</h3>
                <p className="text-2xl font-semibold">{stats.departments}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex items-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <Users className="h-6 w-6 text-green-600 dark:text-green-200" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Personel</h3>
                <p className="text-2xl font-semibold">{stats.employees}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                <Folders className="h-6 w-6 text-yellow-600 dark:text-yellow-200" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Projeler</h3>
                <p className="text-2xl font-semibold">{stats.projects}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex items-center">
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                <ClipboardList className="h-6 w-6 text-purple-600 dark:text-purple-200" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Görevler</h3>
                <p className="text-2xl font-semibold">{stats.tasks}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex items-center">
              <div className="rounded-full bg-indigo-100 p-3 dark:bg-indigo-900">
                <Store className="h-6 w-6 text-indigo-600 dark:text-indigo-200" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Müşteriler</h3>
                <p className="text-2xl font-semibold">{stats.customers}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeatherCard />
            <CurrencyCard />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Son Projeler</h2>
                <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  Tümünü Gör
                </Link>
              </div>
              <div className="p-6">
                {stats.recentProjects.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">Henüz proje bulunmuyor</p>
                ) : (
                  <div className="space-y-4">
                    {stats.recentProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(project.date)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getProjectStatus(project.status).color}`}>
                          {getProjectStatus(project.status).text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Yaklaşan Görevler</h2>
                <Link href="/tasks" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  Tümünü Gör
                </Link>
              </div>
              <div className="p-6">
                {stats.upcomingTasks.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">Henüz görev bulunmuyor</p>
                ) : (
                  <div className="space-y-4">
                    {stats.upcomingTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Son Tarih: {formatDate(task.dueDate)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTaskPriority(task.priority).color}`}>
                          {getTaskPriority(task.priority).text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Genel Performans</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <TrendingUp className="h-3 w-3 mr-1" />
                %12 Artış
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Bu ay tamamlanan görev sayısı geçen aya göre arttı. 12 yeni görev oluşturuldu ve 8 görev tamamlandı.
            </p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>Tamamlanan Görevler</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-blue-600 h-2.5 rounded-full w-3/4"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>Devam Eden Projeler</span>
                  <span>60%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-yellow-500 h-2.5 rounded-full w-3/5"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>Müşteri Memnuniyeti</span>
                  <span>90%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-green-500 h-2.5 rounded-full w-[90%]"></div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  status: "up" | "down";
  icon: React.ReactNode;
}

function StatCard({ title, value, change, status, icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full">{icon}</div>
      </div>
      <div className="mt-4 flex items-center">
        {status === "up" ? (
          <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
        ) : (
          <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
        )}
        <span
          className={
            status === "up" ? "text-green-500" : "text-red-500"
          }
        >
          {change} {status === "up" ? "artış" : "azalış"}
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
          (son 30 gün)
        </span>
      </div>
    </div>
  );
} 