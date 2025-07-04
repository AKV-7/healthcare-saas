'use client';

import { User, CalendarIcon, Clock, ArrowLeft, CheckCircle, Phone, Mail } from 'lucide-react';
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
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    userId: string;
  };
}

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams?.get('appointmentId');
  const userId = searchParams?.get('userId');
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
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
    }
  }, [appointmentId, userId, fetchAppointmentDetails]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
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
            Appointment Booked!
          </h1>
          <div className="space-y-2">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Soon you will receive a mail regarding confirmation of your booking.
            </p>
            <p className="text-base font-medium text-rose-600 dark:text-rose-400">
              Please save your User ID to check appointment status.
            </p>
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
                          {appointment.user.firstName} {appointment.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
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
                    
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <User className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-mono font-medium text-gray-900 dark:text-white">
                          {appointment.user.userId}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Patient ID</p>
                      </div>
                    </div>
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <User className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.doctor}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Doctor</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-600">
                        <CheckCircle className="size-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.appointmentType}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment ID Section */}
              <div className="mt-6 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-6 dark:from-gray-700 dark:to-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Your Appointment Reference</h3>
                <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 p-2">
                      <CheckCircle className="size-4 text-white" />
                    </div>
                    <code className="font-mono text-lg font-semibold text-gray-900 dark:text-white">{appointment.id}</code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(appointment.id, 'id')}
                    className="ml-4"
                  >
                    {copied === 'id' ? 'Copied!' : 'Copy ID'}
                  </Button>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <strong>Important:</strong> Please save this reference ID. You&apos;ll need it to check your appointment status or make any changes.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button 
                  className="flex-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700" 
                  onClick={() => router.push('/')}
                >
                  Return to Home
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/appointment-status')}
                >
                  Check Appointment Status
                </Button>
              </div>
            </div>
          </div>
        ) : (
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
                  We couldn&apos;t find your appointment details. This could be because:
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
