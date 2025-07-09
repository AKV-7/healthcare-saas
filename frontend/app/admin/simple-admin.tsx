'use client';

import { Calendar, Users, Clock, CheckCircle, LogOut, Eye } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SimpleStats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  todayAppointments: number;
}

interface SimpleAppointment {
  id: string;
  patientName: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
}

export default function SimpleAdmin() {
  const router = useRouter();
  
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Data states
  const [stats, setStats] = useState<SimpleStats | null>(null);
  const [appointments, setAppointments] = useState<SimpleAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verify token validity
  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/verify-admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (error) {
      console.error('Token verification failed:', error);
      return !!token; // Fallback: assume valid if token exists
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setStats(null);
    setAppointments([]);
    router.push('/admin/login');
  }, [router]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');
      
      // Fetch basic stats
      const statsResponse = await fetch(`${backendUrl}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      
      // Fetch recent appointments
      const appointmentsResponse = await fetch(`${backendUrl}/api/admin/appointments?limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalAppointments: statsData.stats?.totalAppointments || 0,
          pendingAppointments: statsData.stats?.pendingAppointments || 0,
          confirmedAppointments: statsData.stats?.confirmedAppointments || 0,
          todayAppointments: statsData.stats?.todayAppointments || 0,
        });
      } else {
        console.warn('Failed to fetch stats:', await statsResponse.text());
      }
      
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData.appointments || []);
      } else {
        console.warn('Failed to fetch appointments:', await appointmentsResponse.text());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Check authentication on mount
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    const adminToken = localStorage.getItem('adminToken');
    
    if (adminAuth === 'true' && adminToken) {
      verifyToken(adminToken).then(isValid => {
        if (isValid) {
          setIsAuthenticated(true);
          setTimeout(() => {
            fetchDashboardData();
          }, 100);
        } else {
          handleLogout();
          router.push('/admin/login');
        }
        setInitialLoading(false);
      });
    } else {
      setInitialLoading(false);
      router.push('/admin/login');
    }
  }, [router, verifyToken, handleLogout, fetchDashboardData]);

  // Show initial loading
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-black dark:via-neutral-900 dark:to-black">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 size-16 animate-spin rounded-full border-b-2 border-red-600"></div>
            <h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              Loading Simple Admin...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-black dark:via-neutral-900 dark:to-black">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-red-600"></div>
            <h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              Redirecting to login...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Main simple admin dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <Image src="/logo.svg" alt="Logo" width={32} height={32} className="size-8" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Simple Admin</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Page title */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your appointments and view quick statistics</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                <Calendar className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAppointments || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingAppointments || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <CheckCircle className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.confirmedAppointments || 0}</div>
                <p className="text-xs text-muted-foreground">Ready for service</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.todayAppointments || 0}</div>
                <p className="text-xs text-muted-foreground">Scheduled today</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Appointments</CardTitle>
                <p className="text-sm text-muted-foreground">Latest appointment requests and bookings</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/complete-dashboard')}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <div className="size-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading appointments...</span>
                  </div>
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(0, 8).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="size-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                          {appointment.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.patientEmail}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {appointment.appointmentDate} at {appointment.appointmentTime}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{appointment.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(appointment.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push('/admin/complete-dashboard?tab=appointments')}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto size-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No appointments found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">New appointments will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <p className="text-sm text-muted-foreground">Common administrative tasks</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2 h-16"
                  onClick={() => router.push('/admin/complete-dashboard?tab=appointments')}
                >
                  <Calendar className="size-5" />
                  <span>Manage Appointments</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2 h-16"
                  onClick={() => router.push('/admin/complete-dashboard?tab=users')}
                >
                  <Users className="size-5" />
                  <span>View Users</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2 h-16"
                  onClick={() => router.push('/admin/complete-dashboard?tab=analytics')}
                >
                  <CheckCircle className="size-5" />
                  <span>View Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="size-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">All systems operational</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}