import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProjectFinancialSummary } from '@/types/progressPayment';
import { DollarSign, TrendingUp, Wallet, BarChart4 } from 'lucide-react';

interface FinancialSummaryCardsProps {
  summary: ProjectFinancialSummary;
}

export function FinancialSummaryCards({ summary }: FinancialSummaryCardsProps) {
  // Para formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
      .format(amount)
      .replace('₺', '') + ' ₺';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Toplam Talep Edilen */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Toplam Talep Edilen</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(summary.totalRequestedAmount)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toplam Onaylanan */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Toplam Onaylanan</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(summary.totalApprovedAmount)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toplam Ödenen */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Toplam Ödenen</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(summary.totalPaidAmount)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kalan Bakiye */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Kalan Bakiye</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(summary.remainingBalance)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <BarChart4 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>İlerleme</span>
              <span>{Math.round(summary.completionPercentage)}%</span>
            </div>
            <Progress value={summary.completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}