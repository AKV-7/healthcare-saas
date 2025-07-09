'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SimpleNavButton } from '@/components/SimpleNavButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CLOUDINARY_ASSETS } from '@/constants/cloudinary-assets';

const existingPatientSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot be more than 100 characters'),
  phone: z.string()
    .regex(/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian mobile number with +91'),
});

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const form = useForm<z.infer<typeof existingPatientSchema>>({
    resolver: zodResolver(existingPatientSchema),
    defaultValues: {
      name: '',
      phone: '+91',
    },
  });

  const onSubmit = async (values: z.infer<typeof existingPatientSchema>) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Call backend directly to bypass Next.js API route issues
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Using the working simple route
      const response = await fetch(`${backendUrl}/api/users/verify-by-name-phone-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('Patient verified successfully! Redirecting to booking...');
        // Store user data and redirect to book appointment
        const userData = {
          userId: result.data.userId,
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone
        };
        localStorage.setItem('registeredUser', JSON.stringify(userData));
        
        // Delay redirect to show success message
        setTimeout(() => {
          router.push(`/book-appointment?userId=${result.data.userId}&existing=true`);
        }, 1500);
      } else {
        setError(result.message || 'Patient not found. Please check your name and phone number, or register as a new patient.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Network error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <header className="relative z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <Image
                src={CLOUDINARY_ASSETS.icons['khushi-homoeo-logo.svg']}
                alt="Khushi Homoeopathic Clinic"
                width={150}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <div className="hidden lg:flex lg:gap-x-8">
            <Link href="/#hero" className="text-sm font-semibold leading-6 text-gray-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400">
              Home
            </Link>
            <Link href="/#doctors" className="text-sm font-semibold leading-6 text-gray-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400">
              Doctors
            </Link>
            <Link href="/#treatments" className="text-sm font-semibold leading-6 text-gray-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400">
              Treatments
            </Link>
            <Link href="/#contact" className="text-sm font-semibold leading-6 text-gray-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400">
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-4 lg:flex-1 lg:justify-end">
            <Link href="/register" className="text-sm font-semibold leading-6 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300">
              New Patient
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Hero Section with Form */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 size-96 animate-blob rounded-full bg-gradient-to-br from-rose-200/30 to-amber-200/30 blur-3xl dark:from-rose-800/30 dark:to-amber-800/30"></div>
          <div className="absolute bottom-0 right-0 size-96 animate-blob rounded-full bg-gradient-to-tl from-amber-200/30 to-rose-200/30 blur-3xl dark:from-amber-800/30 dark:to-rose-800/30" style={{ animationDelay: '2s' }}></div>
          <div className="absolute left-1/2 top-1/2 size-64 animate-blob rounded-full bg-gradient-to-br from-green-200/20 to-blue-200/20 blur-3xl dark:from-green-800/20 dark:to-blue-800/20" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Content - Enhanced with more visual elements */}
            <div className="space-y-8 text-center lg:text-left">
              <div>
                <div className="mb-6 inline-flex items-center rounded-full bg-gradient-to-r from-rose-100 to-amber-100 px-4 py-2 dark:from-rose-900/30 dark:to-amber-900/30">
                  <div className="mr-2 flex size-6 items-center justify-center rounded-full bg-green-500">
                    <svg className="size-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Existing Patient Portal</span>
                </div>
                
                <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl lg:text-6xl xl:text-7xl">
                  <span className="bg-gradient-to-r from-gray-900 via-rose-800 to-amber-800 bg-clip-text text-transparent dark:from-white dark:via-rose-300 dark:to-amber-300">
                    Welcome Back
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">Valued Patient</span>
                </h1>
                <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 md:text-xl lg:text-2xl">
                  Book your next appointment quickly and easily. Simply enter your name and phone number to get started.
                </p>
              </div>
              
              {/* Enhanced Feature Benefits with animations */}
              <div className="space-y-6">
                <div className="group flex items-center space-x-4 transition-all duration-300 hover:translate-x-2">
                  <div className="shrink-0">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 shadow-lg group-hover:shadow-xl dark:from-rose-900/30 dark:to-rose-800/30">
                      <svg className="size-7 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lightning Quick Access</h3>
                    <p className="text-gray-600 dark:text-gray-300">Instant access to your patient portal and seamless booking experience</p>
                  </div>
                </div>

                <div className="group flex items-center space-x-4 transition-all duration-300 hover:translate-x-2">
                  <div className="shrink-0">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 shadow-lg group-hover:shadow-xl dark:from-amber-900/30 dark:to-amber-800/30">
                      <svg className="size-7 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Complete Medical History</h3>
                    <p className="text-gray-600 dark:text-gray-300">Access your entire treatment journey and track your healing progress</p>
                  </div>
                </div>

                <div className="group flex items-center space-x-4 transition-all duration-300 hover:translate-x-2">
                  <div className="shrink-0">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-green-200 shadow-lg group-hover:shadow-xl dark:from-green-900/30 dark:to-green-800/30">
                      <svg className="size-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">24/7 Secure Access</h3>
                    <p className="text-gray-600 dark:text-gray-300">Round-the-clock secure access to your health information and records</p>
                  </div>
                </div>

                <div className="group flex items-center space-x-4 transition-all duration-300 hover:translate-x-2">
                  <div className="shrink-0">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg group-hover:shadow-xl dark:from-blue-900/30 dark:to-blue-800/30">
                      <svg className="size-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Personalized Care</h3>
                    <p className="text-gray-600 dark:text-gray-300">Tailored treatment plans and personalized health recommendations</p>
                  </div>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="rounded-2xl bg-white/50 p-6 backdrop-blur-sm dark:bg-gray-900/50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">5000+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Happy Patients</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">15+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Years Experience</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">98%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form - Enhanced with better styling */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-green-500/20 opacity-60 blur-3xl"></div>
              <div className="relative overflow-hidden rounded-3xl bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-gray-900/90">
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-gray-900/50"></div>
                <div className="relative px-8 py-12">
                  <div className="mb-10 text-center">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-amber-500 shadow-lg">
                      <svg className="size-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-gray-300">
                      Quick Booking
                    </h2>
                    <p className="mt-3 text-gray-600 dark:text-gray-300">Enter your name and phone to book an appointment</p>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      
                      {/* Name Field */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-3 flex items-center text-sm font-bold text-gray-700 dark:text-gray-200">
                              <svg className="mr-2 size-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Full Name *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Enter your full name"
                                  {...field}
                                  className="w-full rounded-xl border-2 border-gray-200 bg-white/50 p-4 text-gray-900 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:text-white dark:focus:border-rose-400 dark:focus:bg-gray-800"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  <svg className="size-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="mt-2 text-sm text-red-600" />
                            <p className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <svg className="mr-1 size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Enter the same name you used during registration.
                            </p>
                          </FormItem>
                        )}
                      />

                      {/* Phone Field */}
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-3 flex items-center text-sm font-bold text-gray-700 dark:text-gray-200">
                              <svg className="mr-2 size-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              Phone Number *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="tel"
                                  placeholder="+91 9876543210"
                                  {...field}
                                  className="w-full rounded-xl border-2 border-gray-200 bg-white/50 p-4 text-gray-900 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:text-white dark:focus:border-amber-400 dark:focus:bg-gray-800"
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
                                    
                                    form.setValue('phone', value);
                                  }}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  <svg className="size-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="mt-2 text-sm text-red-600" />
                            <p className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <svg className="mr-1 size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Enter the phone number you used during registration.
                            </p>
                          </FormItem>
                        )}
                      />

                      {/* Error Message - Enhanced */}
                      {error && (
                        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-5 dark:border-red-800 dark:from-red-900/20 dark:to-red-800/20">
                          <div className="flex">
                            <div className="shrink-0">
                              <div className="flex size-8 items-center justify-center rounded-full bg-red-500">
                                <svg className="size-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Verification Failed</h3>
                              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Success Message - Enhanced */}
                      {successMessage && (
                        <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-5 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/20">
                          <div className="flex">
                            <div className="shrink-0">
                              <div className="flex size-8 items-center justify-center rounded-full bg-green-500">
                                <svg className="size-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">Success!</h3>
                              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submit Button - Enhanced with better animations */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 px-8 py-5 text-lg font-bold text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-700 via-amber-700 to-rose-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                        <div className="relative flex items-center justify-center">
                          {isLoading ? (
                            <>
                              <svg className="mr-3 size-6 animate-spin" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="32">
                                  <animate attributeName="stroke-dasharray" dur="2s" values="0 64;32 32;0 64" repeatCount="indefinite" />
                                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-32;-64" repeatCount="indefinite" />
                                </circle>
                              </svg>
                              <span>Verifying Patient...</span>
                            </>
                          ) : (
                            <>
                              <svg className="mr-3 size-6 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h6a2 2 0 012 2v4m-6 8V7m-8 8h16l-2 5H6l-2-5z" />
                              </svg>
                              <span>Book Appointment</span>
                            </>
                          )}
                        </div>
                      </Button>

                      {/* Help Section - Enhanced */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-center space-x-4">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Need assistance?</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <a
                            href="tel:+919756077474"
                            className="group flex items-center justify-center rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 text-sm font-bold text-amber-700 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg dark:border-amber-600 dark:from-amber-900/20 dark:to-amber-800/20 dark:text-amber-200 dark:hover:border-amber-400"
                          >
                            <svg className="mr-2 size-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call Clinic
                          </a>
                          <SimpleNavButton
                            href="/appointment-status"
                            className="group flex items-center justify-center rounded-xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 px-6 py-4 text-sm font-bold text-rose-700 transition-all duration-300 hover:-translate-y-1 hover:border-rose-400 hover:shadow-lg dark:border-rose-600 dark:from-rose-900/20 dark:to-rose-800/20 dark:text-rose-200 dark:hover:border-rose-400"
                          >
                            <svg className="mr-2 size-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Check Status
                          </SimpleNavButton>
                        </div>
                      </div>

                      {/* Register Link - Enhanced */}
                      <div className="border-t border-gray-200 pt-8 dark:border-gray-700">
                        <div className="rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-6 text-center dark:from-gray-800/50 dark:to-gray-700/50">
                          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            Don&apos;t have an account? Join thousands of patients who trust us for their healing journey.
                          </p>
                          
                          <Link
                            href="/register"
                            className="group inline-flex items-center rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                          >
                            <svg className="mr-2 size-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Register as New Patient
                          </Link>
                        </div>
                      </div>

                      {/* Back to Homepage */}
                      <div className="text-center">
                        <Link
                          href="/"
                          className="group inline-flex items-center text-sm text-gray-500 transition-all duration-300 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400"
                        >
                          <svg className="mr-2 size-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back to Homepage
                        </Link>
                      </div>

                    </form>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
