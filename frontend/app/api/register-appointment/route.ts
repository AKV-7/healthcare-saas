import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, appointment } = body;

    // Validate required fields
    if (!user || !appointment) {
      return NextResponse.json(
        { error: 'User and appointment data are required' },
        { status: 400 }
      );
    }

    // Validate user data
    if (!user.firstName || !user.lastName || !user.email || !user.phone) {
      return NextResponse.json({ error: 'Missing required user fields' }, { status: 400 });
    }

    // Validate appointment data
    if (
      !appointment.appointmentDate ||
      !appointment.appointmentTime ||
      !appointment.appointmentType ||
      !appointment.reason
    ) {
      return NextResponse.json({ error: 'Missing required appointment fields' }, { status: 400 });
    }

    // Send data to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const response = await fetch(`${backendUrl}/api/register-appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user, appointment }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to register appointment' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Register appointment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
