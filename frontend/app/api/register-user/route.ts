import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, age, gender, address } = body;

    // Validation (address is optional)
    if (!name || !email || !phone || !age || !gender) {
      return NextResponse.json(
        { success: false, message: 'Name, email, phone, age, and gender are required' },
        { status: 400 }
      );
    }

    // Validate age
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid age between 1 and 120 years' },
        { status: 400 }
      );
    }

    // Forward to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
    
    if (!backendUrl) {
      console.error('Backend URL not configured');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        age: ageNum,
        gender,
        address: address ? address.trim() : undefined, // Include address if provided
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Registration successful',
        data: result.data
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Registration failed' },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
