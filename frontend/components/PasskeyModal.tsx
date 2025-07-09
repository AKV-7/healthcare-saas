'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ICONS } from '@/constants/cloudinary-assets';

export const PasskeyModal = () => {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/validate', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isAdmin) {
          setOpen(false);
          router.push('/admin');
        } else if (path?.includes('/admin')) {
          setOpen(true);
        }
      } else if (path?.includes('/admin')) {
        setOpen(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (path?.includes('/admin')) {
        setOpen(true);
      }
    }
  }, [path, router]);

  useEffect(() => {
    if (path?.includes('/admin')) {
      checkAuthStatus();
    }
  }, [path, checkAuthStatus]);

  const closeModal = () => {
    setOpen(false);
    router.push('/');
  };

  const validatePasskey = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    if (!passkey || passkey.length !== 6) {
      setError('Please enter a valid 6-digit passkey.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ passkey }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOpen(false);
        setPasskey('');
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid passkey. Please try again.');
      }
    } catch (error) {
      console.error('Passkey verification failed:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="shad-alert-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-start justify-between">
            Admin Access Verification
            <Image
              src={ICONS['close.svg']}
              alt="close"
              width={20}
              height={20}
              onClick={closeModal}
              className="cursor-pointer"
            />
          </AlertDialogTitle>
          <AlertDialogDescription>
            To access the admin page, please enter the secure passkey.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <InputOTP
            maxLength={6}
            value={passkey}
            onChange={(value) => setPasskey(value)}
            disabled={isVerifying}
          >
            <InputOTPGroup className="shad-otp">
              <InputOTPSlot className="shad-otp-slot" index={0} />
              <InputOTPSlot className="shad-otp-slot" index={1} />
              <InputOTPSlot className="shad-otp-slot" index={2} />
              <InputOTPSlot className="shad-otp-slot" index={3} />
              <InputOTPSlot className="shad-otp-slot" index={4} />
              <InputOTPSlot className="shad-otp-slot" index={5} />
            </InputOTPGroup>
          </InputOTP>

          {error && <p className="text-14-regular shad-error mt-4 flex justify-center">{error}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={validatePasskey}
            className="shad-primary-btn w-full"
            disabled={isVerifying || passkey.length !== 6}
          >
            {isVerifying ? (
              <div className="flex items-center space-x-2">
                <div className="size-4 animate-spin rounded-full border-b-2 border-white"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Enter Admin Passkey'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
