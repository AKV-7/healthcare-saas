'use client';

import { User, CalendarIcon, Clock, ArrowLeft, CheckCircle, Phone, Mail, FileText, Activity, Stethoscope, Paperclip, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

interface AppointmentDetails {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  reason: string;
  status: string;
  doctor: string;
  doctorName: string;
  createdAt: string;
  attachments?: string[]; // Array of image URLs
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    userId: string;
    dateOfBirth?: string;
    gender?: string;
  };
}

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams?.get('appointmentId');
  const userId = searchParams?.get('userId');
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAppointmentDetails = useCallback(async () => {
    if (appointmentId && userId) {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setAppointment(data.appointment);
          setLoading(false);
        } else {
          console.error('Failed to fetch appointment details:', response.status);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching appointment details:', error);
        setLoading(false);
      }
    }
  }, [appointmentId, userId]);

  useEffect(() => {
    if (appointmentId && userId) {
      fetchAppointmentDetails();
    } else {
      setLoading(false);
      // If no appointment ID or user ID, redirect to home after a short delay
      if (!appointmentId || !userId) {
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    }
  }, [appointmentId, userId, fetchAppointmentDetails, router]);

  const getFullName = (user: AppointmentDetails['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.lastName || 'Unknown Patient';
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pending Confirmation', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      'no-show': { label: 'No Show', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' };
  };

  const getAppointmentTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'initial-consultation': 'Initial Consultation',
      'follow-up': 'Follow-up Visit',
      'chronic-condition': 'Chronic Condition',
      'pediatric-consultation': 'Pediatric Consultation',
      'women-health': 'Women\'s Health',
      'mental-health': 'Mental Health',
      'skin-treatment': 'Skin Treatment',
      'joint-pain': 'Joint Pain',
      'emergency': 'Emergency',
      'consultation': 'Consultation',
      'routine-checkup': 'Routine Checkup',
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Navigation */}
        <header className="relative z-50">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <div className="flex lg:flex-1">
              <Link href="/" className="-m-1.5 p-1.5">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg"
                  alt="Khushi Homoeopathic Clinic"
                  width={150}
                  height={45}
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <div className="flex items-center gap-4 lg:flex-1 lg:justify-end">
              <ThemeToggle />
            </div>
          </nav>
        </header>
        
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 size-16 animate-spin rounded-full border-4 border-solid border-rose-200 border-t-rose-600" />
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <header className="relative z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <Image
                src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg"
                alt="Khushi Homoeopathic Clinic"
                width={150}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center gap-4 lg:flex-1 lg:justify-end">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
            <CheckCircle className="size-12 text-white" />
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-gray-900 via-rose-800 to-amber-800 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:via-rose-300 dark:to-amber-300">
            {appointment ? 'Appointment Booked!' : 'Page Not Found'}
          </h1>
          <div className="space-y-2">
            {appointment ? (
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Soon you will receive a mail regarding confirmation of your booking.
              </p>
            ) : (
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {(!appointmentId || !userId) ? 
                  'You need to book an appointment first. Redirecting to homepage...' :
                  'Loading appointment details...'
                }
              </p>
            )}
            {appointment && (
              <p className="text-base font-medium text-rose-600 dark:text-rose-400">
                Please save your appointment details for future reference.
              </p>
            )}
          </div>
        </div>

        {appointment ? (
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-white to-rose-50 shadow-xl dark:from-gray-800 dark:to-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Appointment Details
                </h2>
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => router.push('/appointment-status')}
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Check Status
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Patient Information */}
                <div className="space-y-4 rounded-xl bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm dark:from-gray-700 dark:to-gray-800">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-gradient-to-r from-rose-500 to-amber-500 p-2">
                      <User className="size-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <User className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getFullName(appointment.user)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Patient Name</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <Mail className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.user.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <Phone className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.user.phone}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                      </div>
                    </div>

                    {appointment.user.dateOfBirth && (
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                          <CalendarIcon className="size-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(appointment.user.dateOfBirth).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                        </div>
                      </div>
                    )}

                    {appointment.user.gender && (
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                          <User className="size-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="font-medium capitalize text-gray-900 dark:text-white">
                            {appointment.user.gender}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="space-y-4 rounded-xl bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm dark:from-gray-700 dark:to-gray-800">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 p-2">
                      <CalendarIcon className="size-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appointment Details</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <CalendarIcon className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDate(appointment.appointmentDate)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Appointment Date</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <Clock className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatTime(appointment.appointmentTime)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Appointment Time</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <Stethoscope className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.doctorName || appointment.doctor}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Doctor</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <FileText className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getAppointmentTypeDisplay(appointment.appointmentType)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Appointment Type</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <Activity className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1">
                        <div className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusDisplay(appointment.status).color}`}>
                          {getStatusDisplay(appointment.status).label}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Status</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Symptoms and Additional Information */}
              {appointment.reason && (
                <div className="mt-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <h3 className="mb-4 flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                    <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 p-2">
                      <FileText className="size-4 text-white" />
                    </div>
                    Symptoms & Reason for Visit
                  </h3>
                  <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
                    <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                      {appointment.reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Medical Attachments */}
              {appointment.attachments && appointment.attachments.length > 0 && (
                <div className="mt-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-6 dark:from-purple-900/20 dark:to-pink-900/20">
                  <h3 className="mb-4 flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                    <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2">
                      <Paperclip className="size-4 text-white" />
                    </div>
                    Medical Attachments
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {appointment.attachments.map((attachment, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-lg">
                        <Image
                          src={attachment}
                          alt={`Medical attachment ${index + 1}`}
                          width={300}
                          height={200}
                          className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="flex h-full items-center justify-center">
                            <a
                              href={attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-transform duration-300 hover:scale-110"
                            >
                              <ExternalLink className="size-5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Information */}
              <div className="mt-6 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-6 dark:from-gray-700 dark:to-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Appointment Information</h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>Booking Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(appointment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Booking Time:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(appointment.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-gradient-to-r from-rose-100 to-amber-100 p-3 dark:from-rose-900/20 dark:to-amber-900/20">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Important:</strong> Please arrive 15 minutes before your appointment time. You will receive an email confirmation shortly with additional details.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="size-4" />
                  Back to Homepage
                </Button>
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => router.push('/appointment-status')}
                  >
                    <Activity className="size-4" />
                    Check Status
                  </Button>
                  <Button
                    variant="default"
                    className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:from-rose-700 hover:to-amber-700"
                    onClick={() => router.push('/book-appointment')}
                  >
                    <CalendarIcon className="size-4" />
                    Book Another Appointment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (!appointmentId || !userId) ? (
          // When someone visits /success without proper parameters
          <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                <CalendarIcon className="size-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                No Appointment to Display
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                It looks like you haven&rsquo;t booked an appointment yet. Would you like to book one now?
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button 
                  className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700"
                  onClick={() => router.push('/book-appointment')}
                >
                  Book Appointment
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/')}
                >
                  Return to Home
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // When appointment lookup fails (existing error state)
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-white to-rose-50 shadow-xl dark:from-gray-800 dark:to-gray-900">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                Appointment Not Found
              </h2>
            </div>
            
            <div className="p-6">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <Clock className="size-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  We couldn&rsquo;t find your appointment details. This could be because:
                </p>
              </div>
              
              <ul className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                  <div className="mt-1 size-2 rounded-full bg-red-500"></div>
                  The appointment ID or user ID is incorrect
                </li>
                <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                  <div className="mt-1 size-2 rounded-full bg-red-500"></div>
                  The appointment has been cancelled or rescheduled
                </li>
                <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                  <div className="mt-1 size-2 rounded-full bg-red-500"></div>
                  There was a technical issue with our system
                </li>
              </ul>
              
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button 
                  className="flex-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700" 
                  onClick={() => router.push('/')}
                >
                  Return to Home
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/book-appointment')}
                >
                  Book New Appointment
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
