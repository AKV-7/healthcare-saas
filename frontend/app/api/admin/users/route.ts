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
      `${backendUrl}/api/users`,
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
      console.error('Frontend Admin Users API: Backend error:', response.statusText);
      
      // Return empty data array rather than error to prevent UI breakage
      return NextResponse.json({ 
        data: [],
        message: 'Failed to fetch users',
        status: response.status
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Frontend Admin Users API: Fetch error:', error);
    // Return empty data array rather than error
    return NextResponse.json({ data: [], error: 'Internal server error' });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Get the admin token from the request headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    // Use retry logic for fetching
    const response = await fetchWithRetry(
      `${backendUrl}/api/users/${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      },
      3, // Max retries
      1000 // Initial delay in ms
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (response.status === 403) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to delete user' }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
