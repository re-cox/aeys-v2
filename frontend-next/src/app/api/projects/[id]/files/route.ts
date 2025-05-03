import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

// POST endpoint to upload a file to a project
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
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ success: false, message: 'Dosya bulunamadı.' }, { status: 400 });
        }
        
        // Get file details
        const originalName = file.name;
        const fileType = file.type;
        const size = file.size;
        const fileBytes = await file.arrayBuffer();
        const buffer = Buffer.from(fileBytes);
        
        // Create a safe filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const safeName = `${timestamp}-${randomString}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        // Create directory path
        const dirPath = join(process.cwd(), 'public', 'uploads', 'projects', projectId, 'files');
        const filePath = join(dirPath, safeName);
        const relativePath = `uploads/projects/${projectId}/files/${safeName}`;
        
        // Create directory if it doesn't exist
        if (!existsSync(dirname(filePath))) {
            await mkdir(dirname(filePath), { recursive: true });
        }
        
        // Write file to disk
        await writeFile(filePath, buffer);
        
        // Save file info to database with fileName field
        const projectFile = await prisma.projectFile.create({
            data: {
                originalName,
                fileName: safeName,
                fileType,
                size,
                path: relativePath,
                uploadedAt: new Date(),
                project: { connect: { id: projectId } },
                // Optional: Connect to user who uploaded the file
                // uploadedBy: { connect: { id: userId } }
            }
        });
        
        return NextResponse.json({ 
            success: true, 
            message: 'Dosya başarıyla yüklendi.', 
            data: projectFile 
        });
    } catch (error) {
        console.error('[API Upload Project File] Error:', error);
        
        let errorMessage = 'Dosya yüklenirken bir hata oluştu.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
} 