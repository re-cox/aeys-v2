const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmployeeModel() {
  try {
    // Get the first employee to check the model structure
    const employee = await prisma.employee.findFirst({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        password: true,
        passwordHash: true // Check if this field exists
      }
    });
    
    console.log('Employee model structure:', employee);
    
    // Get database schema for employee table
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Employee' OR table_name = 'employee'`;
    
    console.log('Database schema for Employee table:', schema);
    
  } catch (error) {
    console.error('Error checking employee model:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeModel(); 