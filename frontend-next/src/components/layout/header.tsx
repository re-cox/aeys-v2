"use client";

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  Menu, 
  Sun, 
  Moon,
  Laptop // Sistem teması ikonu
} from "lucide-react";
import { useTheme } from "next-themes"; // useTheme hook'unu import et
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'; // Dropdown menü bileşenlerini import et
import { Skeleton } from '@/components/ui/skeleton';

export function Header() {
  const { setTheme } = useTheme(); // useTheme hook'unu kullan
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleAccountClick = () => {
    router.push('/hesabim');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex md:hidden w-8"></div>
      <div className="flex-1 md:ml-64"></div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell size={20} />
        </Button>
        
        {/* Tema Değiştirme Dropdown Menüsü */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Temayı değiştir</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Açık</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Koyu</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>Sistem</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="relative flex items-center gap-2">
           {isLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-24 hidden md:block" />
            </div>
           ) : user ? (
             <>
               <Button 
                 variant="ghost"
                 className="flex items-center gap-2 rounded-full p-2 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                 onClick={handleAccountClick}
               >
                 {user.profileImage ? (
                   <img src={user.profileImage} alt="Profil" className="h-6 w-6 rounded-full object-cover"/>
                 ) : (
                   <User size={20} />
                 )}
                 <span className="hidden md:inline-block text-sm font-medium">
                   {user.firstName} {user.lastName || ''}
                 </span>
               </Button>
               <Button 
                 variant="ghost"
                 size="icon"
                 className="rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                 onClick={logout}
                 title="Çıkış Yap"
               >
                 <LogOut size={18} />
               </Button>
             </>
           ) : (
             <Link href="/login">
               <Button variant="outline">Giriş Yap</Button>
             </Link>
           )}
        </div>
      </div>
    </header>
  );
} 