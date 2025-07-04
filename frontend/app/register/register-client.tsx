'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ThemeToggle } from '../../components/ThemeToggle';

const schema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot be more than 50 characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot be more than 50 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say'], {
    required_error: 'Please select your gender'
  }),
  address: z.object({
    street: z.string()
      .min(1, 'Street address is required')
      .max(100, 'Street address cannot be more than 100 characters'),
    city: z.string()
      .min(1, 'City is required')
      .max(50, 'City cannot be more than 50 characters'),
    state: z.string()
      .min(1, 'State is required')
      .max(50, 'State cannot be more than 50 characters'),
    zip: z.string()
      .min(1, 'ZIP code is required')
      .max(15, 'ZIP code cannot be more than 15 characters'),
    country: z.string()
      .min(1, 'Country is required')
      .max(50, 'Country cannot be more than 50 characters')
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      }
    }
  });
  
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      // Remove confirmPassword from the data before sending
      const { confirmPassword, ...registrationData } = data;
      
      // Format the data to match the database schema
      const formattedData = {
        ...registrationData,
        role: 'patient', // Default role for new registrations
        dateOfBirth: new Date(registrationData.dateOfBirth).toISOString()
      };

      // TODO: Send to backend API for user registration
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formattedData)
      // });

      // For now, generate a temporary user ID for the booking flow
      const tempUserId = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Store user data temporarily (remove password for security)
      const { password, ...safeUserData } = formattedData;
      const tempUserData = {
        ...safeUserData,
        userId: tempUserId,
        tempUser: true,
        createdAt: new Date().toISOString(),
      };

      // Store in localStorage for the booking flow
      localStorage.setItem('userData', JSON.stringify(tempUserData));

      // Redirect to book appointment page
      router.push(`/book-appointment?userId=${tempUserId}`);
    } catch (error) {
      console.error('Registration failed:', error);
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
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                          First Name *
                        </label>
                        <input
                          {...form.register('firstName')}
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                          placeholder="Enter your first name"
                        />
                        {form.formState.errors.firstName && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Last Name *
                        </label>
                        <input
                          {...form.register('lastName')}
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                          placeholder="Enter your last name"
                        />
                        {form.formState.errors.lastName && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Password *
                        </label>
                        <input
                          {...form.register('password')}
                          type="password"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                          placeholder="At least 12 characters with special chars"
                        />
                        {form.formState.errors.password && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Confirm Password *
                        </label>
                        <input
                          {...form.register('confirmPassword')}
                          type="password"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                          placeholder="Confirm your password"
                        />
                        {form.formState.errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Phone Number *
                        </label>
                        <input
                          {...form.register('phone')}
                          type="tel"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                          placeholder="+1234567890"
                        />
                        {form.formState.errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Date of Birth *
                        </label>
                        <input
                          {...form.register('dateOfBirth')}
                          type="date"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                        />
                        {form.formState.errors.dateOfBirth && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.dateOfBirth.message}</p>
                        )}
                      </div>
                    </div>

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
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                      {form.formState.errors.gender && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.gender.message}</p>
                      )}
                    </div>

                    {/* Address Section */}
                    <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Address Information</h3>
                      
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Street Address *
                        </label>
                        <input
                          {...form.register('address.street')}
                          type="text"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                          placeholder="123 Main Street, Apt 4B"
                        />
                        {form.formState.errors.address?.street && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.address.street.message}</p>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                            City *
                          </label>
                          <input
                            {...form.register('address.city')}
                            type="text"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                            placeholder="New York"
                          />
                          {form.formState.errors.address?.city && (
                            <p className="mt-1 text-sm text-red-600">{form.formState.errors.address.city.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                            State/Province *
                          </label>
                          <input
                            {...form.register('address.state')}
                            type="text"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                            placeholder="NY"
                          />
                          {form.formState.errors.address?.state && (
                            <p className="mt-1 text-sm text-red-600">{form.formState.errors.address.state.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                            ZIP/Postal Code *
                          </label>
                          <input
                            {...form.register('address.zip')}
                            type="text"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                            placeholder="10001"
                          />
                          {form.formState.errors.address?.zip && (
                            <p className="mt-1 text-sm text-red-600">{form.formState.errors.address.zip.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Country *
                          </label>
                          <select
                            {...form.register('address.country')}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-rose-400"
                          >
                            <option value="">Select Country</option>
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="India">India</option>
                            <option value="Australia">Australia</option>
                            <option value="Germany">Germany</option>
                            <option value="France">France</option>
                            <option value="Other">Other</option>
                          </select>
                          {form.formState.errors.address?.country && (
                            <p className="mt-1 text-sm text-red-600">{form.formState.errors.address.country.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
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
                      ) : (
                        'Create Account & Continue'
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                      By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </p>

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
