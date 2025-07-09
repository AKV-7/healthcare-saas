import { NextRequest, NextResponse } from 'next/server';

import { fetchWithRetry } from '@/lib/utils';

export async function DELETE(req: NextRequest) {
  try {
    // Forward the Authorization header and body from the incoming request
    const authHeader = req.headers.get('authorization');
    const body = await req.text();
    // Use the correct backend endpoint
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