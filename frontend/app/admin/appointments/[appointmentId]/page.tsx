'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';

export default function AppointmentDetailsPage({ params }: { params: { appointmentId: string } }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit appointment states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [isUpdatingAppointment, setIsUpdatingAppointment] = useState(false);
  const [editError, setEditError] = useState('');

  // Notification states
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

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

  const handleDelete = async () => {
    if (!appointment) return;

    setIsDeleting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');

      const response = await fetch(`${backendUrl}/api/appointments/${params.appointmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Appointment deleted successfully');
        router.push('/admin');
      } else if (response.status === 401) {
        alert('Authentication failed. Please login again.');
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
      } else {
        const errorText = await response.text();
        console.error('Delete error:', errorText);
        alert('Failed to delete appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Error deleting appointment');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const openEditModal = () => {
    if (!appointment) return;

    const a = appointment.data || appointment;
    setEditDate(a.appointmentDate.split('T')[0]);
    setEditTime(a.appointmentTime);
    setEditStatus(a.status);
    setEditError('');
    setShowEditModal(true);
  };

  const handleAppointmentUpdate = async () => {
    if (!editDate || !editTime || !editStatus) {
      setEditError('All fields are required');
      return;
    }

    setIsUpdatingAppointment(true);
    setEditError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');

      const response = await fetch(`${backendUrl}/api/appointments/${params.appointmentId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentDate: editDate,
          appointmentTime: editTime,
          status: editStatus,
        }),
      });

      if (response.ok) {
        const updatedAppointment = await response.json();

        // Update local state
        setAppointment(updatedAppointment);

        // Show success notification
        showSuccessNotification('Appointment updated successfully! Email sent to patient.');

        // Close modal
        setShowEditModal(false);
      } else {
        const errorData = await response.json();
        setEditError(errorData.message || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setEditError('Network error. Please try again.');
    } finally {
      setIsUpdatingAppointment(false);
    }
  };

  const showSuccessNotification = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
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
              <button
                onClick={openEditModal}
                className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg"
              >
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit Appointment</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-red-600 hover:to-red-700 hover:shadow-lg"
              >
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Delete Appointment</span>
              </button>
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
                <div
                  className={`flex size-8 items-center justify-center rounded-lg ${getStatusIconColor(a.status)}`}
                >
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
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/admin"
            className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-red-600 hover:to-red-700 hover:shadow-lg"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-900">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-6 text-red-600 dark:text-red-400"
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Appointment</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="mb-3 text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete this appointment?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Patient:</span>
                    <span className="font-medium dark:text-white">
                      {a.user?.firstName} {a.user?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Date:</span>
                    <span className="font-medium dark:text-white">{formatDate(a.appointmentDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Time:</span>
                    <span className="font-medium dark:text-white">{formatTime(a.appointmentTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Type:</span>
                    <span className="font-medium capitalize dark:text-white">{a.appointmentType}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-900">
            <div className="p-6">
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <svg
                    className="size-6 text-red-600 dark:text-red-400"
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Appointment</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update appointment details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-red-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Appointment Time
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-red-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-red-400"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                  </select>
                </div>

                {editError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-500 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {editError}
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  onClick={handleAppointmentUpdate}
                  disabled={isUpdatingAppointment}
                >
                  {isUpdatingAppointment ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Update</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showNotification && (
        <div className="fixed right-4 top-4 z-50 translate-x-0 rounded-lg bg-green-500 px-6 py-3 text-white shadow-lg transition-all duration-300">
          <div className="flex items-center space-x-2">
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
