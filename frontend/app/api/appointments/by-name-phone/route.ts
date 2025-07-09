import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!/^\+91[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid Indian mobile number with +91' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const response = await fetch(
      `${backendUrl}/api/appointments/by-name-phone?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'No appointments found for the provided name and phone number' },
          { status: 404 }
        );
      }

      const errorText = await response.text();
      console.error('Backend appointments error:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (parseError) {
        errorData = { message: errorText };
      }

      return NextResponse.json(
        { success: false, error: errorData.message || 'Failed to fetch appointments' },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      appointments: result.data || [],
      message: 'Appointments retrieved successfully',
    });
  } catch (error) {
    console.error('Appointments API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
