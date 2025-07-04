import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const response = await fetch(`${backendUrl}/api/analytics/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Frontend Analytics API: Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch dashboard analytics' },
        { status: response.status }
      );
    }

    const analytics = await response.json();

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Frontend Analytics API: Fetch analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
