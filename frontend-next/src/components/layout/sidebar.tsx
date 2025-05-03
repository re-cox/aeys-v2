"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  Users, 
  Building2, 
  ShoppingCart, 
  Package, 
  Wrench, 
  Construction, 
  FileCheck, 
  BarChart4, 
  Calendar, 
  Clock,
  ChevronDown,
  Menu,
  X,
  Plus
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        active 
          ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-50" 
          : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

interface NavGroupProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function NavGroup({ icon, label, children, defaultOpen = false }: NavGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <div>
      <button
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{label}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="ml-6 mt-1 space-y-1">{children}</div>}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  return (
    <>
      {/* Mobil menü butonu */}
      <button
        className="fixed top-4 left-4 z-40 rounded-full p-2 bg-white shadow-md md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-500">
            <Package />
            <span>Aydem Elektrik</span>
          </Link>
        </div>
        
        <nav className="flex flex-col gap-1 p-2 overflow-y-auto h-[calc(100vh-4rem)]">
          <NavItem 
            href="/dashboard" 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={pathname === "/dashboard"} 
          />
          
          <NavGroup 
            icon={<ClipboardList size={20} />} 
            label="İş Yönetimi"
            defaultOpen={pathname.startsWith("/projects") || pathname.startsWith("/tasks")}
          >
            <NavItem 
              href="/projects" 
              icon={<FileText size={20} />} 
              label="Projeler" 
              active={pathname.startsWith("/projects")} 
            />
            <NavItem 
              href="/tasks" 
              icon={<ClipboardList size={20} />} 
              label="Görevler" 
              active={pathname.startsWith("/tasks")} 
            />
            <NavItem 
              href="/teknisyenraporlari" 
              icon={<FileCheck size={20} />} 
              label="Teknisyen Raporları" 
              active={pathname.startsWith("/teknisyenraporlari")} 
            />
			 <NavItem 
              href="/hakedisler" 
              icon={<FileCheck size={20} />} 
              label="Hakedişler" 
              active={pathname.startsWith("/teknisyenraporlari")} 
            />
          </NavGroup>
          
          <NavGroup 
            icon={<Building2 size={20} />} 
            label="Organizasyon"
            defaultOpen={pathname.startsWith("/departments") || pathname.startsWith("/employees")}
          >
            <NavItem 
              href="/departments" 
              icon={<Building2 size={20} />} 
              label="Departmanlar" 
              active={pathname.startsWith("/departments")} 
            />
            <NavItem 
              href="/employees" 
              icon={<Users size={20} />} 
              label="Personel" 
              active={pathname.startsWith("/employees")} 
            />
            <NavItem 
              href="/attendance" 
              icon={<Clock size={20} />} 
              label="Puantaj" 
              active={pathname.startsWith("/attendance")} 
            />
            <NavItem 
              href="/employee-tasks" 
              icon={<ClipboardList size={20} />} 
              label="Personel Görevleri" 
              active={pathname.startsWith("/employee-tasks")} 
            />
            <NavItem 
              href="/annual-leave" 
              icon={<Calendar size={20} />} 
              label="Yıllık İzin" 
              active={pathname.startsWith("/annual-leave")} 
            />
            <NavItem 
              href="/salary-calculation" 
              icon={<BarChart4 size={20} />} 
              label="Maaş Hesaplama" 
              active={pathname.startsWith("/salary-calculation")} 
            />
          </NavGroup>
          
          <NavGroup 
            icon={<ShoppingCart size={20} />} 
            label="Müşteriler"
            defaultOpen={pathname.startsWith("/customers")}
          >
            <NavItem 
              href="/customers" 
              icon={<ShoppingCart size={20} />} 
              label="Müşteri Listesi" 
              active={pathname.startsWith("/customers")} 
            />
            <NavItem 
              href="/proposals" 
              icon={<FileText size={20} />} 
              label="Teklifler" 
              active={pathname.startsWith("/proposals")} 
            />
            <NavItem 
              href="/marketing" 
              icon={<BarChart4 size={20} />} 
              label="Pazarlama" 
              active={pathname.startsWith("/marketing")} 
            />
          </NavGroup>
          
          <NavGroup 
            icon={<Package size={20} />} 
            label="Malzeme Yönetimi"
            defaultOpen={pathname.startsWith("/inventory") || pathname.startsWith("/assignments")}
          >
            <NavItem 
              href="/inventory" 
              icon={<Package size={20} />} 
              label="Stok Yönetimi" 
              active={pathname.startsWith("/inventory")} 
            />
            <NavItem 
              href="/assignments" 
              icon={<Wrench size={20} />} 
              label="Zimmetler" 
              active={pathname.startsWith("/assignments")} 
            />
          </NavGroup>
          
          <NavGroup 
            icon={<ShoppingCart size={20} />} 
            label="Satın Alma"
            defaultOpen={pathname.startsWith("/purchasing")}
          >
            <NavItem 
              href="/purchasing/requests" 
              icon={<ClipboardList size={20} />} 
              label="Satın Alma Talepleri" 
              active={pathname.startsWith("/purchasing/requests")} 
            />
            <NavItem 
              href="/purchasing/new-request" 
              icon={<Plus size={20} />} 
              label="Yeni Satın Alma Talebi" 
              active={pathname === "/purchasing/new-request"} 
            />
          </NavGroup>
          
          <NavGroup 
            icon={<Construction size={20} />} 
            label="Şantiye Yönetimi"
            defaultOpen={pathname.startsWith("/sites")}
          >
            <NavItem 
              href="/sites" 
              icon={<Construction size={20} />} 
              label="Şantiyeler" 
              active={pathname.startsWith("/sites")} 
            />
            <NavItem 
              href="/site-inventory" 
              icon={<Package size={20} />} 
              label="Şantiye Stok" 
              active={pathname.startsWith("/site-inventory")} 
            />
          </NavGroup>
          
          <NavItem 
            href="/documents" 
            icon={<FileText size={20} />} 
            label="Evrak Yönetimi" 
            active={pathname.startsWith("/documents")} 
          />
          
          <NavItem 
            href="/calendar" 
            icon={<Calendar size={20} />} 
            label="İş Programı" 
            active={pathname.startsWith("/calendar")} 
          />
          
          <NavGroup 
            icon={<Construction size={20} />} 
            label="EDAŞ"
            defaultOpen={pathname.startsWith("/edas")}
          >
            <NavItem 
              href="/edas/bedas" 
              icon={<FileText size={20} />} 
              label="BEDAŞ" 
              active={pathname.startsWith("/edas/bedas")} 
            />
            <NavItem 
              href="/edas/ayedas" 
              icon={<FileText size={20} />} 
              label="AYEDAŞ" 
              active={pathname.startsWith("/edas/ayedas")} 
            />
          </NavGroup>
          
          <NavItem 
            href="/reports" 
            icon={<BarChart4 size={20} />} 
            label="Raporlar" 
            active={pathname.startsWith("/reports")} 
          />
		   <NavGroup 
            icon={<Construction size={20} />} 
            label="Hesaplamalar"
            defaultOpen={pathname.startsWith("/edas")}
          >
            <NavItem 
              href="/gerilimdusumu" 
              icon={<FileText size={20} />} 
              label="Gerilim Düşümü" 
              active={pathname.startsWith("/gerilimdusumu")} 
            />
            <NavItem 
              href="/akimsigorta" 
              icon={<FileText size={20} />} 
              label="Akım ve Kablo Kesiti" 
              active={pathname.startsWith("/edas/tedas")} 
            />
          </NavGroup>
        </nav>
      </div>
      
      {/* Overlay Backdrop for mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}