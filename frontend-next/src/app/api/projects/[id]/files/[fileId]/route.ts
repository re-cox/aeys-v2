import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// DELETE endpoint to remove a file from a project
export async function DELETE(
    request: Request, 
    { params }: { params: { id: string; fileId: string } }
) {
    try {
        const { id: projectId, fileId } = params;
        
        // Check if project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });
        
        if (!project) {
            return NextResponse.json({ 
                success: false, 
                message: 'Proje bulunamadı.' 
            }, { status: 404 });
        }
        
        // Check if file exists
        const file = await prisma.projectFile.findUnique({
            where: { id: fileId }
        });
        
        if (!file) {
            return NextResponse.json({ 
                success: false, 
                message: 'Dosya bulunamadı.' 
            }, { status: 404 });
        }
        
        // Verify that the file belongs to the specified project
        if (file.projectId !== projectId) {
            return NextResponse.json({ 
                success: false, 
                message: 'Dosya bu projeye ait değil.' 
            }, { status: 400 });
        }
        
        // Delete file from filesystem
        const filePath = join(process.cwd(), 'public', file.path);
        if (existsSync(filePath)) {
            await unlink(filePath);
        }
        
        // Delete file from database
        await prisma.projectFile.delete({
            where: { id: fileId }
        });
        
        return NextResponse.json({ 
            success: true, 
            message: 'Dosya başarıyla silindi.' 
        });
    } catch (error) {
        console.error('[API Delete Project File] Error:', error);
        
        let errorMessage = 'Dosya silinirken bir hata oluştu.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
} 