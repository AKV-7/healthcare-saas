import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const response = await fetch(`${backendUrl}/api/appointments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Frontend API: Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch appointments' },
        { status: response.status }
      );
    }

    const appointments = await response.json();

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Frontend API: Fetch appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
