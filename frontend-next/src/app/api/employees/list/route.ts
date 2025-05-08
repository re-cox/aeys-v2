import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Explicitly select only necessary and existing fields from Employee
    // and related User fields that likely exist.
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        userId: true, // Keep userId to link to User
        position: true,
        profilePictureUrl: true,
        // Include User data via the relation
        user: {
          select: {
            id: true,
            name: true, // Select name from User
            surname: true, // Select surname from User
            email: true, // Select email from User
            departmentId: true,
            Department: {
              select: {
                id: true,
                name: true
              }
            },
            Role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Format the data using the selected fields
    const formattedEmployees = employees.map((emp: any) => ({
      id: emp.id,
      name: emp.user?.name || '', // Use name from user relation
      surname: emp.user?.surname || '', // Use surname from user relation
      email: emp.user?.email || '', // Use email from user relation
      roleName: emp.user?.Role?.name || '',
      position: emp.position || '', // Use position directly from employee
      profilePictureUrl: emp.profilePictureUrl, // Use profilePictureUrl directly from employee
      departmentId: emp.user?.departmentId || null,
      departmentName: emp.user?.Department?.name || '',
    }));

    return NextResponse.json({ success: true, data: formattedEmployees });
  } catch (error) {
    console.error('[API Employee List] Error:', error);
    let errorMessage = 'Çalışan listesi alınırken bir hata oluştu.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 