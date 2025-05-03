"use client";

import { AnnualLeave, LeaveStatus } from "@/types/annual-leave";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Edit, Trash2, 
  CheckCircle, User, Building, CalendarX 
} from "lucide-react";
import { format, differenceInBusinessDays } from "date-fns";
import { tr } from "date-fns/locale";
import { deleteAnnualLeave } from "@/services/annualLeaveService";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

// formatDate yardımcı fonksiyonu
const formatDate = (dateString: string | Date) => {
  return format(new Date(dateString), "d MMMM yyyy", { locale: tr });
};

interface ApprovedLeavesProps {
  leaves: AnnualLeave[];
  onDelete: (id: string) => void;
}

export default function ApprovedLeaves({ leaves, onDelete }: ApprovedLeavesProps) {
  const router = useRouter();
  const processedLeaves = leaves.filter(leave => leave.status === LeaveStatus.APPROVED || leave.status === LeaveStatus.REJECTED);

  // İzin silme işlemi
  const handleDelete = async (id: string, userName: string) => {
    if (confirm(`${userName} isimli personelin izin kaydını silmek istediğinize emin misiniz?`)) {
      onDelete(id);
    }
  };

  if (processedLeaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500 dark:text-gray-400">
        <CheckCircle className="h-12 w-12 mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-1">İşlenmiş İzin Bulunamadı</h3>
        <p className="text-center mb-6">Şu anda onaylanmış veya reddedilmiş bir izin talebi bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {processedLeaves.map((leave) => (
        <Card key={leave.id} className={`overflow-hidden hover:shadow-md transition-shadow border-l-4 ${leave.status === LeaveStatus.APPROVED ? 'border-l-green-400' : 'border-l-red-400'}`}>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="font-medium flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  {leave.user?.name} {leave.user?.surname}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                  <User className="h-3 w-3 mr-2" />
                  ID: {leave.userId}
                </p>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium 
                  ${leave.status === LeaveStatus.APPROVED 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {leave.status === LeaveStatus.APPROVED ? <CheckCircle className="h-3 w-3" /> : <CalendarX className="h-3 w-3" />}
                  {leave.status === LeaveStatus.APPROVED ? 'Onaylandı' : 'Reddedildi'}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-3">
                <div className="flex items-center text-sm mb-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">İzin Tarihleri:</span>
                </div>
                <p className="text-sm ml-6">
                  {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  <span className="ml-2 text-gray-500">
                    ({differenceInBusinessDays(new Date(leave.endDate), new Date(leave.startDate)) + 1} gün)
                  </span>
                </p>
              </div>
              
              {leave.reason && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Sebep:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {leave.reason}
                  </p>
                </div>
              )}
              
              <div className="mt-4 flex justify-end space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  onClick={() => handleDelete(leave.id, `${leave.user?.name} ${leave.user?.surname}`)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Sil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 