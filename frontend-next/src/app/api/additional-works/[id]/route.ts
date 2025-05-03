import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify JWT token
async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      employeeId: string; 
      email: string; 
      name: string; 
      role: string; 
    };
    
    return {
      id: decoded.employeeId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
  } catch (error) {
    console.error('[Auth] Token verification error:', error);
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[AdditionalWork API] GET request for ID: ${params.id}`);
    
    // Try to get next-auth session
    const session = await getServerSession(authOptions);
    
    // Try to verify JWT token if no next-auth session
    const tokenUser = session ? null : await verifyToken(req);
    
    if (!session && !tokenUser) {
      console.log('[AdditionalWork API] Unauthorized access attempt');
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    const user = session?.user || tokenUser;
    console.log(`[AdditionalWork API] Authorized user: ${user?.email}`);

    const id = params.id;

    console.log(`[AdditionalWork API] Querying database for work with ID: ${id}`);
    const additionalWork = await prisma.additionalWork.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            surname: true,
            phoneNumber: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        }
      },
    });

    if (!additionalWork) {
      console.log(`[AdditionalWork API] Work with ID ${id} not found`);
      return new NextResponse(JSON.stringify({ error: "Additional work not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    console.log(`[AdditionalWork API] Successfully retrieved work with ID: ${id}`);
    return NextResponse.json({
      success: true,
      data: additionalWork
    });
  } catch (error) {
    console.error(`[AdditionalWork API] Error in GET /api/additional-works/${params.id}:`, error);
    
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error("[AdditionalWork API] Error name:", error.name);
      console.error("[AdditionalWork API] Error message:", error.message);
      console.error("[AdditionalWork API] Error stack:", error.stack);
    }
    
    return new NextResponse(JSON.stringify({ 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[AdditionalWork API] PUT request for ID: ${params.id}`);
    
    // Try to get next-auth session
    const session = await getServerSession(authOptions);
    
    // Try to verify JWT token if no next-auth session
    const tokenUser = session ? null : await verifyToken(req);
    
    if (!session && !tokenUser) {
      console.log('[AdditionalWork API] Unauthorized access attempt');
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    const user = session?.user || tokenUser;
    console.log(`[AdditionalWork API] Authorized user: ${user?.email}`);

    const id = params.id;
    const body = await req.json();
    
    console.log(`[AdditionalWork API] Checking if work with ID ${id} exists`);
    // Check if the additional work exists
    const existingWork = await prisma.additionalWork.findUnique({
      where: { id },
    });

    if (!existingWork) {
      console.log(`[AdditionalWork API] Work with ID ${id} not found`);
      return new NextResponse(JSON.stringify({ error: "Additional work not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Validate required fields
    const { title, status, priority, startDate } = body;
    
    if (!title) {
      return new NextResponse(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    if (!status) {
      return new NextResponse(JSON.stringify({ error: "Status is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    if (!priority) {
      return new NextResponse(JSON.stringify({ error: "Priority is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    if (!startDate) {
      return new NextResponse(JSON.stringify({ error: "Start date is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    console.log(`[AdditionalWork API] Updating work with ID: ${id}`, { status });
    // Update the additional work
    const updatedWork = await prisma.additionalWork.update({
      where: { id },
      data: {
        title,
        technicianNumber: body.technicianNumber,
        description: body.description,
        status,
        priority,
        startDate: new Date(startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        assignedTo: {
          disconnect: existingWork.assignedToIds
            ? existingWork.assignedToIds.map((id: string) => ({ id }))
            : [],
          connect: body.assignedToIds
            ? body.assignedToIds.map((id: string) => ({ id }))
            : [],
        },
        files: {
          deleteMany: {},
          create: body.files
            ? body.files.map((fileData: {fileName: string, fileUrl: string, fileType: string, fileSize: number}) => ({
                fileName: fileData.fileName,
                fileUrl: fileData.fileUrl,
                fileType: fileData.fileType,
                fileSize: fileData.fileSize,
              }))
            : [],
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            surname: true,
            phoneNumber: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    console.log(`[AdditionalWork API] Successfully updated work with ID: ${id}`);
    return NextResponse.json(updatedWork);
  } catch (error) {
    console.error(`[AdditionalWork API] Error in PUT /api/additional-works/${params.id}:`, error);
    
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error("[AdditionalWork API] Error name:", error.name);
      console.error("[AdditionalWork API] Error message:", error.message);
      console.error("[AdditionalWork API] Error stack:", error.stack);
    }
    
    return new NextResponse(JSON.stringify({ 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[AdditionalWork API] DELETE request for ID: ${params.id}`);
    
    // Try to get next-auth session
    const session = await getServerSession(authOptions);
    
    // Try to verify JWT token if no next-auth session
    const tokenUser = session ? null : await verifyToken(req);
    
    if (!session && !tokenUser) {
      console.log('[AdditionalWork API] Unauthorized access attempt');
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    const user = session?.user || tokenUser;
    console.log(`[AdditionalWork API] Authorized user: ${user?.email}`);

    const id = params.id;

    console.log(`[AdditionalWork API] Checking if work with ID ${id} exists`);
    // Check if the additional work exists
    const existingWork = await prisma.additionalWork.findUnique({
      where: { id },
    });

    if (!existingWork) {
      console.log(`[AdditionalWork API] Work with ID ${id} not found`);
      return new NextResponse(JSON.stringify({ error: "Additional work not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    console.log(`[AdditionalWork API] Deleting work with ID: ${id}`);
    // Delete the additional work
    await prisma.additionalWork.delete({
      where: { id },
    });

    console.log(`[AdditionalWork API] Successfully deleted work with ID: ${id}`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[AdditionalWork API] Error in DELETE /api/additional-works/${params.id}:`, error);
    
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error("[AdditionalWork API] Error name:", error.name);
      console.error("[AdditionalWork API] Error message:", error.message);
      console.error("[AdditionalWork API] Error stack:", error.stack);
    }
    
    return new NextResponse(JSON.stringify({ 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
} 