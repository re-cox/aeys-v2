import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AuthProvider } from '@/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <div className="md:ml-64">
          <Header />
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
} 