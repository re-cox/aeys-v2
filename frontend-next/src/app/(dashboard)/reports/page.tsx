"use client";

import { useState, useEffect } from "react";
import { BarChart, PieChart, LineChart, Calendar, Filter, Download, ChevronDown } from "lucide-react";

interface ChartData {
  projects: {
    labels: string[];
    data: number[];
  };
  departments: {
    labels: string[];
    data: number[];
  };
  taskStatus: {
    labels: string[];
    data: number[];
  };
  projectsOverTime: {
    labels: string[];
    data: number[];
  };
}

export default function ReportsPage() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter" | "year">("month");
  const [department, setDepartment] = useState<string>("all");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [reportType, setReportType] = useState<"projects" | "tasks" | "departments" | "overview">("overview");

  // Rapor verilerini yükle
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // API çağrısını yapmadan önce bir gecikme ekleyelim
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // API hazır olduğunda:
        // const response = await api.reports.getChartData({
        //   dateRange,
        //   department: department === "all" ? undefined : department,
        //   type: reportType
        // });
        // setChartData(response.data);
        // const deptsResponse = await api.departments.getAll();
        // setDepartments(deptsResponse.data);

        // Mock veri
        setDepartments([
          { id: "all", name: "Tüm Departmanlar" },
          { id: "1", name: "Yönetim" },
          { id: "2", name: "Teknik" },
          { id: "3", name: "Muhasebe" }
        ]);

        setChartData({
          projects: {
            labels: ["İzmir Trafo Bakım", "Ankara Elektrik Altyapı", "İstanbul Enerji Verimliliği", "Antalya Güneş Paneli", "Bursa Şebeke Bakım"],
            data: [42, 28, 35, 20, 15]
          },
          departments: {
            labels: ["Yönetim", "Teknik", "Muhasebe", "İK", "Satış"],
            data: [10, 45, 8, 12, 25]
          },
          taskStatus: {
            labels: ["Yapılacak", "Devam Ediyor", "İncelemede", "Tamamlandı", "İptal"],
            data: [15, 25, 10, 40, 5]
          },
          projectsOverTime: {
            labels: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran"],
            data: [5, 7, 10, 12, 15, 18]
          }
        });
      } catch (err) {
        console.error("Rapor verisi yükleme hatası:", err);
        setError("Rapor verileri yüklenirken bir hata oluştu. API bağlantısını kontrol edin.");
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [dateRange, department, reportType]);

  // Raporu indir
  const downloadReport = async () => {
    try {
      setLoading(true);
      
      // API çağrısı: 
      // await api.reports.download({
      //   dateRange,
      //   department: department === "all" ? undefined : department,
      //   type: reportType,
      //   format: "pdf"
      // });
      
      console.log("Rapor indiriliyor:", { dateRange, department, reportType });
      
      // Simüle edilmiş gecikme
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("Rapor indirildi!");
    } catch (err) {
      console.error("Rapor indirme hatası:", err);
      setError("Rapor indirilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Raporlar</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Proje ve görev raporlarını görüntüle ve analiz et
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="py-2 pl-10 pr-8 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="overview">Genel Bakış</option>
                <option value="projects">Proje Raporu</option>
                <option value="tasks">Görev Raporu</option>
                <option value="departments">Departman Raporu</option>
              </select>
              <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <ChevronDown className="absolute right-3 top-2.5 text-gray-400" size={16} />
            </div>
            
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="py-2 pl-10 pr-8 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="week">Son Hafta</option>
                <option value="month">Son Ay</option>
                <option value="quarter">Son Çeyrek</option>
                <option value="year">Son Yıl</option>
              </select>
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <ChevronDown className="absolute right-3 top-2.5 text-gray-400" size={16} />
            </div>
            
            <div className="relative">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="py-2 px-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={downloadReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={16} />
            <span>Raporu İndir</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : chartData ? (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <BarChart className="mr-2 text-blue-600" size={20} />
                  Proje Dağılımı
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="w-full h-full relative">
                    {/* Burada gerçek bir grafik kütüphanesi kullanılabilir (recharts, chartjs vb.) */}
                    <div className="flex h-full items-end justify-around">
                      {chartData.projects.data.map((value, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className="bg-blue-500 dark:bg-blue-600 rounded-t w-10"
                            style={{ height: `${(value / Math.max(...chartData.projects.data)) * 100}%` }}
                          ></div>
                          <div className="text-xs mt-2 w-20 text-center truncate" title={chartData.projects.labels[index]}>
                            {chartData.projects.labels[index]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <PieChart className="mr-2 text-green-600" size={20} />
                  Görev Durumu
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="w-64 h-64 relative rounded-full overflow-hidden">
                    {/* Burada gerçek bir pasta grafik olabilir */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="font-bold text-3xl">{chartData.taskStatus.data.reduce((a, b) => a + b, 0)}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Toplam Görev</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex">
                      {chartData.taskStatus.labels.map((label, index) => {
                        const colors = [
                          "bg-gray-300 dark:bg-gray-600",
                          "bg-blue-400 dark:bg-blue-600",
                          "bg-yellow-400 dark:bg-yellow-600",
                          "bg-green-400 dark:bg-green-600",
                          "bg-red-400 dark:bg-red-600"
                        ];
                        return (
                          <div key={index} className={`${colors[index]} opacity-70 flex-1`}></div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {chartData.taskStatus.labels.map((label, index) => {
                    const colors = [
                      "bg-gray-300 dark:bg-gray-600",
                      "bg-blue-400 dark:bg-blue-600",
                      "bg-yellow-400 dark:bg-yellow-600",
                      "bg-green-400 dark:bg-green-600",
                      "bg-red-400 dark:bg-red-600"
                    ];
                    return (
                      <div key={index} className="flex items-center">
                        <div className={`${colors[index]} w-3 h-3 rounded-full mr-1`}></div>
                        <span className="text-xs">{label}: {chartData.taskStatus.data[index]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <LineChart className="mr-2 text-purple-600" size={20} />
                  Zaman İçindeki Proje Sayısı
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="w-full h-full relative">
                    {/* Burada gerçek bir çizgi grafik olabilir */}
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gray-300 dark:bg-gray-600"></div>
                    <div className="absolute inset-y-0 left-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 flex items-end h-full">
                      <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                        <path
                          d={`M0,${240 - (chartData.projectsOverTime.data[0] / Math.max(...chartData.projectsOverTime.data) * 200)} ${
                            chartData.projectsOverTime.data.map((value, index) => {
                              const x = (index / (chartData.projectsOverTime.data.length - 1)) * 600;
                              const y = 240 - (value / Math.max(...chartData.projectsOverTime.data) * 200);
                              return `L${x},${y}`;
                            }).join(" ")
                          }`}
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="3"
                        />
                        {chartData.projectsOverTime.data.map((value, index) => {
                          const x = (index / (chartData.projectsOverTime.data.length - 1)) * 600;
                          const y = 240 - (value / Math.max(...chartData.projectsOverTime.data) * 200);
                          return (
                            <circle
                              key={index}
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#8b5cf6"
                              stroke="#fff"
                              strokeWidth="2"
                            />
                          );
                        })}
                      </svg>
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-0 flex justify-between px-2">
                      {chartData.projectsOverTime.labels.map((label, index) => (
                        <div key={index} className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Özet Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Toplam Proje</div>
                  <div className="text-2xl font-bold mt-1">
                    {chartData.projects.data.reduce((a, b) => a + b, 0)}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Tamamlanan Görevler</div>
                  <div className="text-2xl font-bold mt-1 text-green-600">
                    {chartData.taskStatus.data[3]} {/* 'Tamamlandı' durumundaki görevler */}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Devam Eden Görevler</div>
                  <div className="text-2xl font-bold mt-1 text-blue-600">
                    {chartData.taskStatus.data[1]} {/* 'Devam Ediyor' durumundaki görevler */}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Departman Bazında</div>
                  <div className="text-2xl font-bold mt-1 text-purple-600">
                    {Math.max(...chartData.departments.data)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Rapor verisi bulunamadı
          </div>
        )}
      </div>
    </div>
  );
} 