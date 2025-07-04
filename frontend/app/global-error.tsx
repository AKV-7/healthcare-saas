'use client';

import NextError from 'next/error';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  // Log the error to console during development
  console.error('Unhandled error:', error);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
