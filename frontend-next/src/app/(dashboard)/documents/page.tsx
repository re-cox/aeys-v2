'use client';

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import DocumentsPage from "./DocumentsPage";
import PageHeader from "@/components/layout/page-header";

export default function DocumentsPageContainer() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('[Documents] Oturumdaki kullanıcı:', user.firstName);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Yükleniyor...</p>
        </div>
                            </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Evrak Yönetimi"
        description="Tüm evrak ve dokümanlarınızı klasörler halinde yönetin"
      />
      <div className="container mx-auto px-4 py-6">
        <DocumentsPage />
      </div>
    </>
  );
}