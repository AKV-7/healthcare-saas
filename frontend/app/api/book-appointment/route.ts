import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Restructure the payload for the backend
    const payload = {
      user: {
        userId: body.userId,
        name: body.patientName,
        email: body.patientEmail,
        phone: body.patientPhone,
        ...body.userData, // include any extra user fields if present
      },
      appointment: {
        appointmentDate: body.appointmentDate,
        appointmentTime: body.appointmentTime,
        doctor: body.doctor, // FIXED: send doctor
        appointmentType: body.appointmentType,
        symptoms: body.symptoms, // FIXED: send symptoms
        additionalNotes: body.additionalNotes,
        attachments: body.attachments,
        patientName: body.patientName,
        patientEmail: body.patientEmail,
        patientPhone: body.patientPhone,
      },
    };

    const response = await fetch(
      `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/appointments/register-appointment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
