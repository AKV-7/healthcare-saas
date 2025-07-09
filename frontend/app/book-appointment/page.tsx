'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { FileUploader } from '@/components/FileUploader';
import { SimpleNavButton } from '@/components/SimpleNavButton';
import { ThemeToggle } from '@/components/ThemeToggle';

const appointmentSchema = z.object({
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  appointmentTime: z.string().min(1, 'Appointment time is required'),
  doctor: z.string().min(1, 'Please select a doctor'),
  appointmentType: z.string().min(1, 'Please select appointment type'),
  symptoms: z.string().min(10, 'Please describe your symptoms (minimum 10 characters)'),
  additionalNotes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export default function BookAppointment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Get userId from URL or localStorage
  const userId =
    searchParams?.get('userId') ||
    (typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('userData') || '{}').userId
      : null);

  useEffect(() => {
    // Check if user just registered (priority)
    const registeredUser = localStorage.getItem('registeredUser');
    if (registeredUser) {
      const user = JSON.parse(registeredUser);
      console.log('Found registeredUser:', user);
      setUserData(user);
      // Clear the registration data since we've loaded it
      localStorage.removeItem('registeredUser');
      return;
    }
    
    // Fallback to existing userData (for backward compatibility)
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const user = JSON.parse(storedUserData);
      console.log('Found existing userData:', user);
      setUserData(user);
    }
  }, []);

  // Additional useEffect to validate user data and redirect if incomplete
  useEffect(() => {
    if (userData && (!userData.email || !userData.phone || userData.email.trim() === '' || userData.phone.trim() === '')) {
      console.log('❌ Incomplete user data detected:', userData);
      setError('Your contact information is incomplete. Please register or verify your details again.');
      
      // Redirect to registration after showing error
      setTimeout(() => {
        router.push('/register');
      }, 3000);
    }
  }, [userData, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointmentDate: '',
      appointmentTime: '',
      doctor: '',
      appointmentType: '',
      symptoms: '',
      additionalNotes: '',
    },
  });

  const onSubmit = async (data: AppointmentFormData) => {
    console.log('🚀 Starting appointment booking...');
    console.log('Form data:', data);
    console.log('User ID:', userId);
    console.log('User data:', userData);
    
    if (!userId) {
      setError('User ID not found. Please register first.');
      return;
    }

    // Validate that we have user email and phone
    if (!userData?.email || !userData?.phone) {
      console.log('❌ Patient information validation failed:');
      console.log('  userData:', userData);
      console.log('  email:', userData?.email);
      console.log('  phone:', userData?.phone);
      console.log('  email type:', typeof userData?.email);
      console.log('  phone type:', typeof userData?.phone);
      
      setError('Patient information is incomplete. Please register or provide your details first.');
      
      // Redirect to registration after showing error
      setTimeout(() => {
        router.push('/register');
      }, 3000);
      return;
    }

    console.log('✅ Patient information validation passed');
    console.log('  email:', userData.email);
    console.log('  phone:', userData.phone);

    setIsLoading(true);
    setError(null);

    try {
      // Check if this is a temporary user (from registration)
      const isTempUser = userData?.tempUser === true;

      // Upload files with better error handling
      const uploadedImageUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        console.log(`Attempting to upload ${uploadedFiles.length} files...`);
        
        for (const file of uploadedFiles) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            console.log(`Uploading file: ${file.name}`);
            const uploadResponse = await fetch('/api/upload-image', {
              method: 'POST',
              body: formData,
            });
            
            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              if (uploadResult.url) {
                uploadedImageUrls.push(uploadResult.url);
                console.log(`Successfully uploaded: ${file.name}`);
              }
            } else {
              console.error(`Upload failed for ${file.name}:`, uploadResponse.status);
            }
          } catch (uploadError) {
            console.error(`Error uploading file ${file.name}:`, uploadError);
            // Continue with other files
          }
        }
        
        if (uploadedImageUrls.length < uploadedFiles.length) {
          console.warn(`Only ${uploadedImageUrls.length} out of ${uploadedFiles.length} files uploaded successfully`);
        }
      }

      const appointmentData = {
        ...data,
        userId,
        patientName: userData?.name || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Unknown Patient',
        patientEmail: userData?.email,
        patientPhone: userData?.phone,
        attachments: uploadedImageUrls, // Add uploaded image URLs
        // Include user data for account creation if this is a temp user
        userData: isTempUser ? userData : undefined,
        isTempUser,
      };

      console.log('📋 Appointment data being sent:');
      console.log('  patientName:', appointmentData.patientName);
      console.log('  patientEmail:', appointmentData.patientEmail, '(type:', typeof appointmentData.patientEmail, ')');
      console.log('  patientPhone:', appointmentData.patientPhone, '(type:', typeof appointmentData.patientPhone, ')');
      console.log('  userId:', appointmentData.userId);
      console.log('  isTempUser:', appointmentData.isTempUser);
      console.log('Full appointment data:', JSON.stringify(appointmentData, null, 2));

      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();

      if (response.ok) {
        // Get the appointment ID from the correct location
        const appointmentId = result.appointment?._id || result.appointmentId || result._id;

        if (!appointmentId) {
          setError('Booking successful but no appointment ID received');
          return;
        }

        // If this was a temp user, update localStorage with the real user data
        if (isTempUser && result.user) {
          localStorage.setItem('userData', JSON.stringify(result.user));
        }

        // Redirect to success page with appointment details
        router.push(
          `/success?appointmentId=${appointmentId}&userId=${result.user?.userId || userId}`
        );
      } else {
        setError(result.message || 'Failed to book appointment');
      }
    } catch (error) {
      setError('Failed to book appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate available time slots from 8 AM to 9 PM
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00'
  ];

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Navigation */}
        <header className="relative z-50">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">          <div className="flex lg:flex-1">
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

        {/* No User ID Message */}
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/20">
              <svg className="size-12 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              Registration Required
            </h1>
            <p className="mb-8 max-w-md text-lg text-gray-600 dark:text-gray-300">
              Please register as a new patient first to book an appointment.
            </p>
            <div className="space-y-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:from-rose-700 hover:to-amber-700 hover:shadow-xl"
              >
                Register New Patient
              </Link>
              <div className="mt-4">
                <Link
                  href="/"
                  className="text-gray-600 transition-colors hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
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
            <Link href="/existing-patient" className="text-sm font-semibold leading-6 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300">
              Existing Patient
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 size-96 animate-blob rounded-full bg-gradient-to-br from-rose-200/30 to-amber-200/30 blur-3xl dark:from-rose-800/30 dark:to-amber-800/30"></div>
          <div className="animation-delay-2000 absolute bottom-0 right-0 size-96 animate-blob rounded-full bg-gradient-to-tl from-amber-200/30 to-rose-200/30 blur-3xl dark:from-amber-800/30 dark:to-rose-800/30"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-gray-900 via-rose-800 to-amber-800 bg-clip-text text-transparent dark:from-white dark:via-rose-300 dark:to-amber-300">
                Book Your
              </span>
              <br />
              <span className="text-gray-700 dark:text-gray-200">Appointment</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 md:text-xl">
              Schedule your consultation with our expert homeopathic doctors
            </p>
          </div>

          {/* Appointment Form */}
          <div className="rounded-3xl bg-white/80 p-8 shadow-2xl backdrop-blur-sm dark:bg-gray-900/80 md:p-12">
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex">
                  <svg className="size-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Patient Information Display */}
            {userData && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex">
                  <svg className="size-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Booking as: {userData.name}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      📧 {userData.email} • 📱 {userData.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {userData && (
              <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <h3 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-200">
                  Patient Information
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Name:</strong> {userData.firstName} {userData.lastName}
                </p>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Email:</strong> {userData.email}
                </p>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Phone:</strong> {userData.phone}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Appointment Date */}
                <div>
                  <label htmlFor="appointmentDate" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                    Appointment Date *
                  </label>
                  <input
                    {...register('appointmentDate')}
                    type="date"
                    min={today}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.appointmentDate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.appointmentDate.message}</p>
                  )}
                </div>

                {/* Appointment Time */}
                <div>
                  <label htmlFor="appointmentTime" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                    Appointment Time *
                  </label>
                  <select
                    {...register('appointmentTime')}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {errors.appointmentTime && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.appointmentTime.message}</p>
                  )}
                </div>

                {/* Doctor Selection */}
                <div>
                  <label htmlFor="doctor" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                    Select Doctor *
                  </label>
                  <select
                    {...register('doctor')}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Choose a doctor</option>
                    <option value="Dr. M. K. Singh">Dr. M. K. Singh - B.H.M.S. S.C.P.H+ (Mumbai)</option>
                    <option value="Dr. Rajni Singh">Dr. Rajni Singh - B.H.M.S., S.C.P.H (Mumbai)</option>
                  </select>
                  {errors.doctor && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.doctor.message}</p>
                  )}
                </div>

                {/* Appointment Type */}
                <div>
                  <label htmlFor="appointmentType" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                    Appointment Type *
                  </label>
                  <select
                    {...register('appointmentType')}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="initial-consultation">Initial Consultation</option>
                    <option value="follow-up">Follow-up Treatment</option>
                    <option value="chronic-condition">Chronic Condition Management</option>
                    <option value="pediatric-consultation">Pediatric Consultation</option>
                    <option value="women-health">Women&apos;s Health Consultation</option>
                    <option value="mental-health">Mental Health Consultation</option>
                    <option value="skin-treatment">Skin Condition Treatment</option>
                    <option value="joint-pain">Joint Pain & Arthritis</option>
                    <option value="emergency">Urgent Consultation</option>
                  </select>
                  {errors.appointmentType && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.appointmentType.message}</p>
                  )}
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <label htmlFor="symptoms" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                  Describe Your Symptoms *
                </label>
                <textarea
                  {...register('symptoms')}
                  rows={4}
                  placeholder="Please describe your current symptoms and health concerns..."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {errors.symptoms && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.symptoms.message}</p>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label htmlFor="additionalNotes" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                  Additional Notes (Optional)
                </label>
                <textarea
                  {...register('additionalNotes')}
                  rows={3}
                  placeholder="Any additional information you'd like to share..."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Medical Images Upload */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                  Medical Images or Documents (Optional)
                </label>
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  Upload any relevant medical reports, X-rays, test results, or photos of your condition to help the doctor better understand your case.
                </p>
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-colors hover:border-rose-400 hover:bg-rose-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-rose-500 dark:hover:bg-rose-900/10">
                  <FileUploader
                    files={uploadedFiles}
                    onChange={setUploadedFiles}
                  />
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} selected:
                    </p>
                    <ul className="mt-1 space-y-1">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between rounded bg-gray-100 px-3 py-2 text-sm dark:bg-gray-700">
                          <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:from-rose-700 hover:to-amber-700 hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="-ml-1 mr-3 size-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Booking Appointment...
                    </>
                  ) : (
                    'Book Appointment'
                  )}
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-1 hover:border-rose-600 hover:text-rose-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-rose-400 dark:hover:text-rose-400"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link href="/" className="block">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg"
                  alt="Khushi Homoeopathic Clinic"
                  width={200}
                  height={60}
                  className="h-12 w-auto"
                />
              </Link>
              <p className="mt-4 max-w-md text-gray-300">
                Providing natural and effective homeopathic treatments for over 15 years. 
                Your health is our priority, and we&apos;re committed to helping you achieve lasting wellness.
              </p>
            </div>
            
            <div>
              <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <SimpleNavButton 
                    href="/" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                  >
                    Home
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton 
                    href="/register" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                  >
                    Register
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton 
                    href="/existing-patient" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                  >
                    Patient Login
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
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 text-lg font-semibold">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-300">+1 (555) 123-4567</li>
                <li className="text-gray-300">info@khushihomoeo.com</li>
                <li className="text-gray-300">123 Health Street<br />Medical District</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center justify-between border-t border-gray-800 pt-8 sm:flex-row">
            <p className="text-gray-400">
              © 2024 Khushi Homoeopathic Clinic. All rights reserved.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex items-center rounded-md border border-gray-700 px-4 py-2 text-xs font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-white sm:mt-0"
            >
              <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
