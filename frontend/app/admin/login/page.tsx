'use client';

import { Eye, EyeOff, Lock, Shield, User, Mail, RefreshCw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminLogin() {
  const router = useRouter();
  const [passkey, setPasskey] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  
  // Forgot passkey states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resetError, setResetError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Mount effect for animations
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check for lockout
  useEffect(() => {
    const lockoutTime = localStorage.getItem('adminLockout');
    if (lockoutTime) {
      const lockEnd = parseInt(lockoutTime);
      if (Date.now() < lockEnd) {
        setIsLocked(true);
        setLockTime(Math.ceil((lockEnd - Date.now()) / 1000));
        
        const timer = setInterval(() => {
          const remaining = Math.ceil((lockEnd - Date.now()) / 1000);
          if (remaining <= 0) {
            setIsLocked(false);
            setLockTime(0);
            localStorage.removeItem('adminLockout');
            setAttempts(0);
            clearInterval(timer);
          } else {
            setLockTime(remaining);
          }
        }, 1000);
        
        return () => clearInterval(timer);
      } else {
        localStorage.removeItem('adminLockout');
      }
    }
  }, []);

  // Check if already authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    const adminToken = localStorage.getItem('adminToken');
    
    if (adminAuth === 'true' && adminToken) {
      router.replace('/admin');
    }
  }, [router]);

  // Handle passkey authentication
  const handlePasskeyLogin = async () => {
    if (isLocked) {
      setAuthError(`Too many failed attempts. Please wait ${lockTime} seconds.`);
      return;
    }

    if (!passkey.trim()) {
      setAuthError('Please enter the admin passkey');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passkey }),
      });

      const result = await response.json();

      if (response.ok) {
        // Clear failed attempts on success
        setAttempts(0);
        localStorage.removeItem('adminLockout');
        
        // Store authentication
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminToken', result.token);
        
        // Show success message briefly before redirect
        setAuthError('');
        
        // Redirect to admin dashboard with a slight delay for UX
        setTimeout(() => {
          router.replace('/admin');
        }, 500);
        
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          // Lock for 5 minutes after 5 failed attempts
          const lockUntil = Date.now() + (5 * 60 * 1000);
          localStorage.setItem('adminLockout', lockUntil.toString());
          setIsLocked(true);
          setLockTime(300);
          setAuthError('Too many failed attempts. Account locked for 5 minutes.');
        } else {
          setAuthError(`Invalid passkey. ${5 - newAttempts} attempts remaining.`);
        }
      }
    } catch (error) {
      setAuthError('Network error. Please check your connection and try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle forgot passkey request
  const handleForgotPasskey = async () => {
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/admin/forgot-passkey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setForgotSuccess(result.message);
        setTimeout(() => {
          setShowForgotModal(false);
          setShowResetModal(true);
          setForgotSuccess('');
        }, 2000);
      } else {
        setForgotError(result.message || 'Failed to send reset OTP');
      }
    } catch (error) {
      setForgotError('Network error. Please check your connection and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle reset passkey
  const handleResetPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPasskey !== confirmPasskey) {
      setResetError('Passkeys do not match');
      return;
    }

    if (newPasskey.length < 6) {
      setResetError('New passkey must be at least 6 characters long');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/admin/reset-passkey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, newPasskey }),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success and close modal
        alert('Passkey reset successful! You can now login with your new passkey.');
        setShowResetModal(false);
        // Clear form
        setOtp('');
        setNewPasskey('');
        setConfirmPasskey('');
        setResetError('');
      } else {
        setResetError(result.message || 'Failed to reset passkey');
      }
    } catch (error) {
      setResetError('Network error. Please check your connection and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Handle admin login form submit
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePasskeyLogin();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-black dark:via-neutral-900 dark:to-black">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 size-80 animate-pulse rounded-full bg-red-200 opacity-20 mix-blend-multiply blur-xl"></div>
        <div className="absolute -bottom-40 -left-40 size-80 animate-pulse rounded-full bg-blue-200 opacity-20 mix-blend-multiply blur-xl delay-1000"></div>
        <div className="absolute left-40 top-40 size-60 animate-pulse rounded-full bg-purple-200 opacity-20 mix-blend-multiply blur-xl delay-500"></div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className={`w-full max-w-md transition-all duration-1000 ${
          isMounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="rounded-2xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-lg dark:border-gray-700/20 dark:bg-gray-900/80">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="relative mx-auto mb-6 flex size-20 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-red-500 to-red-600 opacity-20"></div>
                <div className="relative z-10 rounded-full bg-white p-3 shadow-lg">
                  <Shield className="size-8 text-red-600" />
                </div>
              </div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                Admin Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Secure access to healthcare management system
              </p>
            </div>

            {/* Security Info */}
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-center space-x-2">
                <Lock className="size-4 text-blue-600" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Secure admin access
                </p>
              </div>
            </div>

            {/* Error Display */}
            {authError && (
              <div className={`mb-4 rounded-lg p-3 transition-all duration-300 ${
                isLocked ? 'border border-red-300 bg-red-100' : 'border border-orange-200 bg-orange-50'
              }`}>
                <div className="flex items-center space-x-2">
                  <Shield className={`size-4 ${isLocked ? 'text-red-600' : 'text-orange-600'}`} />
                  <p className={`text-sm font-medium ${isLocked ? 'text-red-800' : 'text-orange-800'}`}>
                    {authError}
                  </p>
                </div>
              </div>
            )}

            {/* Success state */}
            {authLoading && !authError && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-center space-x-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                  <p className="text-sm font-medium text-green-800">Authenticating...</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-6">
              {/* Passkey Input */}
              <div className="space-y-2">
                <label htmlFor="passkey" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center space-x-2">
                    <User className="size-4" />
                    <span>Administrator Passkey</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    id="passkey"
                    type={showPasskey ? 'text' : 'password'}
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter your secure passkey"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 shadow-sm transition-all duration-200 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                    autoComplete="off"
                    autoFocus
                    disabled={isLocked || authLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLocked || authLoading}
                  >
                    {showPasskey ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={authLoading || isLocked || !passkey.trim()}
                className={`w-full rounded-lg px-4 py-3 font-semibold text-white transition-all duration-200 ${
                  authLoading || isLocked || !passkey.trim()
                    ? 'cursor-not-allowed bg-gray-400' 
                    : 'bg-gradient-to-r from-red-600 to-red-700 shadow-lg hover:from-red-700 hover:to-red-800 hover:shadow-xl active:scale-[0.98]'
                }`}
              >
                {authLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Verifying Access...</span>
                  </div>
                ) : isLocked ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Lock className="size-5" />
                    <span>Locked ({lockTime}s)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="size-5" />
                    <span>Secure Login</span>
                  </div>
                )}
              </button>
            </form>

            {/* Forgot Passkey Link */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                disabled={isLocked || authLoading}
              >
                Forgot your passkey?
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 space-y-4 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Failed attempts: {attempts}/5 • Session secured with JWT
              </div>
              
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center space-x-2 font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span>←</span>
                <span>Return to Patient Portal</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Passkey Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowForgotModal(false)}></div>
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="size-6" />
            </button>

            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
              Reset Admin Passkey
            </h2>

            {forgotSuccess ? (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                <div className="flex items-center space-x-2">
                  <Mail className="size-5" />
                  <span>{forgotSuccess}</span>
                </div>
              </div>
            ) : (
              <>
                {forgotError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                    {forgotError}
                  </div>
                )}

                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  An OTP will be sent to the clinic email address: <strong>khushihomeopathicclinic@gmail.com</strong>
                </p>

                <div className="space-y-4">
                  <button
                    onClick={handleForgotPasskey}
                    disabled={forgotLoading}
                    className={`w-full rounded-lg px-4 py-3 font-semibold text-white transition-all duration-200 ${
                      forgotLoading
                        ? 'cursor-not-allowed bg-gray-400' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 shadow-lg hover:from-red-700 hover:to-red-800 hover:shadow-xl active:scale-[0.98]'
                    }`}
                  >
                    {forgotLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Sending OTP...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Mail className="size-5" />
                        <span>Send OTP to Clinic Email</span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reset Passkey Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowResetModal(false)}></div>
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="size-6" />
            </button>

            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
              Enter New Passkey
            </h2>

            {resetError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPasskey} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  OTP Code (from email)
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition-all duration-200 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label htmlFor="new-passkey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Passkey
                </label>
                <input
                  id="new-passkey"
                  type="password"
                  value={newPasskey}
                  onChange={(e) => setNewPasskey(e.target.value)}
                  placeholder="Enter new passkey (min 6 characters)"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition-all duration-200 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-passkey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Passkey
                </label>
                <input
                  id="confirm-passkey"
                  type="password"
                  value={confirmPasskey}
                  onChange={(e) => setConfirmPasskey(e.target.value)}
                  placeholder="Confirm new passkey"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition-all duration-200 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
                  autoComplete="off"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading || !otp || !newPasskey || !confirmPasskey}
                className={`w-full rounded-lg px-4 py-3 font-semibold text-white transition-all duration-200 ${
                  resetLoading || !otp || !newPasskey || !confirmPasskey
                    ? 'cursor-not-allowed bg-gray-400' 
                    : 'bg-gradient-to-r from-green-600 to-green-700 shadow-lg hover:from-green-700 hover:to-green-800 hover:shadow-xl active:scale-[0.98]'
                }`}
              >
                {resetLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Resetting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="size-5" />
                    <span>Reset Passkey</span>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
