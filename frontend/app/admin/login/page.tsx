'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  // Check if already authenticated on component mount
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    const adminToken = localStorage.getItem('adminToken');

    if (adminAuth === 'true' && adminToken) {
      // Already authenticated, redirect to dashboard
      router.push('/admin');
    }
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store authentication data
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        sessionStorage.setItem('adminAuth', 'true');

        // Set authentication cookies for middleware
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? '; Secure' : '';
        document.cookie = `adminAuth=true; path=/; max-age=3600; SameSite=Lax${secureFlag}`; // 1 hour expiry
        document.cookie = `adminToken=${data.token}; path=/; max-age=3600; SameSite=Lax${secureFlag}`; // 1 hour expiry

        // Set success state and redirect after a brief delay
        setIsAuthenticated(true);

        // Redirect to dashboard after showing success message
        setTimeout(() => {
          // Ensure cookies are set before redirect
          document.cookie = `adminAuth=true; path=/; max-age=3600; SameSite=Lax${secureFlag}`;
          document.cookie = `adminToken=${data.token}; path=/; max-age=3600; SameSite=Lax${secureFlag}`;

          window.location.href = '/admin';
        }, 1500);
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    // Ensure cookies are set before navigation
    const adminAuth = localStorage.getItem('adminAuth');
    const adminToken = localStorage.getItem('adminToken');

    if (adminAuth === 'true' && adminToken) {
      // Set cookies with proper attributes for production
      const isProduction = process.env.NODE_ENV === 'production';
      const secureFlag = isProduction ? '; Secure' : '';
      document.cookie = `adminAuth=true; path=/; max-age=3600; SameSite=Lax${secureFlag}`;
      document.cookie = `adminToken=${adminToken}; path=/; max-age=3600; SameSite=Lax${secureFlag}`;

      // Force a page reload to ensure middleware picks up the new cookies
      window.location.href = '/admin';
    } else {
      setIsAuthenticated(false);
      router.push('/admin/login');
    }
  };

  const handleBackToLogin = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminAuth');

    // Clear cookies
    document.cookie = 'adminAuth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const handleSendOtp = async () => {
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/admin-send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setResetStep(2);
        setResetSuccess('OTP sent to your email.');
      } else {
        setResetError(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setResetError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/admin-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword: resetNewPassword }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setResetSuccess('Password reset successful. You can now log in.');
        setTimeout(() => {
          setShowReset(false);
          setResetStep(1);
          setResetEmail('');
          setResetOtp('');
          setResetNewPassword('');
          setResetError('');
          setResetSuccess('');
        }, 2000);
      } else {
        setResetError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setResetError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-red-950 to-black p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xl">
          <div className="mb-8">
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-red-100">
              <svg
                className="size-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Access Granted!</h1>
            <p className="mb-6 text-gray-600">You can now access the admin dashboard</p>
          </div>

          <Button
            onClick={handleGoToDashboard}
            className="mb-4 w-full bg-red-600 py-3 text-lg text-white hover:bg-red-700"
          >
            Go to Dashboard
          </Button>

          <Button
            onClick={handleBackToLogin}
            variant="outline"
            size="sm"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-red-950 to-black p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="size-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-600">Enter your admin credentials to access the dashboard</p>
        </div>

        <div className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-red-200 text-center text-lg focus:border-red-500 focus:ring-red-500"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-red-200 pr-10 text-center text-lg focus:border-red-500 focus:ring-red-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c1.657 0 3.22.403 4.575 1.125M19.875 5.175A9.956 9.956 0 0121.542 12c-1.274 4.057-5.065 7-9.542 7-1.657 0-3.22-.403-4.575-1.125"
                  />
                </svg>
              ) : (
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c1.657 0 3.22.403 4.575 1.125M19.875 5.175A9.956 9.956 0 0121.542 12c-1.274 4.057-5.065 7-9.542 7-1.657 0-3.22-.403-4.575-1.125"
                  />
                </svg>
              )}
            </button>
          </div>
          <Button
            onClick={handleLogin}
            className="w-full bg-red-600 py-3 text-lg text-white hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          {error && <div className="text-center text-sm font-medium text-red-600">{error}</div>}
          <div className="mt-2 text-center">
            <button
              type="button"
              className="text-sm text-red-600 hover:underline focus:outline-none"
              onClick={() => setShowReset(true)}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-red-600 hover:text-red-700 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Password Reset Modal/Section */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-2xl">
            <button
              className="absolute right-2 top-2 text-gray-400 hover:text-red-600"
              onClick={() => {
                setShowReset(false);
                setResetStep(1);
                setResetEmail('');
                setResetOtp('');
                setResetNewPassword('');
                setResetError('');
                setResetSuccess('');
              }}
              aria-label="Close"
            >
              <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
              Reset Admin Password
            </h2>
            {resetStep === 1 && (
              <>
                <Input
                  type="email"
                  placeholder="Enter your admin email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="mb-4 border-red-200 text-center focus:border-red-500 focus:ring-red-500"
                  autoFocus
                />
                <Button
                  onClick={handleSendOtp}
                  className="mb-2 w-full bg-red-600 text-white hover:bg-red-700"
                  disabled={resetLoading || !resetEmail}
                >
                  {resetLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
                {resetError && (
                  <div className="text-center text-sm font-medium text-red-600">{resetError}</div>
                )}
                {resetSuccess && (
                  <div className="text-center text-sm font-medium text-green-600">
                    {resetSuccess}
                  </div>
                )}
              </>
            )}
            {resetStep === 2 && (
              <>
                <Input
                  type="text"
                  placeholder="Enter OTP"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  className="mb-3 border-red-200 text-center focus:border-red-500 focus:ring-red-500"
                  autoFocus
                />
                <Input
                  type="password"
                  placeholder="New password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="mb-3 border-red-200 text-center focus:border-red-500 focus:ring-red-500"
                />
                <Button
                  onClick={handleResetPassword}
                  className="mb-2 w-full bg-red-600 text-white hover:bg-red-700"
                  disabled={resetLoading || !resetOtp || !resetNewPassword}
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
                {resetError && (
                  <div className="text-center text-sm font-medium text-red-600">{resetError}</div>
                )}
                {resetSuccess && (
                  <div className="text-center text-sm font-medium text-green-600">
                    {resetSuccess}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
