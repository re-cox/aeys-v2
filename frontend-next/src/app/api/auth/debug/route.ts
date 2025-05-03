import { NextRequest, NextResponse } from 'next/server';
import { verify, Secret } from 'jsonwebtoken';
import { JWT_SECRET, decodeToken } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Log header details
    console.log('Auth headers debug:');
    console.log('Raw Authorization header:', authHeader);
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        message: 'No authorization header found',
        headers: Object.fromEntries(req.headers.entries())
      });
    }
    
    // Check header format
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid authorization header format',
        header: authHeader
      });
    }
    
    // Extract token
    const token = authHeader.substring(7);
    console.log('Token extracted:', token.substring(0, 20) + '...');
    
    try {
      // Attempt to decode without verification first
      const decoded = decodeToken(token);
      
      if (!decoded) {
        return NextResponse.json({
          success: false,
          message: 'Invalid token format - could not decode'
        });
      }
      
      console.log('Token payload (decoded without verification):', decoded);
      
      // Now verify
      try {
        const verified = verify(token, JWT_SECRET as Secret);
        console.log('Token successfully verified:', verified);
        
        return NextResponse.json({
          success: true,
          message: 'Token is valid',
          decoded: verified
        });
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
        
        return NextResponse.json({
          success: false,
          message: 'Token verification failed',
          error: (verifyError as Error).message,
          decoded
        });
      }
    } catch (decodeError) {
      console.error('Token decoding failed:', decodeError);
      
      return NextResponse.json({
        success: false,
        message: 'Invalid token format - could not decode',
        error: (decodeError as Error).message
      });
    }
  } catch (error) {
    console.error('Debug endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error in debug endpoint',
      error: (error as Error).message
    });
  }
} 