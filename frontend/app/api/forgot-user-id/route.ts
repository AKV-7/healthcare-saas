import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    if (!email || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and phone number are required',
        },
        { status: 400 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/forgot-user-id`;
    console.log('Calling backend URL:', backendUrl);
    console.log('Request data:', { email, phone });

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        phone,
      }),
    });

    const result = await response.json();
    console.log('Backend response status:', response.status);
    console.log('Backend response:', result);

    if (!response.ok) {
      console.error('Backend error:', result);
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Forgot User ID API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}
