import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

// POST endpoint to upload a photo to a project
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const projectId = params.id;
        
        // Check if project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });
        
        if (!project) {
            return NextResponse.json({ success: false, message: 'Proje bulunamadı.' }, { status: 404 });
        }
        
        const formData = await request.formData();
        const photo = formData.get('photo') as File;
        const caption = formData.get('caption') as string | null;
        
        if (!photo) {
            return NextResponse.json({ success: false, message: 'Fotoğraf bulunamadı.' }, { status: 400 });
        }
        
        // Check if file is an image
        if (!photo.type.startsWith('image/')) {
            return NextResponse.json({ 
                success: false, 
                message: 'Yüklenen dosya bir görsel formatında olmalıdır.' 
            }, { status: 400 });
        }
        
        // Get file details
        const originalName = photo.name;
        const photoBytes = await photo.arrayBuffer();
        const buffer = Buffer.from(photoBytes);
        
        // Create a safe filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const safeName = `${timestamp}-${randomString}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        // Create directory path
        const dirPath = join(process.cwd(), 'public', 'uploads', 'projects', projectId, 'photos');
        const filePath = join(dirPath, safeName);
        const relativePath = `uploads/projects/${projectId}/photos/${safeName}`;
        
        // Create directory if it doesn't exist
        if (!existsSync(dirname(filePath))) {
            await mkdir(dirname(filePath), { recursive: true });
        }
        
        // Write file to disk
        await writeFile(filePath, buffer);
        
        // Save photo info to database with fileName field
        const projectPhoto = await prisma.projectPhoto.create({
            data: {
                originalName,
                fileName: safeName,
                path: relativePath,
                caption,
                uploadedAt: new Date(),
                project: { connect: { id: projectId } },
                // Optional: Connect to user who uploaded the photo
                // uploadedBy: { connect: { id: userId } }
            }
        });
        
        return NextResponse.json({ 
            success: true, 
            message: 'Fotoğraf başarıyla yüklendi.', 
            data: projectPhoto 
        });
    } catch (error) {
        console.error('[API Upload Project Photo] Error:', error);
        
        let errorMessage = 'Fotoğraf yüklenirken bir hata oluştu.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
} 