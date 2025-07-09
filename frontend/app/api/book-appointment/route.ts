import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/appointments/book`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: data.message || 'Failed to book appointment' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error in book-appointment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
