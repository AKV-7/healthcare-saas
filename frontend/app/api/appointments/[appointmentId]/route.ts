import { NextRequest, NextResponse } from 'next/server';

import { fetchWithRetry } from '@/lib/utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { appointmentId: string } }) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const appointmentId = params.appointmentId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const response = await fetch(
      `${backendUrl}/api/appointments/public/${appointmentId}?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }
      if (response.status === 403) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const appointment = await response.json();
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const { appointmentId } = params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Get auth token from request headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    // Parse request body
    const data = await request.json();
    
    // Use retry logic for fetching
    const response = await fetchWithRetry(
      `${backendUrl}/api/appointments/admin/${appointmentId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          status: data.status,
          notes: data.notes,
          // The backend already handles email notifications when status or date/time changes
        })
      },
      3, // Max retries
      1000 // Initial delay in ms
    );

    if (!response.ok) {
      console.error('Frontend Appointment Update API: Backend error:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      ...result,
      message: 'Appointment updated successfully. Email notification sent to patient.'
    });
  } catch (error) {
    console.error('Frontend Appointment Update API: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const { appointmentId } = params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Get auth token from request headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    // Use retry logic for fetching
    const response = await fetchWithRetry(
      `${backendUrl}/api/appointments/admin/${appointmentId}`,
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
      console.error('Frontend Appointment Delete API: Backend error:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to delete appointment' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Frontend Appointment Delete API: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
