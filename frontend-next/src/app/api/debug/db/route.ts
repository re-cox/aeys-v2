import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Database debug endpoint called');

    // Test database connection
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('Database connection test successful:', result);
    } catch (connectionError) {
      console.error('Database connection test failed:', connectionError);
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: connectionError instanceof Error ? connectionError.message : String(connectionError)
      }, { status: 500 });
    }

    // Check Employee table schema
    const employeeInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Employee'
    `;
    
    // Get count of employees
    const employeeCount = await prisma.employee.count();
    
    // Get sample employee (without password)
    let sampleEmployee = null;
    if (employeeCount > 0) {
      sampleEmployee = await prisma.employee.findFirst({
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          position: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      databaseConnected: true,
      employeeTableInfo: employeeInfo,
      employeeCount,
      sampleEmployee: sampleEmployee ? {
        ...sampleEmployee,
        note: 'This is a sample employee record (sensitive fields excluded)'
      } : null
    });
  } catch (error) {
    console.error('Database debug error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database debug failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 