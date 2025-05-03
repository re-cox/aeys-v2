import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// POST endpoint to add team member to a project
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const projectId = params.id;
        const body = await request.json();
        const { employeeId, role } = body;
        
        // Validation
        if (!employeeId) {
            return NextResponse.json({ success: false, message: 'Çalışan ID\'si gereklidir.' }, { status: 400 });
        }
        
        // Check if project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });
        
        if (!project) {
            return NextResponse.json({ success: false, message: 'Proje bulunamadı.' }, { status: 404 });
        }
        
        // Check if employee exists
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });
        
        if (!employee) {
            return NextResponse.json({ 
                success: false, 
                message: `Geçersiz çalışan ID'si: ${employeeId}. Bu ID'ye sahip çalışan bulunamadı.` 
            }, { status: 400 });
        }
        
        // Check if employee is already a team member
        const existingTeamMember = await prisma.projectTeamMember.findFirst({
            where: {
                projectId,
                employeeId
            }
        });
        
        if (existingTeamMember) {
            return NextResponse.json({ 
                success: false, 
                message: 'Bu çalışan zaten proje ekibinde.' 
            }, { status: 409 });
        }
        
        // Add team member
        const teamMember = await prisma.projectTeamMember.create({
            data: {
                project: { connect: { id: projectId } },
                employee: { connect: { id: employeeId } },
                role: role || null
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profilePictureUrl: true
                    }
                }
            }
        });
        
        return NextResponse.json({ 
            success: true, 
            message: 'Ekip üyesi başarıyla eklendi.', 
            data: teamMember 
        });
    } catch (error) {
        console.error('[API Add Team Member] Error:', error);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Unique constraint violation
                return NextResponse.json({ 
                    success: false, 
                    message: 'Bu çalışan zaten proje ekibinde.' 
                }, { status: 409 });
            } else if (error.code === 'P2003') { // Foreign key constraint failed
                return NextResponse.json({ 
                    success: false, 
                    message: 'Geçersiz proje veya çalışan ID\'si sağlandı.' 
                }, { status: 400 });
            }
        }
        
        let errorMessage = 'Ekip üyesi eklenirken bir hata oluştu.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
} 