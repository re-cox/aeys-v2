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
        Department: true,
        Customer: true,
        Site: true,
        tasks: { 
          orderBy: {
            createdAt: 'desc',
          },
        },
        // Select fields based on the updated Prisma schema
        Document: {
          select: {
            id: true,
            name: true,         // Use 'name' instead of 'title'
            description: true,
            fileUrl: true,
            mimeType: true,     // Use 'mimeType' instead of 'fileType'
            size: true,         // Use 'size' instead of 'fileSize'
            // version: true,    // Removed from schema
            projectId: true,
            customerId: true,
            createdById: true,  // Use 'createdById' instead of 'uploadedById'
            createdAt: true,
            updatedAt: true,
            // uploadedBy: { select: { id: true, name: true } } // Select user if needed
          }
        },
        // Explicitly select fields for TeknisyenRapor
        TeknisyenRapor: {
          select: {
            id: true,
            baslik: true,
            durum: true,
            tarih: true,
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
    const { name, description, status, startDate, endDate, budget, departmentId, customerId, siteId } = body;

    // Basic validation
    if (!name) {
        return NextResponse.json({ success: false, message: 'Proje adı zorunludur.' }, { status: 400 });
    }
    if (!departmentId) {
        // Department is mandatory based on schema
        return NextResponse.json({ success: false, message: 'Departman zorunludur.' }, { status: 400 });
    }

    // Update project data
    const updateData: Prisma.ProjectUpdateInput = {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        budget,
        // Connect relations only if valid IDs are provided
        Department: { connect: { id: departmentId } }, // Department is mandatory
    };

    if (customerId) {
      updateData.Customer = { connect: { id: customerId } };
    }
    if (siteId) {
      updateData.Site = { connect: { id: siteId } };
    }

    const updatedProject = await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
            Department: true,
            Customer: true,
            Site: true,
            tasks: true,
            // Select fields based on the updated Prisma schema
            Document: {
              select: {
                id: true,
                name: true,         // Use 'name' instead of 'title'
                description: true,
                fileUrl: true,
                mimeType: true,     // Use 'mimeType' instead of 'fileType'
                size: true,         // Use 'size' instead of 'fileSize'
                // version: true,    // Removed from schema
                projectId: true,
                customerId: true,
                createdById: true,  // Use 'createdById' instead of 'uploadedById'
                createdAt: true,
                updatedAt: true,
              }
            },
             // Explicitly select fields for TeknisyenRapor in update response (if needed)
             TeknisyenRapor: {
                select: {
                  id: true,
                  baslik: true,
                  durum: true,
                  tarih: true,
                }
            },
        },
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
            errorMessage = 'Geçersiz bölüm, müşteri veya site bilgisi.';
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
    // Consider cascading deletes in Prisma schema instead of manual deletion
    // await prisma.document.deleteMany({ where: { projectId: id } });
    // await prisma.teknisyenRapor.deleteMany({ where: { projeId: id } }); // Also TeknisyenRapor if needed
    // await prisma.task.deleteMany({ where: { projectId: id } }); // Also Tasks

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
             // Handle other potential errors like foreign key constraints if cascade delete is not set up
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
        const { name, description, status, startDate, endDate, budget, departmentId, customerId, siteId } = body;
        
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
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : undefined;
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : undefined;
        if (budget !== undefined) updateData.budget = budget;
        
        // Handle relations: Only connect if a valid ID is provided
        if (departmentId) {
            updateData.Department = { connect: { id: departmentId } };
        } // If departmentId is null/undefined/empty, do nothing (don't update)
        
        if (customerId) {
             updateData.Customer = { connect: { id: customerId } };
        } // If customerId is null/undefined/empty, do nothing
        
        if (siteId) {
            updateData.Site = { connect: { id: siteId } };
        } // If siteId is null/undefined/empty, do nothing
        
        // Update project only if there is data to update
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: true, message: 'Güncellenecek veri yok.', data: existingProject });
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
            include: {
                Department: true,
                Customer: true,
                Site: true,
                tasks: true,
                // Select fields based on the updated Prisma schema
                Document: {
                  select: {
                    id: true,
                    name: true,         // Use 'name' instead of 'title'
                    description: true,
                    fileUrl: true,
                    mimeType: true,     // Use 'mimeType' instead of 'fileType'
                    size: true,         // Use 'size' instead of 'fileSize'
                    // version: true,    // Removed from schema
                    projectId: true,
                    customerId: true,
                    createdById: true,  // Use 'createdById' instead of 'uploadedById'
                    createdAt: true,
                    updatedAt: true,
                  }
                },
                 // Explicitly select fields for TeknisyenRapor in update response
                 TeknisyenRapor: {
                    select: {
                      id: true,
                      baslik: true,
                      durum: true,
                      tarih: true,
                    }
                },
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
                    message: 'Geçersiz ilişki bilgisi. Lütfen geçerli ID değerleri kullanın.' 
                }, { status: 400 });
            } else if (error.code === 'P2025') { // Record to update not found
                 return NextResponse.json({ success: false, message: 'Güncellenecek proje bulunamadı.' }, { status: 404 });
            }
        }
        
        let errorMessage = 'Proje güncellenirken bir hata oluştu.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}