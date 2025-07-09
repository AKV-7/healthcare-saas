'use client';

import {
  Search,
  User,
  Phone,
  Calendar,
  Clock,
  UserCheck,
  Info,
  AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback, useEffect, useRef } from 'react';

import { SimpleNavButton } from '@/components/SimpleNavButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AppointmentStatus {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  doctor: string;
  symptoms: string;
  status: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  userId: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  appointments?: AppointmentStatus[];
  error?: string;
  message?: string;
}

export default function Page() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [appointments, setAppointments] = useState<AppointmentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState(0);
  const [searchAttempts, setSearchAttempts] = useState(0);
  const appointmentsRef = useRef<HTMLDivElement | null>(null);

  // Rate limiting: max 5 searches per minute
  const RATE_LIMIT_ATTEMPTS = 5;
  const RATE_LIMIT_WINDOW = 60000; // 1 minute

  // Input validation
  const validateInputs = useCallback(() => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push('Name is required');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!phone.trim()) {
      errors.push('Phone number is required');
    } else if (!/^\+91[6-9]\d{9}$/.test(phone.trim())) {
      errors.push('Please enter a valid Indian phone number with +91');
    }

    return errors;
  }, [name, phone]);

  // Rate limiting check
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTime;

    if (timeSinceLastSearch < RATE_LIMIT_WINDOW && searchAttempts >= RATE_LIMIT_ATTEMPTS) {
      const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastSearch) / 1000);
      throw new Error(
        `Too many search attempts. Please wait ${remainingTime} seconds before trying again.`
      );
    }

    if (timeSinceLastSearch >= RATE_LIMIT_WINDOW) {
      setSearchAttempts(0);
    }
  }, [lastSearchTime, searchAttempts]);

  const handleCheckStatus = useCallback(async () => {
    try {
      // Validate inputs
      const validationErrors = validateInputs();
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      // Check rate limiting
      checkRateLimit();

      setLoading(true);
      setError('');
      setAppointments([]);
      setIsSubmitting(true);

      // Add cache-busting parameter and security headers
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/appointments/by-name-phone?name=${encodeURIComponent(name.trim())}&phone=${encodeURIComponent(phone.trim())}&t=${timestamp}`,
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
            'X-Requested-With': 'XMLHttpRequest',
          },
          // Add timeout
          signal: AbortSignal.timeout(30000), // 30 second timeout
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No appointments found for this user. Please check your details.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error('Failed to fetch appointments. Please try again.');
        }
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.appointments) {
        // Sort appointments by creation date (latest first)
        const sortedAppointments = data.appointments.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime(); // Descending order (latest first)
        });

        setAppointments(sortedAppointments);
        if (sortedAppointments.length === 0) {
          setError('No appointments found for this user. Please check your details.');
        } else {
          // Scroll to appointments after a short delay to ensure rendering
          setTimeout(() => {
            if (appointmentsRef.current) {
              const rect = appointmentsRef.current.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              // Offset of 24px from the top
              window.scrollTo({
                top: rect.top + scrollTop - 24,
                behavior: 'smooth',
              });
            }
          }, 200);
        }
      } else {
        throw new Error(data.error || data.message || 'Failed to fetch appointments');
      }

      // Update rate limiting
      setLastSearchTime(Date.now());
      setSearchAttempts((prev) => prev + 1);
    } catch (error) {
      console.error('Error fetching appointments:', error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('Request timed out. Please check your connection and try again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  }, [name, phone, validateInputs, checkRateLimit]);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleCheckStatus();
    },
    [handleCheckStatus]
  );

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [name, phone, error]);

  // Auto-focus on first input
  useEffect(() => {
    const firstInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  }, []);

  const formatTime = useCallback((timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return 'Invalid time';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'pending':
        return '⏳';
      case 'confirmed':
        return '✅';
      default:
        return 'ℹ️';
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-rose-50 via-white to-amber-50 pt-16 transition-colors duration-300 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg"
                  alt="Khushi Homoeopathic Clinic"
                  width={40}
                  height={40}
                  className="size-10"
                />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Khushi Homoeo
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-600 hover:shadow-lg dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-rose-400"
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Home
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-0 top-0 size-96 animate-blob rounded-full bg-gradient-to-br from-rose-200/30 to-amber-200/30 blur-3xl dark:from-rose-800/30 dark:to-amber-800/30"></div>
            <div className="animation-delay-2000 absolute bottom-0 right-0 size-96 animate-blob rounded-full bg-gradient-to-tl from-amber-200/30 to-rose-200/30 blur-3xl dark:from-amber-800/30 dark:to-rose-800/30"></div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
            <div className="flex w-full items-center justify-center">
              <div className="w-full max-w-2xl space-y-8 text-center">
                <h1 className="font-serif text-4xl font-bold md:text-5xl">
                  <span className="bg-gradient-to-r from-gray-900 via-rose-800 to-amber-800 bg-clip-text text-transparent dark:from-white dark:via-rose-300 dark:to-amber-300">
                    My Appointments
                  </span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 md:text-xl">
                  Check all your appointments using your User ID and Phone Number
                </p>
                {/* Search Form */}
                <div className="relative">
                  <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-rose-500/20 to-amber-500/20 opacity-50 blur-2xl"></div>
                  <Card className="relative w-full max-w-2xl border-0 bg-white/80 shadow-2xl backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900/80">
                    <CardHeader className="rounded-t-3xl border-b border-rose-200 bg-gradient-to-r from-rose-50 to-amber-50 dark:border-rose-900/40 dark:from-rose-900/40 dark:to-amber-900/40">
                      <CardTitle className="flex items-center text-xl font-bold text-gray-900 dark:text-gray-100">
                        <Search
                          className="mr-2 size-6 text-rose-600 dark:text-rose-400"
                          aria-hidden="true"
                        />
                        Find My Appointments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <label
                              htmlFor="name"
                              className="mb-2 flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200"
                            >
                              <User
                                className="mr-2 size-4 text-rose-600 dark:text-rose-400"
                                aria-hidden="true"
                              />
                              Full Name
                            </label>
                            <Input
                              id="name"
                              type="text"
                              placeholder="Enter your full name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="h-12 w-full border-gray-300 bg-white text-base transition-all duration-200 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-900/40 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-rose-400 dark:focus:ring-rose-400"
                              disabled={loading}
                              aria-describedby="name-help"
                              required
                            />
                            <p id="name-help" className="text-sm text-gray-500 dark:text-gray-400">
                              Enter the same name you used during registration
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label
                              htmlFor="phone"
                              className="mb-2 flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200"
                            >
                              <Phone
                                className="mr-2 size-4 text-rose-600 dark:text-rose-400"
                                aria-hidden="true"
                              />
                              Phone Number
                            </label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+91 9876543210"
                              value={phone}
                              onChange={(e) => {
                                let value = e.target.value;
                                // Remove all non-digits
                                const digits = value.replace(/\D/g, '');

                                // Format for Indian mobile numbers
                                if (digits.startsWith('91')) {
                                  value = '+' + digits;
                                } else if (digits.length === 10) {
                                  value = '+91' + digits;
                                } else if (!value.startsWith('+91')) {
                                  value = '+91';
                                }

                                setPhone(value);
                              }}
                              className="h-12 w-full border-gray-300 bg-white text-base transition-all duration-200 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-900/40 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-rose-400 dark:focus:ring-rose-400"
                              disabled={loading}
                              aria-describedby="phone-help"
                              required
                            />
                            <p id="phone-help" className="text-sm text-gray-500 dark:text-gray-400">
                              Enter a valid Indian phone number with +91
                            </p>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={loading || isSubmitting}
                          className="h-12 w-full bg-gradient-to-r from-rose-600 to-amber-600 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:from-rose-700 hover:to-amber-700 hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50 dark:from-rose-800 dark:to-amber-800 dark:hover:from-rose-700 dark:hover:to-amber-700"
                          aria-describedby="submit-status"
                        >
                          {loading ? (
                            <div className="flex items-center justify-center">
                              <div className="mr-3 size-5 animate-spin rounded-full border-b-2 border-white"></div>
                              Finding Appointments...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <Search className="mr-3 size-5" aria-hidden="true" />
                              Find Appointments
                            </div>
                          )}
                        </Button>
                        <div id="submit-status" className="sr-only" aria-live="polite">
                          {loading ? 'Searching for appointments...' : 'Ready to search'}
                        </div>
                      </form>

                      {error && (
                        <Alert className="mt-6 border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/30">
                          <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
                          <AlertDescription className="font-medium text-rose-700 dark:text-rose-300">
                            {error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </div>
                {/* Appointments List */}
                {appointments.length > 0 && (
                  <section aria-labelledby="appointments-heading" ref={appointmentsRef}>
                    {/* Patient Details Card */}
                    <Card className="mb-8 border-0 bg-gradient-to-r from-rose-50 to-amber-50 shadow-xl dark:from-gray-900 dark:to-rose-900/30 dark:ring-1 dark:ring-rose-900/30">
                      <CardContent className="p-8">
                        <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900 dark:text-gray-100">
                          <UserCheck
                            className="mr-3 size-6 text-rose-600 dark:text-rose-400"
                            aria-hidden="true"
                          />
                          Patient Information
                        </h2>

                        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                              Patient Name
                            </label>
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-gray-800 dark:border-rose-900/40 dark:bg-gray-900 dark:text-gray-100">
                              {appointments[0].patientName}
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                              Email
                            </label>
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-gray-800 dark:border-rose-900/40 dark:bg-gray-900 dark:text-gray-100">
                              {appointments[0].patientEmail}
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                              Phone Number
                            </label>
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-gray-800 dark:border-rose-900/40 dark:bg-gray-900 dark:text-gray-100">
                              {appointments[0].patientPhone}
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                              User ID
                            </label>
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-mono text-base font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-300">
                              {appointments[0].userId}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-rose-900/40 dark:bg-gray-900">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                Total Appointments
                              </label>
                              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {appointments.length}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="size-3 rounded-full bg-rose-500 dark:bg-rose-400"></div>
                              <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
                                Active Account
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <h2
                      id="appointments-heading"
                      className="mb-6 flex items-center text-2xl font-bold text-gray-900 dark:text-gray-100"
                    >
                      <div className="mr-3 flex size-8 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/60">
                        <Calendar
                          className="size-5 text-rose-600 dark:text-rose-400"
                          aria-hidden="true"
                        />
                      </div>
                      Your Appointments ({appointments.length})
                    </h2>

                    <div className="space-y-6" role="list" aria-label="Appointments list">
                      {appointments.map((appointment, index) => (
                        <Card
                          key={appointment._id}
                          className="border-0 bg-gradient-to-br from-white to-rose-50/50 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:from-gray-900 dark:to-rose-900/20 dark:ring-1 dark:ring-rose-900/30"
                          role="listitem"
                        >
                          <CardContent className="p-8">
                            {/* Booking ID and Status Row */}
                            <div className="mb-6 flex flex-col items-start justify-between border-b border-rose-200 pb-6 dark:border-rose-900/40 sm:flex-row sm:items-center">
                              <div>
                                <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                  Booking ID
                                </label>
                                <div className="rounded-xl bg-rose-100 px-3 py-2 font-mono text-base font-semibold text-gray-800 dark:bg-rose-900/30 dark:text-gray-100">
                                  {appointment._id}
                                </div>
                              </div>
                              <div className="mt-4 sm:mt-0">
                                <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                  Status
                                </label>
                                <div
                                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium ${getStatusColor(appointment.status)} dark:border-rose-900/40 dark:bg-gray-900 dark:text-gray-100`}
                                >
                                  <span className="mr-2" aria-hidden="true">
                                    {getStatusIcon(appointment.status)}
                                  </span>
                                  {appointment.status.charAt(0).toUpperCase() +
                                    appointment.status.slice(1)}
                                </div>
                              </div>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                              {/* Consultation Type */}
                              <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:border-green-900/40 dark:from-green-900/40 dark:to-emerald-900/30">
                                <div className="mb-3 flex items-center">
                                  <div className="mr-2 flex size-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/60">
                                    <svg
                                      className="size-4 text-green-600 dark:text-green-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  </div>
                                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                    Type
                                  </h3>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold capitalize text-green-600 dark:text-green-400">
                                    {appointment.appointmentType.replace('-', ' ')}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    Consultation
                                  </p>
                                </div>
                              </div>

                              {/* Date */}
                              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-900/40 dark:from-blue-900/40 dark:to-indigo-900/30">
                                <div className="mb-3 flex items-center">
                                  <div className="mr-2 flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/60">
                                    <Calendar
                                      className="size-4 text-blue-600 dark:text-blue-400"
                                      aria-hidden="true"
                                    />
                                  </div>
                                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                    Date
                                  </h3>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {formatDate(appointment.appointmentDate)}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    Appointment Date
                                  </p>
                                </div>
                              </div>

                              {/* Time */}
                              <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:border-purple-900/40 dark:from-purple-900/40 dark:to-pink-900/30">
                                <div className="mb-3 flex items-center">
                                  <div className="mr-2 flex size-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/60">
                                    <Clock
                                      className="size-4 text-purple-600 dark:text-purple-400"
                                      aria-hidden="true"
                                    />
                                  </div>
                                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                    Time
                                  </h3>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {formatTime(appointment.appointmentTime)}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    Appointment Time
                                  </p>
                                </div>
                              </div>

                              {/* Doctor */}
                              <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 p-4 dark:border-orange-900/40 dark:from-orange-900/40 dark:to-red-900/30">
                                <div className="mb-3 flex items-center">
                                  <div className="mr-2 flex size-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/60">
                                    <UserCheck
                                      className="size-4 text-orange-600 dark:text-orange-400"
                                      aria-hidden="true"
                                    />
                                  </div>
                                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                    Doctor
                                  </h3>
                                </div>
                                <div className="text-center">
                                  <div className="text-base font-bold text-orange-600 dark:text-orange-400">
                                    {appointment.doctor}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    Assigned Doctor
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Additional Details Section */}
                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 dark:border-indigo-900/40 dark:from-indigo-900/40 dark:to-blue-900/30">
                                <div className="mb-3 flex items-center">
                                  <div className="mr-2 flex size-6 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/60">
                                    <Info
                                      className="size-3 text-indigo-600 dark:text-indigo-400"
                                      aria-hidden="true"
                                    />
                                  </div>
                                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                    Booking Details
                                  </h3>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                      Booked On
                                    </label>
                                    <div className="text-sm text-gray-800 dark:text-gray-100">
                                      {formatDate(appointment.createdAt)}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                      Duration
                                    </label>
                                    <div className="text-sm text-gray-800 dark:text-gray-100">
                                      30 minutes
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-4 dark:border-teal-900/40 dark:from-teal-900/40 dark:to-cyan-900/30">
                                <div className="mb-3 flex items-center">
                                  <div className="mr-2 flex size-6 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/60">
                                    <svg
                                      className="size-3 text-teal-600 dark:text-teal-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                  </div>
                                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                    Appointment Info
                                  </h3>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                      Status
                                    </label>
                                    <div
                                      className={`inline-flex items-center rounded-full border px-2 py-1 text-sm font-medium ${getStatusColor(appointment.status)} dark:border-red-900/40 dark:bg-neutral-900 dark:text-gray-100`}
                                    >
                                      <span className="mr-1" aria-hidden="true">
                                        {getStatusIcon(appointment.status)}
                                      </span>
                                      {appointment.status.charAt(0).toUpperCase() +
                                        appointment.status.slice(1)}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                                      Priority
                                    </label>
                                    <div className="text-sm text-gray-800 dark:text-gray-100">
                                      Standard
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Symptoms Section */}
                            {appointment.symptoms && (
                              <div className="mt-8 border-t border-rose-200 pt-6 dark:border-rose-900/40">
                                <div className="mb-4 flex items-center">
                                  <div className="mr-3 flex size-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/60">
                                    <Info
                                      className="size-4 text-amber-600 dark:text-amber-400"
                                      aria-hidden="true"
                                    />
                                  </div>
                                  <label className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    Symptoms & Notes
                                  </label>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-gray-800 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-gray-100">
                                  {appointment.symptoms}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {/* No Results State */}
                {!loading && appointments.length === 0 && !error && (
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-rose-500/10 to-amber-500/10 opacity-50 blur-2xl"></div>
                    <Card className="relative border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-900/80">
                      <CardContent className="p-12 text-center">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-rose-900/30">
                          <Search
                            className="size-8 text-gray-400 dark:text-rose-400"
                            aria-hidden="true"
                          />
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-100">
                          No Appointments Found
                        </h3>
                        <p className="text-base text-gray-600 dark:text-gray-300">
                          Enter your User ID and Phone Number above to search for your appointments.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 size-96 rounded-full bg-gradient-to-br from-rose-500/10 to-amber-500/10 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 size-96 rounded-full bg-gradient-to-tl from-amber-500/10 to-rose-500/10 blur-3xl"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Clinic Info */}
            <div className="space-y-6">
              <Link href="/" className="block">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg"
                  alt="Khushi Homoeopathic Clinic"
                  width={200}
                  height={60}
                  className="h-12 w-auto"
                />
              </Link>
              <p className="text-gray-300">
                Providing natural and effective homeopathic treatments for over 15 years. Your
                health is our priority.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5h-4.33C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z" />
                  </svg>
                </Link>
                <Link
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2.16c3.2,0,3.58,0,4.85.07,3.25.15,4.77,1.69,4.92,4.92.06,1.27.07,1.65.07,4.85s0,3.58-.07,4.85c-.15,3.23-1.69,4.77-4.92,4.92-1.27.06-1.65.07-4.85.07s-3.58,0-4.85-.07c-3.25-.15-4.77-1.69-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s0-3.58.07-4.85C2.38,3.92,3.92,2.38,7.15,2.23,8.42,2.18,8.8,2.16,12,2.16ZM12,0C8.74,0,8.33,0,7.05.07c-4.27.2-6.78,2.71-7,7C0,8.33,0,8.74,0,12s0,3.67.07,4.95c.2,4.27,2.71,6.78,7,7C8.33,24,8.74,24,12,24s3.67,0,4.95-.07c4.27-.2,6.78-2.71,7-7C24,15.67,24,15.26,24,12s0-3.67-.07-4.95c-.2-4.27-2.71-6.78-7-7C15.67,0,15.26,0,12,0Zm0,5.84A6.16,6.16,0,1,0,18.16,12,6.16,6.16,0,0,0,12,5.84ZM12,16a4,4,0,1,1,4-4A4,4,0,0,1,12,16ZM18.41,4.15a1.44,1.44,0,1,0,1.44,1.44A1.44,1.44,0,0,0,18.41,4.15Z" />
                  </svg>
                </Link>
                <Link
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a2.994 2.994 0 0 0-2.107-2.117C19.379 3.5 12 3.5 12 3.5s-7.379 0-9.391.569A2.994 2.994 0 0 0 .502 6.186C0 8.2 0 12 0 12s0 3.8.502 5.814a2.994 2.994 0 0 0 2.107 2.117C4.621 20.5 12 20.5 12 20.5s7.379 0 9.391-.569a2.994 2.994 0 0 0 2.107-2.117C24 15.8 24 12 24 12s0-3.8-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-6 text-xl font-bold">Quick Links</h4>
              <ul className="space-y-4">
                <li>
                  <SimpleNavButton
                    href="/book-appointment"
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                  >
                    Book Appointment
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton
                    href="/existing-patient"
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                  >
                    Existing Patient
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton
                    href="/appointment-status"
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                  >
                    Appointment Status
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton
                    href="#testimonials"
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                    isAnchor={true}
                  >
                    Testimonials
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton
                    href="/admin/login"
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                  >
                    Admin Access
                  </SimpleNavButton>
                </li>
              </ul>
            </div>

            {/* Clinic Hours */}
            <div>
              <h4 className="mb-6 text-xl font-bold">Clinic Hours</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-2">
                  <svg
                    className="size-5 text-rose-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-gray-300">Morning</p>
                    <p className="text-white">10:30 AM - 1:30 PM</p>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="size-5 text-rose-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-gray-300">Evening</p>
                    <p className="text-white">5:00 PM - 8:30 PM</p>
                  </div>
                </li>
                <li className="flex items-center gap-2 text-rose-400">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>Sunday Closed</span>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="mb-6 text-xl font-bold">Contact Info</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-1 size-5 text-rose-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <address className="not-italic text-gray-300">
                    Side Gate Yuvraj Residence,
                    <br />
                    Near Sale Tax Office Stadium Road,
                    <br />
                    Ram Ganga Vihar, Moradabad
                  </address>
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="size-5 text-rose-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div>
                    <a
                      href="tel:+919756077474"
                      className="block text-gray-300 transition-colors hover:text-white"
                    >
                      +91 97560 77474
                    </a>
                    <a
                      href="tel:+917017819734"
                      className="block text-gray-300 transition-colors hover:text-white"
                    >
                      +91 70178 19734
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 border-t border-white/10 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-center text-sm text-gray-400 md:text-left">
                © {new Date().getFullYear()} Khushi Homoeopathic Clinic. All rights reserved.
              </p>
              <div className="flex items-center gap-8">
                <Link
                  href="/privacy-policy"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
