import { NextRequest, NextResponse } from 'next/server';

import { fetchWithRetry } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    // Get the Authorization header from the incoming request
    const authHeader = req.headers.get('authorization');
    // Forward page and limit query params
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/admin?page=${page}&limit=${limit}`;
    const response = await fetchWithRetry(
      backendUrl,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const authHeader = request.headers.get('authorization');
    const body = await request.text();
    const response = await fetch(`${backendUrl}/api/appointments/admin`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Forward the Authorization header and body from the incoming request
    const authHeader = req.headers.get('authorization');
    const body = await req.text();
    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/delete-all`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body,
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to delete all appointments' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'All appointments deleted successfully' });
  } catch (error) {
    console.error('Error deleting all appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
