"use client";

import { useEffect, useState } from "react";
import { 
  Users, Briefcase, CheckSquare, Calendar, 
  Activity, Clock, XSquare 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

// İstatistik arayüzleri
interface DashboardStats {
  employeeCount: number;
  departmentCount: number;
  taskCount: number;
  projectCount: number;
  taskCompletionRate: number;
  attendanceStats: {
    present: number;
    absent: number;
    late: number;
    leave: number;
  };
  recentActivities: {
    id: string;
    type: string;
    message: string;
    date: string;
    user: {
      name: string;
      surname: string;
    };
  }[];
}

// Progress bar komponenti bulunamadığı için basit bir progress bar oluşturalım
function Progress({ value, className }: { value: number, className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700 ${className}`}>
      <div
        className="bg-blue-600 h-1 rounded-full dark:bg-blue-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // API henüz yoksa, örnek veriler kullanalım
        // Gerçek uygulamada: const response = await fetch('/api/dashboard/stats');
        
        // Geçici mock veri (gerçekte API'den alınacak)
        const mockStats: DashboardStats = {
          employeeCount: 78,
          departmentCount: 12,
          projectCount: 24,
          taskCount: 156,
          taskCompletionRate: 72,
          attendanceStats: {
            present: 65,
            absent: 5,
            late: 8,
            leave: 10
          },
          recentActivities: [
            {
              id: "1",
              type: "task",
              message: "Yeni görev atandı: Raporlama sistemi güncellemesi",
              date: "2023-10-12T10:30:00Z",
              user: { name: "Ahmet", surname: "Yılmaz" }
            },
            {
              id: "2",
              type: "project",
              message: "Proje tamamlandı: Müşteri portal entegrasyonu",
              date: "2023-10-11T16:45:00Z",
              user: { name: "Ayşe", surname: "Kaya" }
            },
            {
              id: "3",
              type: "department",
              message: "Yeni departman oluşturuldu: Kalite Kontrol",
              date: "2023-10-10T09:15:00Z",
              user: { name: "Mehmet", surname: "Demir" }
            },
            {
              id: "4",
              type: "employee",
              message: "Yeni personel eklendi: Zeynep Aksoy",
              date: "2023-10-09T14:20:00Z",
              user: { name: "Selin", surname: "Yıldız" }
            },
            {
              id: "5",
              type: "attendance",
              message: "Devamsızlık bildirimi: İzin (Sağlık)",
              date: "2023-10-08T08:30:00Z",
              user: { name: "Emre", surname: "Can" }
            }
          ]
        };
        
        setStats(mockStats);
        setError(null);
      } catch (err) {
        console.error("İstatistikler yüklenirken hata oluştu:", err);
        setError("İstatistikler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Tarih formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Aktivite simgesi seç
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="h-4 w-4 mr-2 text-blue-500" />;
      case 'project':
        return <Briefcase className="h-4 w-4 mr-2 text-purple-500" />;
      case 'department':
        return <Users className="h-4 w-4 mr-2 text-green-500" />;
      case 'employee':
        return <Users className="h-4 w-4 mr-2 text-amber-500" />;
      case 'attendance':
        return <Calendar className="h-4 w-4 mr-2 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg mt-4">
        <p>{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-2"
        >
          Yeniden Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Genel Bakış</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Son Güncelleme: {new Date().toLocaleTimeString('tr-TR')}
        </div>
      </div>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Personel</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.employeeCount}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.departmentCount} departmanda çalışan
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktif Projeler</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.projectCount}</div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((stats?.projectCount || 0) * 0.75)} devam ediyor
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Görevler</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.taskCount}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <div className="w-full">
                <div className="flex justify-between mb-1">
                  <span>Tamamlanma Oranı</span>
                  <span>{stats?.taskCompletionRate}%</span>
                </div>
                <Progress value={stats?.taskCompletionRate || 0} className="h-1" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Yoklama</CardTitle>
            <Calendar className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-green-600">
                <CheckSquare className="h-3 w-3 mr-1" />
                <span className="text-xs">{stats?.attendanceStats.present}</span>
              </div>
              <div className="flex items-center text-red-600">
                <XSquare className="h-3 w-3 mr-1" />
                <span className="text-xs">{stats?.attendanceStats.absent}</span>
              </div>
              <div className="flex items-center text-yellow-600">
                <Clock className="h-3 w-3 mr-1" />
                <span className="text-xs">{stats?.attendanceStats.late}</span>
              </div>
              <div className="flex items-center text-blue-600">
                <Calendar className="h-3 w-3 mr-1" />
                <span className="text-xs">{stats?.attendanceStats.leave}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Toplam {stats?.employeeCount} personelden {stats?.attendanceStats.present} mevcut
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Son Aktiviteler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="ml-2 flex-1">
                    <div className="text-sm">{activity.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.date)} • {activity.user.name} {activity.user.surname}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hızlı Erişim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <Users className="h-4 w-4 mr-2" />
                <span>Personel</span>
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Briefcase className="h-4 w-4 mr-2" />
                <span>Projeler</span>
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <CheckSquare className="h-4 w-4 mr-2" />
                <span>Görevler</span>
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Yoklama</span>
              </Button>
              <Button variant="outline" size="sm" className="justify-start col-span-2">
                <Activity className="h-4 w-4 mr-2" />
                <span>Raporlar Oluştur</span>
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="text-sm font-medium">Görev Durumu</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                    <span>Bekleyen</span>
                  </div>
                  <span>
                    {Math.round((stats?.taskCount || 0) * 0.2)} 
                    <span className="text-gray-500">/{stats?.taskCount}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                    <span>Devam Eden</span>
                  </div>
                  <span>
                    {Math.round((stats?.taskCount || 0) * 0.4)}
                    <span className="text-gray-500">/{stats?.taskCount}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span>Tamamlanan</span>
                  </div>
                  <span>
                    {Math.round((stats?.taskCount || 0) * 0.3)}
                    <span className="text-gray-500">/{stats?.taskCount}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                    <span>Geciken</span>
                  </div>
                  <span>
                    {Math.round((stats?.taskCount || 0) * 0.1)}
                    <span className="text-gray-500">/{stats?.taskCount}</span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 