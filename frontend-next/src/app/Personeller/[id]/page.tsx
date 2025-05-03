import React from 'react';
import EmployeeDetail from '@/components/Employees/EmployeeDetail';
import { Metadata, ResolvingMetadata } from 'next';
import { getEmployeeById } from '@/services/employeeService';

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Personel bilgilerini alarak meta verileri oluştur
  const employeeId = params.id;
  const employee = await getEmployeeById(employeeId);

  return {
    title: employee ? `${employee.firstName} ${employee.lastName} - Personel Detayı` : 'Personel Bulunamadı',
  };
}

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  // Personel detay sayfasına personel ID'sini iletiyoruz
  return <EmployeeDetail employeeId={params.id} />;
} 