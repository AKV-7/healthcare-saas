'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  reason: string;
  status: string;
  doctorName?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalUsers: number;
}

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];

export default function AdminDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showDeleteAllUsersModal, setShowDeleteAllUsersModal] = useState(false);
  const [showDeleteAllUsersPasswordModal, setShowDeleteAllUsersPasswordModal] = useState(false);
  const [showDeleteAllUsersConfirmModal, setShowDeleteAllUsersConfirmModal] = useState(false);
  const [deleteAllUsersPassword, setDeleteAllUsersPassword] = useState('');
  const [deleteAllUsersConfirmText, setDeleteAllUsersConfirmText] = useState('');
  const [deleteAllUsersPasswordError, setDeleteAllUsersPasswordError] = useState('');
  const [deleteAllUsersConfirmError, setDeleteAllUsersConfirmError] = useState('');
  const [isDeletingAllUsers, setIsDeletingAllUsers] = useState(false);
  const [showDeleteAllConfirmModal, setShowDeleteAllConfirmModal] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
  const [deleteAllConfirmError, setDeleteAllConfirmError] = useState('');
  const [admins, setAdmins] = useState<any[]>([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin',
  });
  const [adminError, setAdminError] = useState('');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'admins'>('dashboard');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<any>({});

  // Password reset states
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordResetAdmin, setPasswordResetAdmin] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Edit appointment states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [isUpdatingAppointment, setIsUpdatingAppointment] = useState(false);
  const [editError, setEditError] = useState('');

  // Notification states
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Check permissions based on admin level
  const canDeleteUsers = currentAdmin.adminLevel === 1; // super_admin only
  const canManageAdmins = currentAdmin.adminLevel <= 2; // super_admin and admin

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'hospital_manager':
        return 'Hospital Manager';
      default:
        return role;
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-600';
      case 'admin':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-600';
      case 'hospital_manager':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  // Add state for pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalAppointments, setTotalAppointments] = useState(0);

  // Update fetch logic to use pagination
  useEffect(() => {
    const fetchPaginatedAppointments = async () => {
      setLoading(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const adminToken = localStorage.getItem('adminToken');
        const response = await fetch(`${backendUrl}/api/appointments?page=${page}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAppointments(data.data || []);
          setTotalAppointments(data.total);
        } else {
          setAppointments([]);
          setTotalAppointments(0);
        }
      } catch (error) {
        setAppointments([]);
        setTotalAppointments(0);
      } finally {
        setLoading(false);
      }
    };
    fetchPaginatedAppointments();
  }, [page, limit]);

  const refreshToken = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        throw new Error('No token to refresh');
      }

      const response = await fetch(`${backendUrl}/api/auth/admin-refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        return data.token;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, redirect to login
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      router.push('/admin/login');
      throw error;
    }
  }, [router]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        console.error('No admin token found');
        router.push('/admin/login');
        return;
      }

      // Fetch appointments directly from backend WITH AUTH HEADER
      let appointmentsResponse = await fetch(`${backendUrl}/api/appointments`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      // If token expired, try to refresh it
      if (appointmentsResponse.status === 401) {
        try {
          adminToken = await refreshToken();
          // Retry the request with new token
          appointmentsResponse = await fetch(`${backendUrl}/api/appointments`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (refreshError) {
          console.error('Token refresh failed, redirecting to login');
          return;
        }
      }

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData.data || []);
      } else if (appointmentsResponse.status === 401) {
        console.error('Unauthorized access, redirecting to login');
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
        return;
      } else {
        console.error(
          'Failed to fetch appointments:',
          appointmentsResponse.status,
          appointmentsResponse.statusText
        );
        const errorText = await appointmentsResponse.text();
        console.error('Error response:', errorText);
      }

      // Fetch dashboard stats directly from backend WITH AUTH HEADER
      let statsResponse = await fetch(`${backendUrl}/api/analytics/dashboard`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      // If token expired, try to refresh it
      if (statsResponse.status === 401) {
        try {
          adminToken = await refreshToken();
          // Retry the request with new token
          statsResponse = await fetch(`${backendUrl}/api/analytics/dashboard`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (refreshError) {
          console.error('Token refresh failed for stats, redirecting to login');
          return;
        }
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else if (statsResponse.status === 401) {
        console.error('Unauthorized access for stats, redirecting to login');
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
      } else {
        console.error('Failed to fetch stats:', statsResponse.status, statsResponse.statusText);
        const errorText = await statsResponse.text();
        console.error('Stats error response:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Don't redirect on network errors, just show loading state
    } finally {
      setLoading(false);
    }
  }, [router, refreshToken]);

  useEffect(() => {
    // Check authentication first
    const adminAuth = localStorage.getItem('adminAuth');
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!adminAuth || adminAuth !== 'true' || !adminToken) {
      router.push('/admin/login');
      return;
    }

    // Load admin data from localStorage
    if (adminUser) {
      try {
        const parsedUser = JSON.parse(adminUser);
        setCurrentAdmin(parsedUser);
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
        return;
      }
    }

    // Fetch dashboard data
    fetchDashboardData();
  }, [router, fetchDashboardData]);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminAuth');

    // Clear authentication cookies
    document.cookie = 'adminAuth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Redirect to login
    router.push('/admin/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      console.log(`🔄 Updating appointment ${id} status to: ${newStatus}`);
      
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        console.error('❌ No admin token found');
        alert('Authentication required. Please login again.');
        router.push('/admin/login');
        return;
      }

      console.log('📤 Making PUT request to:', `${backendUrl}/api/appointments/${id}`);
      
      const response = await fetch(`${backendUrl}/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Update successful:', responseData);
        
        // Find the old appointment to get its previous status
        const oldAppointment = appointments.find(apt => apt.id === id);
        const oldStatus = oldAppointment?.status;
        
        // Update the appointment in the local state
        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === id
              ? { ...appointment, status: newStatus }
              : appointment
          )
        );
        
        // Update stats locally without refetching everything
        if (stats && oldStatus !== newStatus) {
          setStats(prevStats => {
            if (!prevStats) return prevStats;
            
            const updatedStats = { ...prevStats };
            
            // Decrease count for old status
            if (oldStatus === 'pending') updatedStats.pendingAppointments--;
            else if (oldStatus === 'confirmed') updatedStats.confirmedAppointments--;
            else if (oldStatus === 'completed') updatedStats.completedAppointments--;
            else if (oldStatus === 'cancelled') updatedStats.cancelledAppointments--;
            
            // Increase count for new status
            if (newStatus === 'pending') updatedStats.pendingAppointments++;
            else if (newStatus === 'confirmed') updatedStats.confirmedAppointments++;
            else if (newStatus === 'completed') updatedStats.completedAppointments++;
            else if (newStatus === 'cancelled') updatedStats.cancelledAppointments++;
            
            return updatedStats;
          });
        }
        
        showSuccessNotification('Appointment status updated successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Update failed:', response.status, errorData);
        alert(`Failed to update status: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      alert('Network error: Unable to update status. Please check your connection.');
    }
  };

  const handleAppointmentUpdate = async () => {
    if (!editingAppointment || !editDate || !editTime || !editStatus) {
      setEditError('Please fill in all fields');
      return;
    }

    setIsUpdatingAppointment(true);
    setEditError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');

      const response = await fetch(`${backendUrl}/api/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          appointmentDate: editDate,
          appointmentTime: editTime,
          status: editStatus,
        }),
      });

      if (response.ok) {
        // Update the appointment in local state instead of refetching everything
        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === editingAppointment.id
              ? {
                  ...appointment,
                  appointmentDate: editDate,
                  appointmentTime: editTime,
                  status: editStatus,
                }
              : appointment
          )
        );

        setShowEditModal(false);
        setEditingAppointment(null);
        setEditDate('');
        setEditTime('');
        setEditStatus('');
        showSuccessNotification('Email sent');
      } else {
        const errorData = await response.json();
        setEditError(errorData.message || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setEditError('Error updating appointment. Please try again.');
    } finally {
      setIsUpdatingAppointment(false);
    }
  };

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditDate(appointment.appointmentDate);
    setEditTime(appointment.appointmentTime);
    setEditStatus(appointment.status);
    setEditError('');
    setShowEditModal(true);
  };

  const showSuccessNotification = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000); // Hide after 3 seconds
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');

      const response = await fetch(`${backendUrl}/api/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (response.ok) {
        // Remove the appointment from local state instead of refetching everything
        setAppointments((prevAppointments) =>
          prevAppointments.filter((appointment) => appointment.id !== id)
        );
      } else {
        console.error('Failed to delete appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAllConfirm = () => {
    setShowDeleteAllModal(false);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setIsDeletingAll(true);
    setPasswordError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        throw new Error('No authentication token found');
      }

      // First verify the password with the backend
      const verifyResponse = await fetch(`${backendUrl}/api/auth/admin-verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        setPasswordError(errorData.message || 'Password verification failed');
        setIsDeletingAll(false);
        return;
      }

      // Password verified successfully, show confirmation modal
      setShowPasswordModal(false);
      setPassword('');
      setShowDeleteAllConfirmModal(true);
      setIsDeletingAll(false);
    } catch (error) {
      console.error('Error during password verification:', error);
      setPasswordError('Error during password verification. Please try again.');
      setIsDeletingAll(false);
    }
  };

  const handleDeleteAllUsersConfirm = () => {
    setShowDeleteAllUsersModal(false);
    setShowDeleteAllUsersPasswordModal(true);
  };

  const handleDeleteAllUsersPasswordSubmit = async () => {
    if (!deleteAllUsersPassword) {
      setDeleteAllUsersPasswordError('Password is required');
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        throw new Error('No authentication token found');
      }

      // First verify the password with the backend
      const verifyResponse = await fetch(`${backendUrl}/api/auth/admin-verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ password: deleteAllUsersPassword }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        setDeleteAllUsersPasswordError(errorData.message || 'Password verification failed');
        return;
      }

      // Password verified successfully, proceed to confirmation
      setDeleteAllUsersPasswordError('');
      setShowDeleteAllUsersPasswordModal(false);
      setShowDeleteAllUsersConfirmModal(true);
    } catch (error) {
      console.error('Error during password verification:', error);
      setDeleteAllUsersPasswordError('Error during password verification. Please try again.');
    }
  };

  const handleDeleteAllUsersFinalConfirm = async () => {
    if (deleteAllUsersConfirmText.toLowerCase() === 'delete') {
      setDeleteAllUsersConfirmError('');
      setIsDeletingAllUsers(true);

      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const adminToken = localStorage.getItem('adminToken');

        if (!adminToken) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${backendUrl}/api/users/delete-all`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setShowDeleteAllUsersConfirmModal(false);
          setDeleteAllUsersPassword('');
          setDeleteAllUsersConfirmText('');
          setIsDeletingAllUsers(false);
          fetchDashboardData();
          alert(
            `Successfully deleted ${result.deletedUsers} users and ${result.deletedAppointments} appointments`
          );
        } else {
          throw new Error('Failed to delete users');
        }
      } catch (error) {
        console.error('Error deleting all users:', error);
        alert('Error deleting users. Please try again.');
        setIsDeletingAllUsers(false);
      }
    } else {
      setDeleteAllUsersConfirmError('Please type "delete" to confirm');
    }
  };

  const handleDeleteAllFinalConfirm = async () => {
    if (deleteAllConfirmText.toLowerCase() === 'delete') {
      setDeleteAllConfirmError('');
      setIsDeletingAll(true);

      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const adminToken = localStorage.getItem('adminToken');

        if (!adminToken) {
          throw new Error('No authentication token found');
        }

        // Delete all appointments one by one
        for (const appointment of appointments) {
          const response = await fetch(`${backendUrl}/api/appointments/${appointment.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          if (!response.ok) {
            throw new Error(`Failed to delete appointment ${appointment.id}`);
          }
        }

        setShowDeleteAllConfirmModal(false);
        setDeleteAllConfirmText('');
        setIsDeletingAll(false);
        fetchDashboardData();
        alert('All appointments have been deleted successfully');
      } catch (error) {
        console.error('Error deleting all appointments:', error);
        alert('Error deleting appointments. Please try again.');
        setIsDeletingAll(false);
      }
    } else {
      setDeleteAllConfirmError('Please type "delete" to confirm');
    }
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  const clearFilter = () => {
    setActiveFilter('all');
  };

  const getFilteredAppointments = (): Appointment[] => {
    if (!Array.isArray(appointments)) return [];
    if (activeFilter === 'all') {
      return appointments;
    }
    return appointments.filter((appointment) => appointment.status === activeFilter);
  };

  const getFilteredCount = () => {
    return getFilteredAppointments().length;
  };

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let adminToken = localStorage.getItem('adminToken');

      let res = await fetch(`${backendUrl}/api/users/admins`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      // If token expired, try to refresh it
      if (res.status === 401) {
        try {
          adminToken = await refreshToken();
          // Retry the request with new token
          res = await fetch(`${backendUrl}/api/users/admins`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          });
        } catch (refreshError) {
          console.error('Token refresh failed for admins fetch');
          return;
        }
      }

      const data = await res.json();
      if (data.success) setAdmins(data.admins);
    } catch (e) {
      console.error('Error fetching admins:', e);
    }
  }, [refreshToken]);

  useEffect(() => {
    if (adminTab === 'admins') fetchAdmins();
  }, [adminTab, fetchAdmins]);

  // Add admin
  const handleAddAdmin = async () => {
    setIsAddingAdmin(true);
    setAdminError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');
      const res = await fetch(`${backendUrl}/api/users/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      if (data.success) {
        setShowAdminModal(false);
        setNewAdmin({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phone: '',
          role: 'admin',
        });
        fetchAdmins();
      } else {
        setAdminError(data.message || 'Failed to add admin');
      }
    } catch (e) {
      setAdminError('Failed to add admin');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  // Delete admin
  const handleDeleteAdmin = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    setDeletingAdminId(id);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');
      const res = await fetch(`${backendUrl}/api/users/admins/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) fetchAdmins();
    } catch (e) {
      /* ignore */
    }
    setDeletingAdminId(null);
  };

  // Reset admin password (Super Admin only)
  const handleResetPassword = async () => {
    if (!passwordResetAdmin) return;

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsResettingPassword(true);
    setPasswordError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');
      const res = await fetch(
        `${backendUrl}/api/users/admins/${passwordResetAdmin._id}/reset-password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ newPassword }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setShowPasswordResetModal(false);
        setPasswordResetAdmin(null);
        setNewPassword('');
        setConfirmNewPassword('');
        alert('Password reset successfully!');
      } else {
        setPasswordError(data.message || 'Failed to reset password');
      }
    } catch (e) {
      setPasswordError('Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Change own password
  const handleChangePassword = async () => {
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const adminToken = localStorage.getItem('adminToken');
      const res = await fetch(`${backendUrl}/api/users/admins/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setShowChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        alert('Password changed successfully!');
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (e) {
      setPasswordError('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-black dark:via-neutral-900 dark:to-black">
        <div className="text-center">
          <div className="mx-auto mb-4 size-16 animate-spin rounded-full border-b-2 border-red-600"></div>
          <h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
            Loading Dashboard
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Please wait while we fetch your data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-black dark:via-neutral-900 dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-red-200/50 bg-white/95 shadow-lg backdrop-blur-md dark:border-gray-700/70 dark:bg-gray-900/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="relative flex size-12 items-center justify-center">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg"
                  alt="Khushi Homeo"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              {/* Navigation Tabs */}
              <div className="hidden items-center md:flex">
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 lg:px-4 ${
                    adminTab === 'dashboard'
                      ? 'bg-red-100 text-red-700 shadow-sm dark:bg-red-900 dark:text-red-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-red-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-red-900/20'
                  }`}
                  onClick={() => setAdminTab('dashboard')}
                >
                  Dashboard
                </button>
                {canManageAdmins && (
                  <button
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 lg:px-4 ${
                      adminTab === 'admins'
                        ? 'bg-red-100 text-red-700 shadow-sm dark:bg-red-900 dark:text-red-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-red-900/20'
                    }`}
                    onClick={() => setAdminTab('admins')}
                  >
                    Admin Management
                  </button>
                )}
              </div>
            </div>
            {/* User Actions */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Current user info */}
              <div className="hidden text-sm text-gray-600 dark:text-gray-300 lg:block">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${getRoleColor(currentAdmin.role)}`}
                >
                  {getRoleDisplayName(currentAdmin.role)}
                </span>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <button
                  onClick={() => {
                    setShowChangePasswordModal(true);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPasswordError('');
                  }}
                  className="hidden rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-red-600 hover:to-red-700 hover:shadow-lg dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 sm:block lg:px-4"
                >
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-gray-600 hover:to-gray-700 hover:shadow-lg dark:from-gray-600 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-800 lg:px-4"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <svg
                    className="size-4 sm:hidden"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:p-8">
        {adminTab === 'dashboard' && (
          <>
            {/* Welcome Section */}
            <div className="mb-6 lg:mb-8">
              <div className="mb-3 flex items-center space-x-3">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-gray-900 via-red-700 to-red-600 bg-clip-text text-2xl font-bold text-transparent lg:text-4xl">
                    Welcome to Admin Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300 lg:text-lg">
                    Manage appointments and monitor system statistics
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            {stats ? (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mb-8 lg:grid-cols-5 lg:gap-6">
                {/* Total Appointments - Blue */}
                <Card
                  className={`group cursor-pointer border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    activeFilter === 'all'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                  }`}
                  onClick={() => handleFilterClick('all')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle
                      className={`text-sm font-medium ${
                        activeFilter === 'all' ? 'text-white' : 'text-blue-700'
                      }`}
                    >
                      Total Appointments
                    </CardTitle>
                    <div
                      className={`rounded-lg p-2 transition-colors ${
                        activeFilter === 'all'
                          ? 'bg-white/20'
                          : 'bg-blue-500/10 group-hover:bg-blue-500/20'
                      }`}
                    >
                      <svg
                        className="size-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold lg:text-3xl ${
                        activeFilter === 'all' ? 'text-white' : 'text-blue-600'
                      }`}
                    >
                      {stats.totalAppointments.toLocaleString()}
                    </div>
                    <p
                      className={`mt-1 text-xs ${
                        activeFilter === 'all' ? 'text-blue-100' : 'text-blue-500'
                      }`}
                    >
                      All time appointments
                    </p>
                  </CardContent>
                </Card>

                {/* Pending - Yellow */}
                <Card
                  className={`group cursor-pointer border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    activeFilter === 'pending'
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white'
                      : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200'
                  }`}
                  onClick={() => handleFilterClick('pending')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle
                      className={`text-sm font-medium ${
                        activeFilter === 'pending' ? 'text-white' : 'text-yellow-700'
                      }`}
                    >
                      Pending
                    </CardTitle>
                    <div
                      className={`rounded-lg p-2 transition-colors ${
                        activeFilter === 'pending'
                          ? 'bg-white/20'
                          : 'bg-yellow-500/10 group-hover:bg-yellow-500/20'
                      }`}
                    >
                      <svg
                        className="size-5 text-yellow-600"
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
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold lg:text-3xl ${
                        activeFilter === 'pending' ? 'text-white' : 'text-yellow-600'
                      }`}
                    >
                      {stats.pendingAppointments.toLocaleString()}
                    </div>
                    <p
                      className={`mt-1 text-xs ${
                        activeFilter === 'pending' ? 'text-yellow-100' : 'text-yellow-500'
                      }`}
                    >
                      Awaiting confirmation
                    </p>
                  </CardContent>
                </Card>

                {/* Confirmed - Green */}
                <Card
                  className={`group cursor-pointer border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    activeFilter === 'confirmed'
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                      : 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200'
                  }`}
                  onClick={() => handleFilterClick('confirmed')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle
                      className={`text-sm font-medium ${
                        activeFilter === 'confirmed' ? 'text-white' : 'text-green-700'
                      }`}
                    >
                      Confirmed
                    </CardTitle>
                    <div
                      className={`rounded-lg p-2 transition-colors ${
                        activeFilter === 'confirmed'
                          ? 'bg-white/20'
                          : 'bg-green-500/10 group-hover:bg-green-500/20'
                      }`}
                    >
                      <svg
                        className="size-5 text-green-600"
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
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold lg:text-3xl ${
                        activeFilter === 'confirmed' ? 'text-white' : 'text-green-600'
                      }`}
                    >
                      {stats.confirmedAppointments.toLocaleString()}
                    </div>
                    <p
                      className={`mt-1 text-xs ${
                        activeFilter === 'confirmed' ? 'text-green-100' : 'text-green-500'
                      }`}
                    >
                      Confirmed appointments
                    </p>
                  </CardContent>
                </Card>

                {/* Completed - Purple */}
                <Card
                  className={`group cursor-pointer border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    activeFilter === 'completed'
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                      : 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200'
                  }`}
                  onClick={() => handleFilterClick('completed')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle
                      className={`text-sm font-medium ${
                        activeFilter === 'completed' ? 'text-white' : 'text-purple-700'
                      }`}
                    >
                      Completed
                    </CardTitle>
                    <div
                      className={`rounded-lg p-2 transition-colors ${
                        activeFilter === 'completed'
                          ? 'bg-white/20'
                          : 'bg-purple-500/10 group-hover:bg-purple-500/20'
                      }`}
                    >
                      <svg
                        className="size-5 text-purple-600"
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
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold lg:text-3xl ${
                        activeFilter === 'completed' ? 'text-white' : 'text-purple-600'
                      }`}
                    >
                      {stats.completedAppointments.toLocaleString()}
                    </div>
                    <p
                      className={`mt-1 text-xs ${
                        activeFilter === 'completed' ? 'text-purple-100' : 'text-purple-500'
                      }`}
                    >
                      Completed appointments
                    </p>
                  </CardContent>
                </Card>

                {/* Cancelled - Gray */}
                <Card
                  className={`group cursor-pointer border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    activeFilter === 'cancelled'
                      ? 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
                      : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                  }`}
                  onClick={() => handleFilterClick('cancelled')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle
                      className={`text-sm font-medium ${
                        activeFilter === 'cancelled' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      Cancelled
                    </CardTitle>
                    <div
                      className={`rounded-lg p-2 transition-colors ${
                        activeFilter === 'cancelled'
                          ? 'bg-white/20'
                          : 'bg-gray-500/10 group-hover:bg-gray-500/20'
                      }`}
                    >
                      <svg
                        className="size-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold lg:text-3xl ${
                        activeFilter === 'cancelled' ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {stats.cancelledAppointments.toLocaleString()}
                    </div>
                    <p
                      className={`mt-1 text-xs ${
                        activeFilter === 'cancelled' ? 'text-gray-100' : 'text-gray-500'
                      }`}
                    >
                      Cancelled appointments
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-red-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900 lg:mb-8 lg:p-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-b-2 border-red-600"></div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Loading Statistics
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Please wait while we fetch the dashboard statistics...
                  </p>
                </div>
              </div>
            )}

            {/* Appointments Table */}
            <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-red-200 bg-red-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 lg:px-6">
                <div className="flex flex-col items-start justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {activeFilter
                        ? `Filtered Appointments (${getFilteredAppointments().length})`
                        : `All Appointments (${appointments.length})`}
                    </h3>
                    {activeFilter && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                        {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Filter Active
                      </span>
                    )}
                  </div>
                  <div className="flex w-full flex-col items-start space-y-2 sm:w-auto sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
                    {activeFilter && (
                      <Button
                        onClick={clearFilter}
                        variant="outline"
                        size="sm"
                        className="w-full border-red-300 text-red-700 hover:bg-red-50 sm:w-auto"
                      >
                        <svg
                          className="mr-2 size-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Clear Filter
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowDeleteAllModal(true)}
                      variant="destructive"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <svg
                        className="mr-2 size-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete All Appointments
                    </Button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] lg:min-w-[1000px]">
                  <thead className="bg-red-50 dark:bg-red-900/20">
                    <tr>
                      <th className="w-1/4 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 lg:px-6 lg:py-4">
                        Patient Details
                      </th>
                      <th className="w-1/12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 lg:px-6 lg:py-4">
                        Type
                      </th>
                      <th className="w-1/12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 lg:px-6 lg:py-4">
                        Date
                      </th>
                      <th className="w-1/12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 lg:px-6 lg:py-4">
                        Time
                      </th>
                      <th className="w-1/6 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 lg:px-6 lg:py-4">
                        Doctor
                      </th>
                      <th className="w-1/12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 lg:px-6 lg:py-4">
                        Status
                      </th>
                      <th className="w-1/12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 lg:px-6 lg:py-4">
                        Edit
                      </th>
                      <th className="w-1/12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 lg:px-6 lg:py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {(Array.isArray(activeFilter ? getFilteredAppointments() : appointments)
                      ? activeFilter
                        ? getFilteredAppointments()
                        : appointments
                      : []
                    ).map((appointment) => (
                      <tr
                        key={appointment.id}
                        className="cursor-pointer transition-colors duration-200 hover:bg-red-50 dark:hover:bg-gray-800/50"
                        onClick={() => router.push(`/admin/appointments/${appointment.id}`)}
                      >
                        <td className="px-4 py-3 align-top lg:px-6 lg:py-4">
                          <div className="flex items-start space-x-3 lg:space-x-4">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-sm font-semibold text-white shadow-lg lg:size-12">
                              {appointment.user?.firstName?.charAt(0) || 'P'}
                              {appointment.user?.lastName?.charAt(0) || 'A'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {appointment.user?.firstName} {appointment.user?.lastName}
                              </div>
                              <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                                ID: {appointment.user?.id || 'N/A'}
                              </div>
                              <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                                <svg
                                  className="mr-1 size-3"
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
                                {appointment.user?.phone || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top lg:px-6 lg:py-4">
                          <div
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize lg:px-3 ${
                              appointment.appointmentType === 'consultation'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : appointment.appointmentType === 'follow-up'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                  : appointment.appointmentType === 'emergency'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : appointment.appointmentType === 'routine-checkup'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}
                          >
                            {appointment.appointmentType.replace('-', ' ')}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top lg:px-6 lg:py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top lg:px-6 lg:py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {appointment.appointmentTime}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top lg:px-6 lg:py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Dr. {appointment.doctorName || 'TBD'}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top lg:px-6 lg:py-4">
                          <div className="flex items-center">
                            <select
                              value={appointment.status}
                              onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className={`cursor-pointer rounded-lg border-0 px-2 py-1 text-xs font-medium shadow-sm transition-all duration-200 focus:ring-2 focus:ring-offset-2 lg:px-3 lg:py-1.5 ${
                                appointment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500 dark:bg-yellow-900 dark:text-yellow-200'
                                  : appointment.status === 'confirmed'
                                    ? 'bg-blue-100 text-blue-800 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-200'
                                    : appointment.status === 'completed'
                                      ? 'bg-green-100 text-green-800 focus:ring-green-500 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-gray-100 text-gray-800 focus:ring-gray-500 dark:bg-gray-900 dark:text-gray-200'
                              }`}
                            >
                              <option
                                value="pending"
                                className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                              >
                                Pending
                              </option>
                              <option
                                value="confirmed"
                                className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                              >
                                Confirmed
                              </option>
                              <option
                                value="completed"
                                className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                              >
                                Completed
                              </option>
                              <option
                                value="cancelled"
                                className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                              >
                                Cancelled
                              </option>
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top lg:px-6 lg:py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(appointment);
                            }}
                            className="rounded-lg p-2 text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                            title="Edit Appointment"
                          >
                            <svg
                              className="size-5"
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
                          </button>
                        </td>
                        <td className="px-4 py-3 align-top lg:px-6 lg:py-4">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(appointment.id);
                              setAppointmentToDelete(appointment); // Fix: set the appointment to delete
                              setShowDeleteModal(true);
                            }}
                            className="hover:bg-red-600 dark:hover:bg-red-600"
                          >
                            <svg
                              className="mr-1 size-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && appointmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="size-6 text-red-600"
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
                  <h3 className="text-lg font-semibold text-gray-900">Delete Appointment</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="mb-3 text-gray-700 dark:text-gray-200">
                  Are you sure you want to delete this appointment?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Patient:</span>
                    <span className="font-medium">
                      {appointmentToDelete.user.firstName} {appointmentToDelete.user.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Date:</span>
                    <span className="font-medium">
                      {formatDate(appointmentToDelete.appointmentDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Time:</span>
                    <span className="font-medium">
                      {formatTime(appointmentToDelete.appointmentTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Type:</span>
                    <span className="font-medium capitalize">
                      {appointmentToDelete.appointmentType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(false);
                    setAppointmentToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(appointmentToDelete.id);
                    setShowDeleteModal(false);
                    setAppointmentToDelete(null);
                  }}
                  disabled={deletingId === appointmentToDelete.id}
                >
                  {deletingId === appointmentToDelete.id ? (
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

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="size-6 text-red-600"
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
                  <h3 className="text-lg font-semibold text-gray-900">Delete All Appointments</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="mb-3 text-gray-700 dark:text-gray-200">
                  Are you sure you want to delete ALL appointments?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Total Appointments:</span>
                    <span className="font-medium text-red-600">{getFilteredCount()}</span>
                  </div>
                  <div className="font-medium text-red-600">
                    ⚠️ This will permanently delete all appointment records
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200"
                  onClick={() => setShowDeleteAllModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  onClick={handleDeleteAllConfirm}
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Delete All</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Admin Verification
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Enter admin password to continue
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter your admin password"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handlePasswordSubmit();
                      }
                    }}
                  />
                  {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setPasswordError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  onClick={handlePasswordSubmit}
                  disabled={isDeletingAll}
                >
                  {isDeletingAll ? (
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Verify &amp; Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Users Confirmation Modal */}
      {showDeleteAllUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <svg
                    className="size-6 text-purple-600 dark:text-purple-400"
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Delete All Users
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="mb-3 text-gray-700 dark:text-gray-200">
                  Are you sure you want to delete ALL registered users?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Total Users:</span>
                    <span className="font-medium text-purple-600">{stats?.totalUsers || 0}</span>
                  </div>
                  <div className="font-medium text-red-600">
                    ⚠️ This will permanently delete all user accounts and their data
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  onClick={() => setShowDeleteAllUsersModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-purple-600 hover:to-purple-700"
                  onClick={handleDeleteAllUsersConfirm}
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <span>Delete All Users</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Users Password Verification Modal */}
      {showDeleteAllUsersPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Admin Verification
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Enter admin password to continue
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={deleteAllUsersPassword}
                    onChange={(e) => setDeleteAllUsersPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter your admin password"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleDeleteAllUsersPasswordSubmit();
                      }
                    }}
                  />
                  {deleteAllUsersPasswordError && (
                    <p className="mt-1 text-sm text-red-600">{deleteAllUsersPasswordError}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowDeleteAllUsersPasswordModal(false);
                    setDeleteAllUsersPassword('');
                    setDeleteAllUsersPasswordError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  onClick={handleDeleteAllUsersPasswordSubmit}
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Verify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Users Final Confirmation Modal */}
      {showDeleteAllUsersConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Final Confirmation
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Type &quot;delete&quot; to confirm
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-300">
                    ⚠️ This action is irreversible!
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    All user accounts, appointments, and associated data will be permanently
                    deleted.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Type &quot;delete&quot; to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteAllUsersConfirmText}
                    onChange={(e) => setDeleteAllUsersConfirmText(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Type 'delete' to confirm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleDeleteAllUsersFinalConfirm();
                      }
                    }}
                  />
                  {deleteAllUsersConfirmError && (
                    <p className="mt-1 text-sm text-red-600">{deleteAllUsersConfirmError}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowDeleteAllUsersConfirmModal(false);
                    setDeleteAllUsersConfirmText('');
                    setDeleteAllUsersConfirmError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  onClick={handleDeleteAllUsersFinalConfirm}
                  disabled={isDeletingAllUsers}
                >
                  {isDeletingAllUsers ? (
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
                      <span>Delete All Users</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'admins' && (
        <div className="mx-auto max-w-6xl py-4 sm:py-8">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
              <div>
                <h2 className="mb-2 bg-gradient-to-r from-gray-900 via-red-700 to-red-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                  Admin Management
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-300 sm:text-lg">
                  Manage system administrators and their permissions
                </p>
              </div>
              <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
                <Button
                  onClick={() => setShowAdminModal(true)}
                  className="flex w-full items-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-red-600 hover:to-red-700 hover:shadow-lg sm:w-auto sm:px-6 sm:py-3"
                >
                  <svg
                    className="size-4 sm:size-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>Add Admin</span>
                </Button>

                {canDeleteUsers && (
                  <Button
                    onClick={() => setShowDeleteAllUsersPasswordModal(true)}
                    className="flex w-full items-center space-x-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg sm:w-auto sm:px-6 sm:py-3"
                  >
                    <svg
                      className="size-4 sm:size-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Delete All Patients ({stats?.totalUsers || 0})</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {/* Total Admins - Blue */}
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:border-blue-700 dark:from-blue-900/20 dark:to-blue-800/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Total Admins
                  </p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {admins.length}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/20">
                  <svg
                    className="size-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Super Admins - Purple */}
            <div className="rounded-xl border border-purple-300 bg-gradient-to-br from-purple-100 to-purple-200 p-6 dark:border-purple-600 dark:from-purple-800/30 dark:to-purple-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Super Admins
                  </p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {admins.filter((a) => a.role === 'super_admin').length}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-lg bg-purple-500/30">
                  <svg
                    className="size-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Admins - Green */}
            <div className="rounded-xl border border-green-400 bg-gradient-to-br from-green-200 to-green-300 p-6 dark:border-green-500 dark:from-green-700/40 dark:to-green-600/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Admins</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {admins.filter((a) => a.role === 'admin').length}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-lg bg-green-500/40">
                  <svg
                    className="size-6 text-green-700"
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
              </div>
            </div>

            {/* Hospital Managers - Orange */}
            <div className="rounded-xl border border-orange-500 bg-gradient-to-br from-orange-300 to-orange-400 p-6 dark:border-orange-400 dark:from-orange-600/50 dark:to-orange-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    Hospital Managers
                  </p>
                  <p className="text-2xl font-bold text-orange-950 dark:text-white">
                    {admins.filter((a) => a.role === 'hospital_manager').length}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-lg bg-orange-500/50">
                  <svg
                    className="size-6 text-orange-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Table */}
          <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-red-200 p-4 dark:border-gray-700 sm:px-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                System Administrators
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-red-50 dark:bg-gray-800">
                  <tr>
                    <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                      Admin Details
                    </th>
                    <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                      Contact
                    </th>
                    <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                      Status
                    </th>
                    <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {admins.map((admin, index) => (
                    <tr
                      key={admin._id}
                      className="transition-colors duration-200 hover:bg-red-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="p-4 sm:px-6">
                        <div className="flex items-center">
                          <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-xs font-semibold text-white sm:size-10 sm:text-sm">
                            {admin.firstName.charAt(0)}
                            {admin.lastName.charAt(0)}
                          </div>
                          <div className="ml-3 sm:ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {admin.firstName} {admin.lastName}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center space-y-1 sm:space-y-0">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(admin.role)}`}
                              >
                                {getRoleDisplayName(admin.role)}
                              </span>
                              {admin._id === currentAdmin.id && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 sm:px-6">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          <div className="mb-1 flex items-center">
                            <svg
                              className="mr-1 size-3 text-gray-400 sm:mr-2 sm:size-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                              />
                            </svg>
                            <span className="max-w-[120px] truncate sm:max-w-none">
                              {admin.email}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="mr-1 size-3 text-gray-400 sm:mr-2 sm:size-4"
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
                            <span className="max-w-[100px] truncate sm:max-w-none">
                              {admin.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 sm:px-6">
                        <div className="flex items-center">
                          <div
                            className={`mr-2 size-2 rounded-full ${admin.isActive ? 'bg-green-400' : 'bg-gray-400'}`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${admin.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}
                          >
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 sm:px-6">
                        {admin._id !== currentAdmin.id && (
                          <div className="flex flex-col items-start space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
                            {/* Reset Password Button - Only for Super Admin */}
                            {currentAdmin.adminLevel === 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPasswordResetAdmin(admin);
                                  setShowPasswordResetModal(true);
                                  setNewPassword('');
                                  setConfirmNewPassword('');
                                  setPasswordError('');
                                }}
                                className="w-full border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20 sm:w-auto"
                              >
                                <svg
                                  className="mr-1 size-3 sm:size-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                  />
                                </svg>
                                <span className="hidden sm:inline">Reset</span>
                                <span className="sm:hidden">Reset</span>
                              </Button>
                            )}

                            {/* Delete Button - Role-based permissions */}
                            {currentAdmin.adminLevel === 1 && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={deletingAdminId === admin._id}
                                onClick={() => handleDeleteAdmin(admin._id)}
                                className="w-full hover:bg-red-600 dark:hover:bg-red-600 sm:w-auto"
                              >
                                {deletingAdminId === admin._id ? (
                                  <>
                                    <div className="mr-1 size-3 animate-spin rounded-full border-b-2 border-white"></div>
                                    <span className="hidden sm:inline">Deleting...</span>
                                    <span className="sm:hidden">Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="mr-1 size-3 sm:size-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    <span className="hidden sm:inline">Delete</span>
                                    <span className="sm:hidden">Delete</span>
                                  </>
                                )}
                              </Button>
                            )}

                            {currentAdmin.adminLevel === 2 && admin.adminLevel > 2 && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={deletingAdminId === admin._id}
                                onClick={() => handleDeleteAdmin(admin._id)}
                                className="w-full hover:bg-red-600 dark:hover:bg-red-600 sm:w-auto"
                              >
                                {deletingAdminId === admin._id ? (
                                  <>
                                    <div className="mr-1 size-3 animate-spin rounded-full border-b-2 border-white"></div>
                                    <span className="hidden sm:inline">Deleting...</span>
                                    <span className="sm:hidden">Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="mr-1 size-3 sm:size-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    <span className="hidden sm:inline">Delete</span>
                                    <span className="sm:hidden">Delete</span>
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                        {admin._id === currentAdmin.id && (
                          <span className="text-sm italic text-gray-500 dark:text-gray-400">
                            Current User
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {admins.length === 0 && (
              <div className="py-12 text-center">
                <svg
                  className="mx-auto size-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No admins found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by adding a new admin.
                </p>
              </div>
            )}
          </div>

          {/* Add Admin Modal */}
          {showAdminModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
              <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
                <div className="p-6">
                  <div className="mb-6 flex items-center space-x-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Add New Admin
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Create a new system administrator
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                          First Name
                        </label>
                        <Input
                          placeholder="Enter first name"
                          value={newAdmin.firstName}
                          onChange={(e) =>
                            setNewAdmin((a) => ({ ...a, firstName: e.target.value }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                          Last Name
                        </label>
                        <Input
                          placeholder="Enter last name"
                          value={newAdmin.lastName}
                          onChange={(e) => setNewAdmin((a) => ({ ...a, lastName: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Email Address
                      </label>
                      <Input
                        placeholder="Enter email address"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin((a) => ({ ...a, email: e.target.value }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Phone Number
                      </label>
                      <Input
                        placeholder="Enter phone number"
                        value={newAdmin.phone}
                        onChange={(e) => setNewAdmin((a) => ({ ...a, phone: e.target.value }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Password
                      </label>
                      <Input
                        placeholder="Enter password"
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin((a) => ({ ...a, password: e.target.value }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Admin Role
                      </label>
                      <select
                        value={newAdmin.role || 'admin'}
                        onChange={(e) => setNewAdmin((a) => ({ ...a, role: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="admin">Admin</option>
                        <option value="hospital_manager">Hospital Manager</option>
                        {currentAdmin.role === 'super_admin' && (
                          <option value="super_admin">Super Admin</option>
                        )}
                      </select>
                    </div>

                    {adminError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                        <p className="text-sm text-red-600 dark:text-red-400">{adminError}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => {
                        setShowAdminModal(false);
                        setAdminError('');
                        setNewAdmin({
                          firstName: '',
                          lastName: '',
                          email: '',
                          password: '',
                          phone: '',
                          role: 'admin',
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                      onClick={handleAddAdmin}
                      disabled={isAddingAdmin}
                    >
                      {isAddingAdmin ? (
                        <>
                          <div className="size-4 animate-spin rounded-full border-b-2 border-white"></div>
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="size-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Add Admin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && passwordResetAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
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
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Reset Password
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Set new password for {passwordResetAdmin.firstName}{' '}
                    {passwordResetAdmin.lastName}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Confirm new password"
                  />
                </div>

                {passwordError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setPasswordResetAdmin(null);
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPasswordError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-b-2 border-white"></div>
                      <span>Resetting...</span>
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
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Change Password
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Update your account password
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Confirm new password"
                  />
                </div>

                {passwordError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPasswordError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-b-2 border-white"></div>
                      <span>Changing...</span>
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
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Edit Appointment
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Update appointment date, time and status
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Patient:</span>
                    <span className="font-medium">
                      {editingAppointment.user.firstName} {editingAppointment.user.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Type:</span>
                    <span className="font-medium capitalize">
                      {editingAppointment.appointmentType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Doctor:</span>
                    <span className="font-medium">
                      Dr. {editingAppointment.doctorName || 'TBD'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Appointment Time
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">Select status</option>
                    {APPOINTMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {editError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAppointment(null);
                    setEditDate('');
                    setEditTime('');
                    setEditStatus('');
                    setEditError('');
                  }}
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
                      <span>Update Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Popup */}
      {showNotification && (
        <div className="fixed right-4 top-4 z-50 duration-300 animate-in slide-in-from-right">
          <div className="flex items-center space-x-3 rounded-lg bg-green-500 px-6 py-4 text-white shadow-lg">
            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">{notificationMessage}</span>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-2 text-white transition-colors hover:text-green-100"
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Delete All Appointments Final Confirmation Modal */}
      {showDeleteAllConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-800 dark:text-gray-100">
            <div className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Final Confirmation
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Type &quot;delete&quot; to confirm
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-300">
                    ⚠️ This action is irreversible!
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    All appointments will be permanently deleted from the system.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Type &quot;delete&quot; to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteAllConfirmText}
                    onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Type 'delete' to confirm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleDeleteAllFinalConfirm();
                      }
                    }}
                  />
                  {deleteAllConfirmError && (
                    <p className="mt-1 text-sm text-red-600">{deleteAllConfirmError}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowDeleteAllConfirmModal(false);
                    setDeleteAllConfirmText('');
                    setDeleteAllConfirmError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  onClick={handleDeleteAllFinalConfirm}
                  disabled={isDeletingAll}
                >
                  {isDeletingAll ? (
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
                      <span>Delete All Appointments</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} total={totalAppointments} limit={limit} onPageChange={setPage} />
    </div>
  );
}
