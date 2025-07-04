import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// This would be stored securely in environment variables or a database
const ADMIN_PASSKEY = 'admin123'; // Never hardcode passwords in production

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passkey } = body;
    
    // Verify the passkey
    if (passkey === ADMIN_PASSKEY) {
      // Set a cookie to maintain admin session
      // In production, use a more secure method like JWT
      const cookieStore = cookies();
      cookieStore.set('admin_token', 'admin_session_token_would_be_here', { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600, // 1 hour
        path: '/'
      });
      
      return NextResponse.json({
        success: true,
        message: 'Admin verification successful'
      });
    }
    
    // Incorrect passkey
    return NextResponse.json({
      success: false,
      message: 'Invalid passkey'
    }, { status: 401 });
    
  } catch (error) {
    console.error('Error verifying admin:', error);
    return NextResponse.json({
      success: false,
      message: 'Admin verification error'
    }, { status: 500 });
  }
}
