import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const response = await fetch(
      `${backendUrl}/api/users/verify-by-name-phone`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone }),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Patient not found. Please check your name and phone number or register as a new patient.' },
          { status: 404 }
        );
      }

      const errorText = await response.text();
      console.error('Backend verification error:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (parseError) {
        errorData = { message: errorText };
      }

      return NextResponse.json(
        { error: errorData.message || 'Failed to verify patient' },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      user: {
        userId: result.data.userId,
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        age: result.data.age,
        gender: result.data.gender,
      },
      message: 'Patient verified successfully',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
