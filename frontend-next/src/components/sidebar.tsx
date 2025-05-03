"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LucideIcon, 
  Home, 
  Building2, 
  Users, 
  Folders, 
  ClipboardList, 
  UserCircle,
  Settings,
  Store,
  BarChart,
  Calendar,
  CheckSquare,
  BriefcaseBusiness,
  LayoutDashboard,
  UserRound,
  CalendarDays,
  DollarSign
} from "lucide-react";

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const items: SidebarItem[] = [
  {
    title: "Ana Sayfa",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Departmanlar",
    href: "/departments",
    icon: Building2,
  },
  {
    title: "Personel",
    href: "/employees",
    icon: Users,
  },
  {
    title: "Projeler",
    href: "/projects",
    icon: Folders,
  },
  {
    title: "Görevler",
    href: "/tasks",
    icon: ClipboardList,
  },
  {
    title: "Personel Görevleri",
    href: "/employee-tasks",
    icon: Calendar,
  },
  {
    title: "Yoklama",
    href: "/attendance",
    icon: CheckSquare,
  },
  {
    title: "Müşteriler",
    href: "/customers",
    icon: Store,
  },
  {
    title: "Raporlar",
    href: "/reports",
    icon: BarChart,
  },
  {
    title: "Profil",
    href: "/profile",
    icon: UserCircle,
  },
  {
    title: "Ayarlar",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Aydem Elektrik
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yönetim Sistemi
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Genel
          </h2>
          <div className="space-y-1">
            <Link
              href="/"
              className={`flex items-center rounded-lg px-3 py-2 transition-all ${
                isActive("/")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            İnsan Kaynakları
          </h2>
          <div className="space-y-1">
            <Link
              href="/employees"
              className={`flex items-center rounded-lg px-3 py-2 transition-all ${
                isActive("/employees")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Personel Listesi</span>
            </Link>
            <Link
              href="/departments"
              className={`flex items-center rounded-lg px-3 py-2 transition-all ${
                isActive("/departments")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>Departmanlar</span>
            </Link>
            <Link
              href="/annual-leave"
              className={`flex items-center rounded-lg px-3 py-2 transition-all ${
                isActive("/annual-leave")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              <span>Yıllık İzin</span>
            </Link>
            <Link
              href="/salary-calculation"
              className={`flex items-center rounded-lg px-3 py-2 transition-all ${
                isActive("/salary-calculation")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              <span>Maaş Hesaplama</span>
            </Link>
          </div>
        </div>

        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Organizasyon
          </h2>
          <div className="space-y-1">
            <Link
              href="/organization"
              className={`flex items-center rounded-lg px-3 py-2 transition-all ${
                isActive("/organization")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <BriefcaseBusiness className="mr-2 h-4 w-4" />
              <span>Organizasyon Şeması</span>
            </Link>
            <Link
              href="/positions"
              className={`flex items-center rounded-lg px-3 py-2 transition-all ${
                isActive("/positions")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <UserRound className="mr-2 h-4 w-4" />
              <span>Pozisyonlar</span>
            </Link>
            <Link
              href="/job-descriptions"
              className={`flex items-center rounded-lg px-3 py-2 transition-all ${
                isActive("/job-descriptions")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              <span>Görev Tanımları</span>
            </Link>
          </div>
        </div>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
            <UserCircle size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Admin Kullanıcı
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              admin@aydem.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
} 