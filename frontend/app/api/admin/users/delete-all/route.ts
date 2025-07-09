import { NextRequest, NextResponse } from 'next/server';

import { fetchWithRetry } from '@/lib/utils';

export async function DELETE(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Get auth token from request headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    // Get admin passkey from request body
    const body = await request.json();
    const { adminPasskey } = body;
    
    if (!adminPasskey) {
      return NextResponse.json({ message: 'Admin passkey is required' }, { status: 400 });
    }

    // Use retry logic for fetching
    const response = await fetchWithRetry(
      `${backendUrl}/api/users/delete-all`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ adminPasskey }),
        cache: 'no-store'
      },
      3, // Max retries
      1000 // Initial delay in ms
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        message: errorData.message || 'Failed to delete users' 
      }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Frontend API: Error deleting all users:', error);
    return NextResponse.json({ 
      message: 'An error occurred while deleting users' 
    }, { status: 500 });
  }
} 