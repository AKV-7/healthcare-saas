'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ThemeToggle } from '@/components/ThemeToggle';

// Simplified schema - removed password, added optional address, replaced dateOfBirth with age
const schema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot be more than 100 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  phone: z.string()
    .regex(/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian mobile number with +91'),
  age: z.string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 120;
    }, 'Age must be between 1 and 120 years'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Please select your gender'
  }),
  address: z.string()
    .max(200, 'Address cannot be more than 200 characters')
    .optional()
});

export default function RegisterClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '+91',
      age: '',
      gender: '',
      address: ''
    }
  });
  
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          age: parseInt(data.age)
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Store user data for booking flow
        const userData = {
          userId: result.data.userId,
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone
        };
        localStorage.setItem('registeredUser', JSON.stringify(userData));
        
        // Redirect to book appointment page after 2 seconds
        setTimeout(() => {
          router.push(`/book-appointment?userId=${result.data.userId}&registered=true`);
        }, 2000);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setError('Network error. Please check your connection and try again.');
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
                src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg"
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
            <Link href="/existing-patient" className="text-sm font-semibold leading-6 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300">
              Existing Patient
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Hero Section with Form */}
      <section className="relative overflow-hidden py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 size-96 animate-blob rounded-full bg-gradient-to-br from-rose-200/30 to-amber-200/30 blur-3xl dark:from-rose-800/30 dark:to-amber-800/30"></div>
          <div className="animation-delay-2000 absolute bottom-0 right-0 size-96 animate-blob rounded-full bg-gradient-to-tl from-amber-200/30 to-rose-200/30 blur-3xl dark:from-amber-800/30 dark:to-rose-800/30"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div>
                <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                  <span className="bg-gradient-to-r from-gray-900 via-rose-800 to-amber-800 bg-clip-text text-transparent dark:from-white dark:via-rose-300 dark:to-amber-300">
                    Register as
                  </span>
                  <br />
                  <span className="text-gray-700 dark:text-gray-200">New Patient</span>
                </h1>
                <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 md:text-xl">
                  Join thousands of patients who have found natural healing through our expert homeopathic treatments. Your journey to better health starts here.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="shrink-0">
                    <div className="flex size-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                      <svg className="size-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Safe & Natural</h3>
                    <p className="text-gray-600 dark:text-gray-300">100% natural homeopathic remedies with no side effects</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="shrink-0">
                    <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <svg className="size-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expert Care</h3>
                    <p className="text-gray-600 dark:text-gray-300">Experienced doctors with proven track record</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="shrink-0">
                    <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <svg className="size-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Relief</h3>
                    <p className="text-gray-600 dark:text-gray-300">Fast-acting treatments for lasting wellness</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-rose-500/20 to-amber-500/20 opacity-50 blur-2xl"></div>
              <div className="relative overflow-hidden rounded-3xl bg-white/80 shadow-2xl backdrop-blur-sm dark:bg-gray-900/80">
                <div className="px-8 py-10">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Registration</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">Please fill in your details to get started</p>
                  </div>                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Display Success Message */}
                    {success && (
                      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center">
                          <svg className="mr-2 size-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="font-medium text-green-800">Registration successful! Redirecting to book appointment...</p>
                        </div>
                      </div>
                    )}

                    {/* Display Error Message */}
                    {error && (
                      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex items-center">
                          <svg className="mr-2 size-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <p className="text-red-800">{error}</p>
                        </div>
                      </div>
                    )}

                    {/* Full Name */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Full Name *
                      </label>
                      <input
                        {...form.register('name')}
                        type="text"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                        placeholder="Enter your full name"
                      />
                      {form.formState.errors.name && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Email Address *
                      </label>
                      <input
                        {...form.register('email')}
                        type="email"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                        placeholder="your.email@example.com"
                      />
                      {form.formState.errors.email && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Phone and Age */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Phone Number *
                        </label>
                        <input
                          {...form.register('phone')}
                          type="tel"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                          placeholder="+91 9876543210"
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
                        {form.formState.errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Indian mobile number with +91</p>
                      </div>
                      
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Age *
                        </label>
                        <input
                          {...form.register('age')}
                          type="number"
                          min="1"
                          max="120"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                          placeholder="Enter your age"
                        />
                        {form.formState.errors.age && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.age.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Gender *
                      </label>
                      <select
                        {...form.register('gender')}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {form.formState.errors.gender && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.gender.message}</p>
                      )}
                    </div>

                    {/* Address (Optional) */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Address (Optional)
                      </label>
                      <textarea
                        {...form.register('address')}
                        rows={3}
                        placeholder="Enter your address (optional)"
                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                      />
                      {form.formState.errors.address && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.address.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || success}
                      className="w-full rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:from-rose-700 hover:to-amber-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <svg className="mr-3 size-5 animate-spin" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="32">
                              <animate attributeName="stroke-dasharray" dur="2s" values="0 64;32 32;0 64" repeatCount="indefinite" />
                              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-32;-64" repeatCount="indefinite" />
                            </circle>
                          </svg>
                          Creating Account...
                        </div>
                      ) : success ? (
                        'Redirecting to Book Appointment...'
                      ) : (
                        'Create Account'
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                      By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </p>

                    <div className="text-center">
                      <Link
                        href="/existing-patient"
                        className="inline-flex items-center text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                      >
                        Already have an account? Sign in here
                      </Link>
                    </div>

                    <div className="text-center">
                      <Link
                        href="/"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400"
                      >
                        <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Homepage
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
