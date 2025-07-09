import { NextRequest, NextResponse } from 'next/server';

import { fetchWithRetry } from '@/lib/utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Get auth token from request headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    // Use retry logic for fetching
    const response = await fetchWithRetry(
      `${backendUrl}/api/analytics/dashboard`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        cache: 'no-store'
      },
      3, // Max retries
      1000 // Initial delay in ms
    );

    if (!response.ok) {
      console.error('Frontend Analytics API: Backend error:', response.statusText);
      
      // Return fallback data if backend fails
      return NextResponse.json({
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalUsers: 0
      });
    }

    const analytics = await response.json();
    
    // Return the analytics data directly without wrapping it in a stats object
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Frontend Analytics API: Fetch analytics error:', error);
    
    // Return fallback data on error
    return NextResponse.json({
      totalAppointments: 0,
      pendingAppointments: 0,
      confirmedAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      totalUsers: 0
    });
  }
}
