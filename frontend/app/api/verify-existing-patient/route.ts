import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const response = await fetch(
      `${backendUrl}/api/users/verify/${userId}?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'User not found. Please check your User ID.' },
          { status: 404 }
        );
      }

      const errorText = await response.text();
      console.error('Backend verification error:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error('Backend verification error - parsed:', errorData);
      } catch (parseError) {
        console.error('Backend verification error - could not parse:', parseError);
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
        id: result.data._id,
        email: result.data.email,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        phone: result.data.phone,
        dateOfBirth: result.data.dateOfBirth,
        gender: result.data.gender,
        role: result.data.role,
      },
      message: 'Patient verified successfully',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
