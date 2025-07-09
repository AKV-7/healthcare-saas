import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check backend connectivity
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    let backendStatus = 'unknown';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      backendStatus = response.ok ? 'connected' : 'error';
    } catch (error) {
      backendStatus = 'disconnected';
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      frontend: 'running',
      backend: backendStatus,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      features: {
        registration: 'enabled',
        existingPatientVerification: 'enabled',
        appointmentBooking: 'enabled',
        appointmentStatus: 'enabled',
        adminAccess: 'enabled'
      },
      config: {
        backendUrl,
        adminPasskeyConfigured: !!process.env.NEXT_PUBLIC_ADMIN_PASSKEY
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
