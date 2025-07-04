'use client';

import { apiClient } from '../api';

// Create appointment
export const createAppointment = async (appointmentData: {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  appointmentType: 'consultation' | 'follow-up' | 'emergency' | 'routine-checkup' | 'specialist';
  reason: string;
  symptoms?: string[];
  notes?: string;
}) => {
  try {
    const appointment = await apiClient.createAppointment(appointmentData);
    return appointment;
  } catch (error) {
    console.error('Failed to create appointment:', error);
    throw error;
  }
};

// Get appointments
export const getAppointments = async (params?: {
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await apiClient.getAppointments(params);
    return response;
  } catch (error) {
    console.error('Failed to get appointments:', error);
    throw error;
  }
};

// Get single appointment
export const getAppointment = async (appointmentId: string) => {
  try {
    const response = await apiClient.customRequest(`/appointments/${appointmentId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get appointment');
  } catch (error) {
    console.error('Failed to get appointment:', error);
    throw error;
  }
};

// Update appointment
export const updateAppointment = async (
  appointmentId: string,
  appointmentData: Partial<{
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
    reason: string;
    symptoms: string[];
    notes: string;
    doctorNotes: string;
    prescription: {
      medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string;
      }>;
      notes: string;
    };
    followUpDate: string;
    followUpRequired: boolean;
    paymentStatus: 'pending' | 'paid' | 'partial' | 'waived';
    amount: number;
  }>
) => {
  try {
    const appointment = await apiClient.updateAppointment(appointmentId, appointmentData);
    return appointment;
  } catch (error) {
    console.error('Failed to update appointment:', error);
    throw error;
  }
};

// Cancel appointment
export const cancelAppointment = async (appointmentId: string, reason?: string) => {
  try {
    const appointment = await apiClient.cancelAppointment(appointmentId, reason);
    return appointment;
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    throw error;
  }
};

// Delete appointment
export const deleteAppointment = async (appointmentId: string) => {
  try {
    await apiClient.deleteAppointment(appointmentId);
  } catch (error) {
    console.error('Failed to delete appointment:', error);
    throw error;
  }
};

// Get appointment statistics
export const getAppointmentStats = async () => {
  try {
    const response = await apiClient.customRequest<{
      total: number;
      upcoming: number;
      byStatus: Record<string, number>;
    }>('/appointments/stats');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get appointment statistics');
  } catch (error) {
    console.error('Failed to get appointment statistics:', error);
    throw error;
  }
};
