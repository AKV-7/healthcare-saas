'use client';

 
import { Calendar, Users, Clock, CheckCircle, Search, Eye, XCircle, Save, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatTime, fetchWithRetry } from '@/lib/utils';

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalUsers: number;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  reason: string;
  status: string;
  doctorName: string;
  attachments?: string[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  notes?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Alert {
  type: 'success' | 'error';
  message: string;
}

interface EditedAppointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

export default function AdminDashboard() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Dashboard data
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalUsers: 0,
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [alert, setAlert] = useState<Alert | null>(null);
  const [activeTab, setActiveTab] = useState('appointments');
  
  // Modal state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAppointment, setEditedAppointment] = useState<EditedAppointment | null>(null);
  
  // Delete all appointments modal state
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Delete all users modal state
  const [showDeleteAllUsersModal, setShowDeleteAllUsersModal] = useState(false);
  const [userPasskeyInput, setUserPasskeyInput] = useState('');
  const [userConfirmationText, setUserConfirmationText] = useState('');
  const [isDeletingUsers, setIsDeletingUsers] = useState(false);
  
  // Pagination state for appointments
  const [appointmentPage, setAppointmentPage] = useState(1);
  const appointmentLimit = 20;
  const [appointmentTotal, setAppointmentTotal] = useState(0);
  
  // Pagination state for users
  const [userPage, setUserPage] = useState(1);
  const userLimit = 20;
  const [userTotal, setUserTotal] = useState(0);
  
  // Reports pagination state
  const [reportsPage, setReportsPage] = useState(1);
  const reportsLimit = 20;
  // const [reportsTotal, setReportsTotal] = useState(0);
  
  const router = useRouter();
  
  // Add debounce timer ref
  // const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced fetch function
  // const debouncedFetch = useCallback((callback: () => void, delay = 300) => {
  //   if (debounceTimerRef.current) {
  //     clearTimeout(debounceTimerRef.current);
  //   }
    
  //   debounceTimerRef.current = setTimeout(() => {
  //     callback();
  //   }, delay);
  // }, []);

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
      return !!token;
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setStats({
      totalAppointments: 0,
      pendingAppointments: 0,
      confirmedAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      totalUsers: 0
    });
    router.push('/admin/login');
  }, [router]);

  // Fetch dashboard data with debounce
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      };
      // Fetch stats from frontend API
      const statsResponse = await fetchWithRetry('/api/analytics/dashboard', { 
        headers,
        cache: 'no-store'
      });
      // Fetch appointments with pagination
      setTimeout(async () => {
        try {
          const appointmentsResponse = await fetchWithRetry(`/api/admin/appointments?page=${appointmentPage}&limit=${appointmentLimit}`, { 
            headers,
            cache: 'no-store'
          });
          if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            setAppointments(appointmentsData.data || []);
            setAppointmentTotal(appointmentsData.total || 0);
          } else {
            console.error('Failed to fetch appointments:', appointmentsResponse.statusText);
          }
        } catch (error) {
          console.error('Error fetching appointments:', error);
          setAppointments([]);
        }
      }, 1500);
      
      // Fetch users from frontend API with a longer delay
      setTimeout(async () => {
        try {
          const usersResponse = await fetchWithRetry(`/api/admin/users?page=${userPage}&limit=${userLimit}`, { 
            headers,
            cache: 'no-store'
          });
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            const mappedUsers = (usersData.data || []).map((user: any) => ({
              id: user._id || user.id || user.userId, // fallback for legacy
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status || (user.isActive ? 'active' : 'inactive'),
            }));
            setUsers(mappedUsers);
            setUserTotal(usersData.total || 0);
          } else {
            console.error('Failed to fetch users:', usersResponse.statusText);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
          setUsers([]);
        }
      }, 3000);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Stats data:', statsData); // Debug log
        
        // Ensure we have a valid stats object with all required fields
        const validStats = {
          totalAppointments: 0,
          pendingAppointments: 0,
          confirmedAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          totalUsers: 0,
          // Use the stats data directly now that it's not wrapped in a stats object
          ...statsData
        };
        
        setStats(validStats);
      } else {
        console.error('Failed to fetch stats:', statsResponse.statusText);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      // Set loading to false after a minimum time to prevent flickering
      setTimeout(() => setLoading(false), 500);
    }
  }, [isAuthenticated, appointmentPage, userPage]);

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



  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Show initial loading
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-black dark:via-neutral-900 dark:to-black">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 size-16 animate-spin rounded-full border-b-2 border-red-600"></div>
            <h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              Loading Admin Dashboard...
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
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 size-16 animate-spin rounded-full border-b-2 border-red-600"></div>
            <h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              Redirecting to login...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  // Filtered appointments based on search and filters
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearchTerm = appointment.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              appointment.user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatusFilter = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesDateFilter = dateFilter === 'all' || (
      dateFilter === 'today' && new Date(appointment.appointmentDate).toDateString() === new Date().toDateString()
    ) || (
      dateFilter === 'upcoming' && new Date(appointment.appointmentDate) > new Date()
    ) || (
      dateFilter === 'past' && new Date(appointment.appointmentDate) < new Date()
    );
    return matchesSearchTerm && matchesStatusFilter && matchesDateFilter;
  });

  // Filtered appointments with files for reports
  const filteredReports = appointments.filter(
    (appointment) => appointment.attachments && appointment.attachments.length > 0
  );
  // const paginatedReports = filteredReports.slice((reportsPage - 1) * reportsLimit, reportsPage * reportsLimit);
  const reportsTotalPages = Math.max(1, Math.ceil(filteredReports.length / reportsLimit));

  // Get status badge based on appointment status
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    };
    const { label, color } = statusMap[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
        {label}
      </span>
    );
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/appointments/admin/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        // Optimistically update the status in the UI
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === appointmentId ? { ...appointment, status: newStatus } : appointment
          )
        );
      } else {
        console.error('Failed to update appointment status:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  // Delete appointment
  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (response.ok) {
        // Remove the appointment from state
        setAppointments((prev) => prev.filter((appointment) => appointment.id !== appointmentId));
        setAlert({ type: 'success', message: 'Appointment deleted successfully' });
        setTimeout(() => setAlert(null), 3000);
      } else {
        console.error('Failed to delete appointment:', response.statusText);
        setAlert({ type: 'error', message: 'Failed to delete appointment' });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setAlert({ type: 'error', message: 'Error deleting appointment' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (response.ok) {
        // Remove the user from state
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        setAlert({ type: 'success', message: 'User deleted successfully' });
        setTimeout(() => setAlert(null), 3000);
      } else {
        console.error('Failed to delete user:', response.statusText);
        setAlert({ type: 'error', message: 'Failed to delete user' });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setAlert({ type: 'error', message: 'Error deleting user' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Function to handle opening edit mode
  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditedAppointment({
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: appointment.status
    });
    setIsEditing(true);
    setShowAppointmentModal(true);
  };
  
  // Function to save appointment changes
  const saveAppointmentChanges = async () => {
    if (!editedAppointment) return;
    
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/appointments/${editedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          appointmentDate: editedAppointment.appointmentDate,
          appointmentTime: editedAppointment.appointmentTime,
          status: editedAppointment.status
          // The backend already handles email notifications when status or date/time changes
        })
      });
      
      if (response.ok) {
        // Update the appointment in the state
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === editedAppointment.id 
              ? { 
                  ...apt, 
                  appointmentDate: editedAppointment.appointmentDate,
                  appointmentTime: editedAppointment.appointmentTime,
                  status: editedAppointment.status
                } 
              : apt
          )
        );
        
        setAlert({ 
          type: 'success', 
          message: 'Appointment updated successfully. Email notification sent to patient.' 
        });
        
        // Reset editing state
        setIsEditing(false);
        setEditedAppointment(null);
        setShowAppointmentModal(false);
        
        // Clear alert after 3 seconds
        setTimeout(() => setAlert(null), 3000);
      } else {
        const errorData = await response.json();
        setAlert({ 
          type: 'error', 
          message: errorData.message || 'Failed to update appointment' 
        });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setAlert({ 
        type: 'error', 
        message: 'An error occurred while updating the appointment' 
      });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Delete all appointments
  const deleteAllAppointments = async () => {
    if (confirmationText !== 'delete' || !passkeyInput) {
      setAlert({ type: 'error', message: 'Please type "delete" and enter the admin passkey to confirm' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/appointments/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ adminPasskey: passkeyInput }),
      });
      
      if (response.ok) {
        // Clear appointments from state
        setAppointments([]);
        setShowDeleteAllModal(false);
        setPasskeyInput('');
        setConfirmationText('');
        setAlert({ type: 'success', message: 'All appointments deleted successfully' });
        
        // Update stats
        const updatedStats = {
          ...stats,
          totalAppointments: 0,
          pendingAppointments: 0,
          confirmedAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0
        };
        setStats(updatedStats);
      } else {
        const errorData = await response.json();
        setAlert({ 
          type: 'error', 
          message: errorData.message || 'Failed to delete appointments. Invalid passkey or insufficient permissions.'
        });
      }
    } catch (error) {
      console.error('Error deleting all appointments:', error);
      setAlert({ 
        type: 'error', 
        message: 'An error occurred while deleting appointments'
      });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };
  
  // Delete all users
  const deleteAllUsers = async () => {
    if (userConfirmationText !== 'delete' || !userPasskeyInput) {
      setAlert({ type: 'error', message: 'Please type "delete" and enter the admin passkey to confirm' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    
    setIsDeletingUsers(true);
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ adminPasskey: userPasskeyInput }),
      });
      
      if (response.ok) {
        // Clear users from state
        setUsers([]);
        setShowDeleteAllUsersModal(false);
        setUserPasskeyInput('');
        setUserConfirmationText('');
        setAlert({ type: 'success', message: 'All users deleted successfully' });
        
        // Update stats
        const updatedStats = {
          ...stats,
          totalUsers: 0
        };
        setStats(updatedStats);
      } else {
        const errorData = await response.json();
        setAlert({ 
          type: 'error', 
          message: errorData.message || 'Failed to delete users. Invalid passkey or insufficient permissions.'
        });
      }
    } catch (error) {
      console.error('Error deleting all users:', error);
      setAlert({ 
        type: 'error', 
        message: 'An error occurred while deleting users'
      });
    } finally {
      setIsDeletingUsers(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Pagination controls for appointments
  const totalPages = Math.max(1, Math.ceil(appointmentTotal / appointmentLimit));
  const userTotalPages = Math.max(1, Math.ceil(userTotal / userLimit));

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <XCircle className="size-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>
      <main className="flex-1 space-y-6 p-6 md:p-8">
        {alert && (
          <div className={`p-4 mb-4 rounded-lg border ${
            alert.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
          }`}>
            {alert.message}
          </div>
        )}
        
        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all dark:bg-gray-800/80 dark:shadow-gray-900/30">
            <CardContent className="flex flex-row items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <Calendar className="size-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Appointments</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAppointments || 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all dark:bg-gray-800/80 dark:shadow-gray-900/30">
            <CardContent className="flex flex-row items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Confirmed</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.confirmedAppointments || 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all dark:bg-gray-800/80 dark:shadow-gray-900/30">
            <CardContent className="flex flex-row items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Users className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Users</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers || 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all dark:bg-gray-800/80 dark:shadow-gray-900/30">
            <CardContent className="flex flex-row items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="size-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Pending</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingAppointments || 0}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Appointments</h2>
        </div>
        

          {/* Tabs */}
          <div className="space-y-6">
            <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'appointments'
                    ? 'border-b-2 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('appointments')}
              >
                Appointments
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'border-b-2 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('users')}
              >
                Users
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'reports'
                    ? 'border-b-2 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('reports')}
              >
                Reports
              </button>
          </div>

          {/* Appointments Tab */}
          <div className={activeTab === 'appointments' ? 'block' : 'hidden'}>
              <Card className="border-none shadow-md dark:bg-gray-800/90 dark:shadow-gray-900/20">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Appointment Management</CardTitle>
              </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="sticky top-0 z-10 mb-6 rounded-xl bg-white/90 p-4 shadow-md backdrop-blur dark:bg-gray-800/80 dark:border dark:border-gray-700">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="relative w-[250px]">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search appointments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-rose-300 focus:ring-rose-300 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-rose-500 dark:focus:ring-rose-500"
                      />
                    </div>
                      
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value)}
                      >
                        <SelectTrigger className="w-[140px] border-gray-200 focus:border-rose-300 focus:ring-rose-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-rose-500 dark:focus:ring-rose-500">
                          <SelectValue placeholder="Status" />
                      </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="all" className="dark:text-gray-200 dark:hover:bg-gray-700">All Statuses</SelectItem>
                          <SelectItem value="pending" className="dark:text-gray-200 dark:hover:bg-gray-700">Pending</SelectItem>
                          <SelectItem value="confirmed" className="dark:text-gray-200 dark:hover:bg-gray-700">Confirmed</SelectItem>
                          <SelectItem value="completed" className="dark:text-gray-200 dark:hover:bg-gray-700">Completed</SelectItem>
                          <SelectItem value="cancelled" className="dark:text-gray-200 dark:hover:bg-gray-700">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                      
                      <Select
                        value={dateFilter}
                        onValueChange={(value) => setDateFilter(value)}
                      >
                        <SelectTrigger className="w-[140px] border-gray-200 focus:border-rose-300 focus:ring-rose-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-rose-500 dark:focus:ring-rose-500">
                          <SelectValue placeholder="Date" />
                      </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="all" className="dark:text-gray-200 dark:hover:bg-gray-700">All Dates</SelectItem>
                          <SelectItem value="today" className="dark:text-gray-200 dark:hover:bg-gray-700">Today</SelectItem>
                          <SelectItem value="upcoming" className="dark:text-gray-200 dark:hover:bg-gray-700">Upcoming</SelectItem>
                          <SelectItem value="past" className="dark:text-gray-200 dark:hover:bg-gray-700">Past</SelectItem>
                      </SelectContent>
                    </Select>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={fetchDashboardData} 
                          disabled={loading} 
                          variant="outline" 
                          className="border-gray-200 dark:border-gray-700 dark:bg-gray-700/50 dark:text-white dark:hover:bg-gray-600"
                        >
                    {loading ? 'Loading...' : 'Refresh'}
                  </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowDeleteAllModal(true)}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 flex items-center"
                        >
                          <Trash className="size-4 mr-1.5" />
                          Delete
                        </Button>
                </div>
                    </div>
                  </div>
                  
                {filteredAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-gray-500">
                      <Calendar className="mb-4 size-12 text-gray-300 dark:text-gray-700" />
                    <p className="text-lg font-semibold">No appointments found.</p>
                    <p className="text-sm">Try adjusting your filters or search.</p>
                  </div>
                ) : (
                    <>
                      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 dark:shadow-inner">
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-50 dark:bg-gray-800/60">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">Patient</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">Date & Time</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">Reason</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300">Status</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="dark:bg-gray-800/30">
                    {filteredAppointments.map((appointment) => (
                            <tr key={appointment.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors duration-150">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                    {appointment.user.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{appointment.user.firstName} {appointment.user.lastName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{appointment.user.email}</p>
                          </div>
                          </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(appointment.appointmentDate)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(appointment.appointmentTime)}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{appointment.appointmentType}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{appointment.reason}</td>
                              <td className="px-4 py-3">{getStatusBadge(appointment.status)}</td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end items-center gap-2">
                          <Select
                            value={appointment.status}
                            onValueChange={(value) => updateAppointmentStatus(appointment.id, value)}
                          >
                                    <SelectTrigger className="w-[100px] h-8 text-xs border-gray-200 focus:border-rose-300 focus:ring-rose-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-rose-500 dark:focus:ring-rose-500">
                              <SelectValue />
                            </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                      <SelectItem value="pending" className="dark:text-gray-200 dark:hover:bg-gray-700">Pending</SelectItem>
                                      <SelectItem value="confirmed" className="dark:text-gray-200 dark:hover:bg-gray-700">Confirmed</SelectItem>
                                      <SelectItem value="completed" className="dark:text-gray-200 dark:hover:bg-gray-700">Completed</SelectItem>
                                      <SelectItem value="cancelled" className="dark:text-gray-200 dark:hover:bg-gray-700">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowAppointmentModal(true);
                            }}
                                    className="hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                    title="View Details"
                                  >
                                    <Eye className="size-4 text-blue-600 dark:text-blue-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditAppointment(appointment)}
                                    className="hover:bg-amber-50 dark:hover:bg-amber-900/30"
                                    title="Edit Appointment"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteAppointment(appointment.id)}
                                    className="hover:bg-red-50 dark:hover:bg-red-900/30"
                                    title="Delete Appointment"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                          </Button>
                        </div>
                              </td>
                            </tr>
                    ))}
                        </tbody>
                      </table>
                  </div>
                  {/* Pagination Controls */}
                  <div className="flex justify-end items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={appointmentPage === 1}
                      onClick={() => setAppointmentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Page {appointmentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={appointmentPage === totalPages || totalPages === 0}
                      onClick={() => setAppointmentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </>
                )}
              </CardContent>
            </Card>
          </div>
        </div> {/* <-- This closes the Appointments Section div opened at line 708 */}

        {/* Users Tab */}
          <div className={activeTab === 'users' ? 'block' : 'hidden'}>
              <Card className="border-none shadow-md dark:bg-gray-800">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Users Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="sticky top-0 z-10 mb-6 rounded-xl bg-white/90 p-4 shadow-md backdrop-blur dark:bg-gray-800/90 dark:border dark:border-gray-700">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="relative w-[250px]">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-rose-300 focus:ring-rose-300 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-rose-500 dark:focus:ring-rose-500"
                        />
          </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={fetchDashboardData} 
                          disabled={loading} 
                          variant="outline" 
                          className="border-gray-200 dark:border-gray-700 dark:bg-gray-700/50 dark:text-white dark:hover:bg-gray-600"
                        >
                          {loading ? 'Loading...' : 'Refresh'}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowDeleteAllUsersModal(true)}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 flex items-center"
                        >
                          <Trash className="size-4 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                  {users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-gray-500">
                      <Users className="mb-4 size-12 text-gray-300 dark:text-gray-700" />
                      <p className="text-lg font-semibold">No users found.</p>
                      <p className="text-sm">Try adjusting your search.</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Role</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                                    user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 
                                    user.role === 'doctor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                                    user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>
                                    {user.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteUser(user.id)}
                                      className="hover:bg-red-50 dark:hover:bg-red-900/30"
                                      title="Delete User"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Pagination Controls */}
                      <div className="flex justify-end items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={userPage === 1}
                          onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Page {userPage} of {userTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={userPage === userTotalPages || userTotalPages === 0}
                          onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
          </div>

            {/* Reports Tab */}
            <div className={activeTab === 'reports' ? 'block' : 'hidden'}>
              <Card className="border-none shadow-md dark:bg-gray-800">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Appointments with Files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="sticky top-0 z-10 mb-6 flex flex-row items-center justify-between rounded-xl bg-white/90 p-4 shadow-md backdrop-blur dark:bg-gray-800/90 dark:border dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Showing all appointments with attached files
                    </p>
                    <Button 
                      onClick={fetchDashboardData} 
                      disabled={loading} 
                      variant="outline" 
                      className="border-gray-200 dark:border-gray-700 dark:bg-gray-700/50 dark:text-white dark:hover:bg-gray-600"
                    >
                      {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>
                  {appointments.filter(appointment => appointment.attachments && appointment.attachments.length > 0).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 size-12 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <p className="text-lg font-semibold">No appointments with files found.</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Patient</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Date & Time</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Reason</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Attachments</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.filter(appointment => appointment.attachments && appointment.attachments.length > 0).map((appointment) => (
                              <tr key={appointment.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                      {appointment.user.firstName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">{appointment.user.firstName} {appointment.user.lastName}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{appointment.user.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(appointment.appointmentDate)}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(appointment.appointmentTime)}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{appointment.reason}</td>
                                <td className="px-4 py-3">{getStatusBadge(appointment.status)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    {appointment.attachments && appointment.attachments.map((attachment, index) => (
                                      <a 
                                        key={index}
                                        href={attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center rounded-md bg-white px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 border border-gray-200 shadow-sm dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-gray-700 dark:border-gray-700"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        View File {index + 1}
                                      </a>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setShowAppointmentModal(true);
                                      }}
                                      className="hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                      title="View Details"
                                    >
                                      <Eye className="size-4 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteAppointment(appointment.id)}
                                      className="hover:bg-red-50 dark:hover:bg-red-900/30"
                                      title="Delete Appointment"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Pagination Controls */}
                      <div className="flex justify-end items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reportsPage === 1}
                          onClick={() => setReportsPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Page {reportsPage} of {reportsTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reportsPage === reportsTotalPages || reportsTotalPages === 0}
                          onClick={() => setReportsPage((p) => Math.min(reportsTotalPages, p + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
          </div>
        </div>
      </main>

      {/* Delete All Appointments Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="mb-4 text-xl font-bold text-red-600 dark:text-red-400">Delete All Appointments</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              This action will permanently delete <span className="font-bold">ALL</span> appointments in the system. This cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Admin Passkey
              </label>
              <Input
                type="password"
                placeholder="Enter admin passkey"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="border-gray-300 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Type "delete" to confirm
              </label>
              <Input
                type="text"
                placeholder="delete"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="border-gray-300 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setPasskeyInput('');
                  setConfirmationText('');
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteAllAppointments}
                disabled={isDeleting || confirmationText !== 'delete' || !passkeyInput}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete All Users Modal */}
      {showDeleteAllUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="mb-4 text-xl font-bold text-red-600 dark:text-red-400">Delete All Users</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              This action will permanently delete <span className="font-bold">ALL</span> users in the system. This cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Admin Passkey
              </label>
              <Input
                type="password"
                placeholder="Enter admin passkey"
                value={userPasskeyInput}
                onChange={(e) => setUserPasskeyInput(e.target.value)}
                className="border-gray-300 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Type "delete" to confirm
              </label>
              <Input
                type="text"
                placeholder="delete"
                value={userConfirmationText}
                onChange={(e) => setUserConfirmationText(e.target.value)}
                className="border-gray-300 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteAllUsersModal(false);
                  setUserPasskeyInput('');
                  setUserConfirmationText('');
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteAllUsers}
                disabled={isDeletingUsers || userConfirmationText !== 'delete' || !userPasskeyInput}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeletingUsers ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Appointment details modal */}
      {showAppointmentModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-rose-200/50 dark:bg-gray-900 dark:ring-rose-800/30 dark:shadow-gray-950/50 max-h-[90vh] flex flex-col transition-colors duration-300">
            <button
              onClick={() => {
                setShowAppointmentModal(false);
                setIsEditing(false);
                setEditedAppointment(null);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-rose-500 dark:hover:text-rose-300"
              aria-label="Close"
            >
              <XCircle className="size-7" />
            </button>
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-shrink-0">
              <Calendar className="size-5 text-rose-500" /> {isEditing ? 'Edit Appointment' : 'Appointment Details'}
            </h2>
            <div className="space-y-4 overflow-y-auto pr-2 flex-grow" style={{ maxHeight: 'calc(80vh - 140px)' }}>
              {/* Patient info - always visible */}
              <div className="flex items-center gap-4 mb-4">
                <div className="size-16 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedAppointment.user.firstName.charAt(0).toUpperCase()}
                </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Patient Name</label>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedAppointment.user.firstName} {selectedAppointment.user.lastName}</p>
              </div>
                <div className="ml-auto">
                  {getStatusBadge(isEditing && editedAppointment ? editedAppointment.status : selectedAppointment.status)}
                </div>
              </div>

              {isEditing ? (
                /* Only show editable fields when in edit mode */
                <div className="space-y-4 bg-gray-100 p-4 rounded-lg border border-gray-200 dark:bg-gray-800/90 dark:border-gray-700/80 dark:shadow-inner">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Appointment Details
                  </h3>
                  
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="bg-white p-3 rounded-lg shadow-sm dark:bg-gray-800/90 dark:border dark:border-gray-700/80">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300">Date</label>
                      <Input
                        type="date"
                        value={editedAppointment?.appointmentDate.split('T')[0]}
                        onChange={(e) => setEditedAppointment({
                          ...editedAppointment!,
                          appointmentDate: e.target.value
                        })}
                        className="mt-1 border-gray-200 focus:border-rose-300 focus:ring-rose-300 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-rose-500 dark:focus:ring-rose-500"
                      />
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm dark:bg-gray-800/90 dark:border dark:border-gray-700/80">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300">Time</label>
                      <Input
                        type="time"
                        value={editedAppointment?.appointmentTime}
                        onChange={(e) => setEditedAppointment({
                          ...editedAppointment!,
                          appointmentTime: e.target.value
                        })}
                        className="mt-1 border-gray-200 focus:border-rose-300 focus:ring-rose-300 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-rose-500 dark:focus:ring-rose-500"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm dark:bg-gray-800/90 dark:border dark:border-gray-700/80">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300">Status</label>
                    <Select
                      value={editedAppointment?.status}
                      onValueChange={(value) => setEditedAppointment({
                        ...editedAppointment!,
                        status: value
                      })}
                    >
                      <SelectTrigger className="mt-1 w-full border-gray-200 focus:border-rose-300 focus:ring-rose-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-rose-500 dark:focus:ring-rose-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="pending" className="dark:text-gray-200 dark:hover:bg-gray-700">Pending</SelectItem>
                        <SelectItem value="confirmed" className="dark:text-gray-200 dark:hover:bg-gray-700">Confirmed</SelectItem>
                        <SelectItem value="completed" className="dark:text-gray-200 dark:hover:bg-gray-700">Completed</SelectItem>
                        <SelectItem value="cancelled" className="dark:text-gray-200 dark:hover:bg-gray-700">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                /* Show all appointment details when not in edit mode */
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{selectedAppointment.user.email}</p>
                </div>
                    <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white">{selectedAppointment.user.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Date</label>
                      <p className="text-gray-900 dark:text-white flex items-center gap-1">
                        <Calendar className="size-4 text-rose-500" /> {formatDate(selectedAppointment.appointmentDate)}
                      </p>
                </div>
                    <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Time</label>
                      <p className="text-gray-900 dark:text-white flex items-center gap-1">
                        <Clock className="size-4 text-rose-500" /> {formatTime(selectedAppointment.appointmentTime)}
                      </p>
                </div>
              </div>
                  <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Reason</label>
                <p className="text-gray-900 dark:text-white">{selectedAppointment.reason}</p>
              </div>
                  <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Appointment Type</label>
                    <p className="text-gray-900 dark:text-white">{selectedAppointment.appointmentType}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
              </div>
                  <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Notes</label>
                    <p className="text-gray-900 dark:text-white">{selectedAppointment.notes || 'No notes available'}</p>
                  </div>
                  {selectedAppointment.attachments && selectedAppointment.attachments.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Attachments</label>
                      <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
                        {selectedAppointment.attachments.map((attachment, index) => (
                          <a 
                            key={index}
                            href={attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center rounded-md bg-white px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 border border-gray-200 shadow-sm dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-gray-700 dark:border-gray-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            View File {index + 1}
                          </a>
                        ))}
                      </div>
                </div>
                  )}
                </>
              )}
            </div>
            <div className="mt-4 flex justify-between flex-shrink-0 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-2">
                {isEditing ? (
              <Button
                variant="outline"
                    onClick={saveAppointmentChanges}
                    className="px-4 py-2 flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
                  >
                    <Save className="size-4 mr-1" />
                    Save
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleEditAppointment(selectedAppointment);
                    }}
                    className="px-4 py-2 flex items-center gap-1 border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-1" fill="none" viewBox="00 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    deleteAppointment(selectedAppointment.id);
                    setShowAppointmentModal(false);
                  }}
                  disabled={isEditing}
                  className={`px-4 py-2 flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30 ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-1" fill="none" viewBox="00 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    setEditedAppointment(null);
                  } else {
                    setShowAppointmentModal(false);
                  }
                }}
                className="px-6 py-2 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
              >
                {isEditing ? 'Cancel' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}