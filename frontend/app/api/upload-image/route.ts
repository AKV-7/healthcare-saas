import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images and PDFs are allowed.' }, { status: 400 });
    }

    // Forward to backend upload endpoint with timeout and error handling
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    console.log(`Attempting to upload ${file.name} to backend at ${backendUrl}/api/upload`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: backendFormData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend upload failed: ${response.status} - ${errorText}`);
        throw new Error(`Backend upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Upload successful: ${file.name} -> ${result.url}`);
      return NextResponse.json(result);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Upload timeout for file:', file.name);
        return NextResponse.json({ error: 'Upload timeout. Please try again.' }, { status: 408 });
      }
      
      console.error('Fetch error during upload:', fetchError);
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file. Please ensure the backend server is running and try again.',
      details: error.message 
    }, { status: 500 });
  }
}
