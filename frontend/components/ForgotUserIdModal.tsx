'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const forgotUserIdSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(13, 'Please enter a valid phone number with country code'),
});

interface ForgotUserIdModalProps {
  onUserIdRetrieved?: (userId: string) => void;
}

export function ForgotUserIdModal({ onUserIdRetrieved }: ForgotUserIdModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  const form = useForm<z.infer<typeof forgotUserIdSchema>>({
    resolver: zodResolver(forgotUserIdSchema),
    defaultValues: {
      email: '',
      phone: '+91',
    },
  });

  const onSubmit = async (values: z.infer<typeof forgotUserIdSchema>) => {
    setIsLoading(true);
    setError('');
    setSuccess(null);

    try {
      // Call backend directly instead of going through frontend API route
      const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/forgot-user-id`;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(result.data);
        if (onUserIdRetrieved) {
          onUserIdRetrieved(result.data.userId);
        }
      } else {
        setError(result.message || 'Failed to retrieve user ID. Please check your details and try again.');
      }
    } catch (error) {
      console.error('Forgot User ID error:', error);
      setError('Network error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError('');
    setSuccess(null);
    form.reset({
      email: '',
      phone: '+91',
    });
  };

  const handleUseUserId = () => {
    if (success && onUserIdRetrieved) {
      onUserIdRetrieved(success.userId);
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="group w-full rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 text-sm font-bold text-blue-700 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg dark:border-blue-600 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-200 dark:hover:border-blue-400"
        >
          <svg className="mr-2 size-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Forgot User ID?
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-gray-900/90 sm:max-w-[500px]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-gray-900/50"></div>
        <div className="relative px-8 py-12">
          <DialogHeader className="mb-10 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-amber-500 shadow-lg">
              <svg className="size-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m0 0a2 2 0 01-2 2m2-2a2 2 0 012 2M9 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2H9z" />
              </svg>
            </div>
            <DialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-gray-300">
              Retrieve Your User ID
            </DialogTitle>
            <DialogDescription className="mt-3 text-gray-600 dark:text-gray-300">
              Enter your email and phone number to retrieve your Patient ID. We'll verify your details and show your User ID instantly.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="space-y-8">
              <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-6 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/20">
                <div className="flex">
                  <div className="shrink-0">
                    <div className="flex size-8 items-center justify-center rounded-full bg-green-500">
                      <svg className="size-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">User ID Found!</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Hello {success.firstName} {success.lastName}, your Patient ID is:
                    </p>
                    <div className="mt-3 flex items-center space-x-3">
                      <div className="rounded-lg bg-white/80 px-4 py-2 text-center dark:bg-gray-800/80">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Patient ID</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{success.userId}</div>
                      </div>
                      <Button
                        onClick={() => navigator.clipboard.writeText(success.userId)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                      >
                        <svg className="mr-1 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleUseUserId}
                  className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 px-8 py-4 text-lg font-bold text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-700 via-amber-700 to-rose-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="relative flex items-center justify-center">
                    <svg className="mr-3 size-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Use This ID</span>
                  </div>
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 rounded-xl border-2 border-gray-200 bg-white/50 px-8 py-4 text-lg font-bold text-gray-700 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-400 hover:shadow-lg dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-200 dark:hover:border-gray-400"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Email Field - Enhanced to match existing patient page */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3 flex items-center text-sm font-bold text-gray-700 dark:text-gray-200">
                        <svg className="mr-2 size-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email Address *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            {...field}
                            className="w-full rounded-xl border-2 border-gray-200 bg-white/50 p-4 text-gray-900 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:text-white dark:focus:border-amber-400 dark:focus:bg-gray-800"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="size-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="mt-2 text-sm text-red-600" />
                    </FormItem>
                  )}
                />

                {/* Phone Field - Enhanced to match existing patient page */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-3 flex items-center text-sm font-bold text-gray-700 dark:text-gray-200">
                        <svg className="mr-2 size-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Phone Number *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="tel"
                            placeholder="+919756077474"
                            {...field}
                            className="w-full rounded-xl border-2 border-gray-200 bg-white/50 p-4 text-gray-900 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:text-white dark:focus:border-rose-400 dark:focus:bg-gray-800"
                            onChange={(e) => {
                              let value = e.target.value;
                              // Ensure +91 prefix is always present
                              if (!value.startsWith('+91')) {
                                if (value.startsWith('91')) {
                                  value = '+' + value;
                                } else if (value.startsWith('+')) {
                                  // If user types + but not +91, reset to +91
                                  if (!value.startsWith('+91')) {
                                    value = '+91';
                                  }
                                } else {
                                  // If user types numbers without +91, prepend +91
                                  value = '+91' + value.replace(/^\+?91?/, '');
                                }
                              }
                              field.onChange(value);
                            }}
                            onKeyDown={(e) => {
                              // Prevent deletion of +91 prefix
                              if (e.key === 'Backspace' && field.value.length <= 3) {
                                e.preventDefault();
                              }
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
                        Enter your 10-digit mobile number (country code +91 is automatically added)
                      </p>
                    </FormItem>
                  )}
                />

                {/* Error Message - Enhanced to match existing patient page */}
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

                {/* Submit Button - Enhanced to match existing patient page */}
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
                        <span>Retrieving User ID...</span>
                      </>
                    ) : (
                      <>
                        <svg className="mr-3 size-6 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Retrieve User ID</span>
                      </>
                    )}
                  </div>
                </Button>

                <div className="text-center">
                  <div className="mb-4 rounded-xl bg-rose-50 p-4 dark:bg-rose-900/20">
                    <div className="flex items-center justify-center space-x-2 text-rose-600 dark:text-rose-400">
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold">Information Required</span>
                    </div>
                    <p className="mt-2 text-xs text-rose-600/80 dark:text-rose-400/80">
                      Please use the exact email and phone number you provided during your initial registration
                    </p>
                  </div>
                </div>

              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
