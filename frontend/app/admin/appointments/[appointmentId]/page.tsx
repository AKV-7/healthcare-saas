'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';

export default function AppointmentDetailsPage({ params }: { params: { appointmentId: string } }) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointmentData = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        console.error('No admin token found');
        setError('Authentication required. Please login again.');
        return;
      }

      const res = await fetch(
        `${backendUrl}/api/appointments/${params.appointmentId}?t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          console.error('Unauthorized access');
          setError('Authentication failed. Please login again.');
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminToken');
          router.push('/admin/login');
          return;
        }
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setAppointment(data);
    } catch (e: any) {
      console.error('Error fetching appointment:', e);
      setError(e.message);
    }
  }, [params.appointmentId, router]);

  // Check authentication on component mount
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    const adminToken = localStorage.getItem('adminToken');

    if (!adminAuth || adminAuth !== 'true' || !adminToken) {
      router.push('/admin/login');
      return;
    }

    fetchAppointmentData();
  }, [router, fetchAppointmentData]);

  // Show loading state while fetching
  if (!appointment && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-black dark:via-neutral-900 dark:to-black">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-b-2 border-red-600"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-black dark:via-neutral-900 dark:to-black">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="size-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Appointment Not Found</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">{error}</p>
          <Link
            href="/admin"
            className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-white transition-colors hover:from-red-600 hover:to-red-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const a = appointment.data || appointment;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'no-show':
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getStatusIconColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'confirmed':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'completed':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'cancelled':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'no-show':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-black dark:via-neutral-900 dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-red-200/50 bg-white/95 shadow-lg backdrop-blur-md dark:border-gray-700/70 dark:bg-gray-900/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="flex items-center space-x-2 text-gray-600 transition-colors duration-200 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-rose-600">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg"
                  alt="Khushi Homoeopathic Clinic"
                  width={24}
                  height={24}
                  className="text-white"
                />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Khushi Homoeo Admin</span>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-red-600">
                <svg
                  className="size-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-gray-900 via-red-800 to-red-700 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:via-red-300 dark:to-red-400">
                  Appointment Details
                </h1>
                <p className="text-gray-600 dark:text-gray-300">Complete information about this appointment</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Patient Information Card */}
          <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-lg font-semibold text-white">
                  {a.patientName
                    ? a.patientName
                        .split(' ')
                        .map((n: string) => n.charAt(0))
                        .join('')
                    : (a.user?.firstName?.charAt(0) || a.patient?.firstName?.charAt(0)) +
                      (a.user?.lastName?.charAt(0) || a.patient?.lastName?.charAt(0))}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Patient Information</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Personal details and contact information</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
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
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Full Name</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {a.patientName ||
                      (a.user?.firstName || a.patient?.firstName) +
                        ' ' +
                        (a.user?.lastName || a.patient?.lastName)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">User ID</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {a.userId || a.user?.userId || a.patient?.userId || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Email Address</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {a.patientEmail || a.user?.email || a.patient?.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
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
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Phone Number</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {a.patientPhone || a.user?.phone || a.patient?.phone}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {a.user?.dateOfBirth || a.patient?.dateOfBirth
                      ? formatDate(a.user?.dateOfBirth || a.patient?.dateOfBirth)
                      : 'Not provided'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
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
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Gender</div>
                  <div className="font-medium capitalize text-gray-900 dark:text-white">
                    {a.user?.gender || a.patient?.gender || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details Card */}
          <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600">
                  <svg
                    className="size-5 text-white"
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
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appointment Details</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Booking information and medical details</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Booking ID</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{a._id || params.appointmentId}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Appointment Date</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{formatDate(a.appointmentDate)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
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
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Appointment Time</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{formatTime(a.appointmentTime)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
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
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Doctor</div>
                  <div className="font-medium text-gray-900 dark:text-white">{a.doctor}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
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
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Appointment Type</div>
                  <div className="font-medium capitalize text-gray-900 dark:text-white">{a.appointmentType}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`flex size-8 items-center justify-center rounded-lg ${getStatusIconColor(a.status)}`}>
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(a.status)}`}
                    >
                      {a.status}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-1 flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
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
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Symptoms/Reason</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {a.reason || a.symptoms || 'No symptoms provided'}
                  </div>
                </div>
              </div>

              {a.additionalNotes && (
                <div className="flex items-start space-x-3">
                  <div className="mt-1 flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <svg
                      className="size-4 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Additional Notes</div>
                    <div className="font-medium text-gray-900 dark:text-white">{a.additionalNotes}</div>
                  </div>
                </div>
              )}

              {/* Medical Attachments Section */}
              <div className="flex items-start space-x-3">
                <div className="mt-1 flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-4 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Medical Attachments</div>
                  <div className="mt-2">
                    {a.attachments && a.attachments.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {a.attachments.map((attachment: string, index: number) => {
                          const fileName = attachment.split('/').pop() || `File ${index + 1}`;
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);
                          return (
                            <div
                              key={index}
                              className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800"
                            >
                              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                {isImage ? (
                                  <svg className="size-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg className="size-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium text-gray-900 dark:text-white">
                                  {fileName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {isImage ? 'Image' : 'Document'}
                                </div>
                              </div>
                              <a
                                href={attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700"
                              >
                                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-800">
                        <div className="text-center">
                          <svg className="mx-auto size-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No medical documents uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
