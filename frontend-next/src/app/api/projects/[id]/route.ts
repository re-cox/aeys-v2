import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises'; // For file system operations (deleting files)
import path from 'path'; // For constructing file paths

// GET a specific project by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: { // Include manager details
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        team: { // Include team members and their employee details
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        tasks: { // Include related tasks
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            assignees: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        files: { // Include related files
          orderBy: {
            uploadedAt: 'desc',
          },
          include: { // Optionally include who uploaded the file
            uploadedBy: {
              select: { id: true, name: true }
            }
          }
        },
        photos: { // Include related photos
          orderBy: {
            uploadedAt: 'desc',
          },
          include: { // Optionally include who uploaded the photo
            uploadedBy: {
              select: { id: true, name: true }
            }
          }
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, message: 'Proje bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error(`[API Project GET /${id}] Error:`, error);
    let errorMessage = 'Proje detayları getirilirken bir hata oluştu.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// PUT update a specific project by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await request.json();
    const { name, description, status, priority, startDate, endDate, actualEndDate, budget, progress, managerId, teamMembers } = body;

    // Basic validation
    if (!name) {
        return NextResponse.json({ success: false, message: 'Proje adı zorunludur.' }, { status: 400 });
    }

    // TODO: Add validation for managerId existence in Employee table
    // TODO: Add validation for teamMembers IDs existence in Employee table

    // Handle team members update (delete existing, create new ones)
    // This is a simple approach; more sophisticated logic might be needed for complex updates.
    const updateData: Prisma.ProjectUpdateInput = {
        name,
        description,
        status,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        actualEndDate: actualEndDate ? new Date(actualEndDate) : null,
        budget,
        progress: progress !== undefined ? parseInt(progress, 10) : undefined,
        managerId,
    };

    const updatedProject = await prisma.$transaction(async (tx) => {
        // 1. Update project base data
        const project = await tx.project.update({
            where: { id },
            data: updateData,
        });

        // 2. Update team members if provided
        if (teamMembers !== undefined) {
            // Delete existing team members for this project
            await tx.projectTeamMember.deleteMany({ where: { projectId: id } });

            // Add new team members if the array is not empty
            if (Array.isArray(teamMembers) && teamMembers.length > 0) {
                await tx.projectTeamMember.createMany({
                    data: teamMembers.map((member: { employeeId: string; role?: string }) => ({
                        projectId: id,
                        employeeId: member.employeeId,
                        role: member.role,
                    })),
                });
            }
        }

        // 3. Fetch the updated project with relations to return
        return tx.project.findUnique({
             where: { id },
             include: {
                 manager: true,
                 team: { include: { employee: true } },
                 tasks: true,
                 files: true,
                 photos: true,
             }
         });
    });

    return NextResponse.json({ success: true, data: updatedProject });

  } catch (error) {
    console.error(`[API Project PUT /${id}] Error:`, error);
     let errorMessage = 'Proje güncellenirken bir sunucu hatası oluştu.';
     let statusCode = 500;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
       if (error.code === 'P2002') { // Unique constraint violation
            errorMessage = `Bu isimde bir proje zaten mevcut: ${error.meta?.target}`;
            statusCode = 409; // Conflict
       } else if (error.code === 'P2003') { // Foreign key constraint failed
            errorMessage = 'Geçersiz yönetici veya ekip üyesi IDsi sağlandı.';
            statusCode = 400; // Bad Request
       } else if (error.code === 'P2025') { // Record to update not found
             errorMessage = 'Güncellenecek proje bulunamadı.';
             statusCode = 404; // Not Found
       } else {
             errorMessage = `Veritabanı hatası: ${error.message}`;
       }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: statusCode });
  }
}

// DELETE a specific project by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Optional: Before deleting the project, delete associated files/photos from storage
    const project = await prisma.project.findUnique({
        where: { id },
        include: { files: true, photos: true }
    });

    if (project) {
      // Delete files from filesystem
      for (const file of project.files) {
          try {
              const filePath = path.join(process.cwd(), 'public', file.path);
              await fs.unlink(filePath);
              console.log(`Deleted project file: ${filePath}`);
          } catch (fileError) {
              console.error(`Error deleting file ${file.path}:`, fileError);
              // Decide if you want to stop the process or just log the error
          }
      }
        // Delete photos from filesystem
      for (const photo of project.photos) {
          try {
              const photoPath = path.join(process.cwd(), 'public', photo.path);
              await fs.unlink(photoPath);
               console.log(`Deleted project photo: ${photoPath}`);
          } catch (photoError) {
              console.error(`Error deleting photo ${photo.path}:`, photoError);
          }
      }
    }

    // Delete the project (relations like team members, files, photos, tasks might be handled by cascade delete or set null based on schema)
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Proje başarıyla silindi.' });

  } catch (error) {
    console.error(`[API Project DELETE /${id}] Error:`, error);
    let errorMessage = 'Proje silinirken bir sunucu hatası oluştu.';
    let statusCode = 500;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === 'P2025') { // Record to delete not found
             errorMessage = 'Silinecek proje bulunamadı.';
             statusCode = 404;
         } else {
             errorMessage = `Veritabanı hatası: ${error.message}`;
         }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: statusCode });
  }
}

// PATCH endpoint to update project
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const projectId = params.id;
        const body = await request.json();
        const { name, description, status, priority, startDate, endDate, actualEndDate, budget, progress, managerId } = body;
        
        // Validation
        if (projectId === undefined) {
            return NextResponse.json({ success: false, message: 'Proje ID gereklidir.' }, { status: 400 });
        }
        
        // Check if project exists
        const existingProject = await prisma.project.findUnique({
            where: { id: projectId }
        });
        
        if (!existingProject) {
            return NextResponse.json({ success: false, message: 'Proje bulunamadı.' }, { status: 404 });
        }
        
        // Prepare data for update
        const updateData: Prisma.ProjectUpdateInput = {};
        
        // Only include fields that need to be updated
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (actualEndDate !== undefined) updateData.actualEndDate = actualEndDate ? new Date(actualEndDate) : null;
        if (budget !== undefined) updateData.budget = budget;
        if (progress !== undefined) updateData.progress = progress;
        
        // Handle managerId separately
        if (managerId !== undefined) {
            if (managerId) {
                // Check if employee exists
                const manager = await prisma.employee.findUnique({
                    where: { id: managerId }
                });
                
                if (!manager) {
                    return NextResponse.json({ 
                        success: false, 
                        message: `Geçersiz yönetici ID'si: ${managerId}. Bu ID'ye sahip çalışan bulunamadı.` 
                    }, { status: 400 });
                }
                
                updateData.manager = { connect: { id: managerId } };
            } else {
                // If managerId is empty string or null, disconnect the manager
                updateData.manager = { disconnect: true };
            }
        }
        
        // Update project
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
            include: {
                manager: true,
                team: {
                    include: {
                        employee: true
                    }
                }
            }
        });
        
        return NextResponse.json({ success: true, data: updatedProject });
    } catch (error) {
        console.error('[API Project Update] Error:', error);
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Unique constraint violation
                return NextResponse.json({ 
                    success: false, 
                    message: `Bu isimde bir proje zaten mevcut.` 
                }, { status: 409 });
            } else if (error.code === 'P2003') { // Foreign key constraint failed
                return NextResponse.json({ 
                    success: false, 
                    message: 'Geçersiz yönetici ID\'si sağlandı. Lütfen geçerli bir ID kullanın.' 
                }, { status: 400 });
            }
        }
        
        let errorMessage = 'Proje güncellenirken bir hata oluştu.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
} 