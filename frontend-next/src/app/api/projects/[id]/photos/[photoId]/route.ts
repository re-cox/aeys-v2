import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// DELETE endpoint to remove a photo from a project
export async function DELETE(
    request: Request, 
    { params }: { params: { id: string; photoId: string } }
) {
    try {
        const { id: projectId, photoId } = params;
        
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
        
        // Check if photo exists
        const photo = await prisma.projectPhoto.findUnique({
            where: { id: photoId }
        });
        
        if (!photo) {
            return NextResponse.json({ 
                success: false, 
                message: 'Fotoğraf bulunamadı.' 
            }, { status: 404 });
        }
        
        // Verify that the photo belongs to the specified project
        if (photo.projectId !== projectId) {
            return NextResponse.json({ 
                success: false, 
                message: 'Fotoğraf bu projeye ait değil.' 
            }, { status: 400 });
        }
        
        // Delete photo from filesystem
        const photoPath = join(process.cwd(), 'public', photo.path);
        if (existsSync(photoPath)) {
            await unlink(photoPath);
        }
        
        // Delete photo from database
        await prisma.projectPhoto.delete({
            where: { id: photoId }
        });
        
        return NextResponse.json({ 
            success: true, 
            message: 'Fotoğraf başarıyla silindi.' 
        });
    } catch (error) {
        console.error('[API Delete Project Photo] Error:', error);
        
        let errorMessage = 'Fotoğraf silinirken bir hata oluştu.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
} 