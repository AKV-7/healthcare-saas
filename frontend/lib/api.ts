// API Configuration for Healthcare Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : '');

// Helper to check if the backend is available
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: any;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor' | 'patient';
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  // Medical Information
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  primaryPhysician?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
  identificationType?: string;
  identificationNumber?: string;
  identificationDocument?: string;
  // Consent fields
  treatmentConsent?: boolean;
  disclosureConsent?: boolean;
  privacyConsent?: boolean;
  profileImage?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patient: User;
  doctor: User;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  appointmentType: 'consultation' | 'follow-up' | 'emergency' | 'routine-checkup' | 'specialist';
  reason: string;
  symptoms?: string[];
  notes?: string;
  doctorNotes?: string;
  prescription?: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>;
    notes?: string;
  };
  followUpDate?: string;
  followUpRequired: boolean;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'waived';
  amount?: number;
  createdAt: string;
  updatedAt: string;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  private setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication Methods
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'admin' | 'doctor' | 'patient';
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  }): Promise<{ token: string; user: User }> {
    const response = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Backend returns { success: true, token, user } directly
    if (response.success && response.token && response.user) {
      this.setToken(response.token);
      return { token: response.token, user: response.user };
    }

    throw new Error(response.message || 'Registration failed');
  }

  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const response = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Backend returns { success: true, token, user } directly
    if (response.success && response.token && response.user) {
      this.setToken(response.token);
      return { token: response.token, user: response.user };
    }

    throw new Error(response.message || 'Login failed');
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>('/api/auth/me');
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get user data');
  }

  // User Methods
  async getDoctors(search?: string): Promise<User[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await this.request<User[]>(`/api/users/doctors${params}`);
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get doctors');
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.request<User>(`/api/users/${userId}`);
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get user');
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const response = await this.request<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update user');
  }

  // Appointment Methods
  async getAppointments(params?: {
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Appointment[];
    count: number;
    total: number;
    pagination: {
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date) queryParams.append('date', params.date);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/appointments${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<{
      data: Appointment[];
      count: number;
      total: number;
      pagination: {
        page: number;
        limit: number;
        pages: number;
      };
    }>(endpoint);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get appointments');
  }

  async createAppointment(appointmentData: {
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    duration?: number;
    appointmentType: 'consultation' | 'follow-up' | 'emergency' | 'routine-checkup' | 'specialist';
    reason: string;
    symptoms?: string[];
    notes?: string;
  }): Promise<Appointment> {
    const response = await this.request<Appointment>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to create appointment');
  }

  async updateAppointment(appointmentId: string, appointmentData: Partial<Appointment>): Promise<Appointment> {
    const response = await this.request<Appointment>(`/api/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update appointment');
  }

  async cancelAppointment(appointmentId: string, reason?: string): Promise<Appointment> {
    const response = await this.request<Appointment>(`/api/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to cancel appointment');
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    const response = await this.request(`/api/appointments/${appointmentId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete appointment');
    }
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Public method for custom requests
  async customRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, options);
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL); 