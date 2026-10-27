// ==============================================================================
// FDR GUARDIAN: CENTRALIZED REST API CLIENT
// File: src/services/api.ts
// ==============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  mobile_number?: string;
  role: 'institution_user' | 'bank_officer' | 'regulatory_officer' | 'system_admin';
  account_status: 'approved' | 'pending_approval' | 'rejected' | 'suspended';
  created_at: string;
  institution_profile?: {
    institution_id: string;
    institution_name?: string;
    institution_code?: string;
    designation: string;
    verification_status: string;
  };
  bank_profile?: {
    bank_name: string;
    branch_or_office: string;
    designation: string;
    employee_id?: string;
    verification_status: string;
  };
  regulatory_profile?: {
    designation: string;
    office_or_jurisdiction: string;
    employee_reference?: string;
    verification_status: string;
  };
}

export interface StateItem {
  id: number;
  name: string;
  code: string;
  country_code: string;
}

export interface DistrictItem {
  id: number;
  state_id: number;
  name: string;
  code?: string;
}

export interface InstitutionItem {
  id: string;
  institution_name: string;
  institution_code?: string;
  institution_type?: string;
  state_id: number;
  district_id: number;
  address?: string;
  is_active: boolean;
}

export interface BankItem {
  id: string;
  code: string;
  name: string;
  ifsc_prefix: string;
  nodal_officer?: string;
  nodal_email?: string;
  is_active: boolean;
}

export interface AccessRequestItem {
  id: string;
  user_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_mobile?: string;
  requested_role: string;
  organization_details: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'info_required';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export interface FDRItem {
  id: string;
  fdr_number: string;
  public_verification_id: string;
  institution_id: string;
  institution_name?: string;
  bank_id: string;
  bank_name?: string;
  branch_name: string;
  holder_name: string;
  joint_holder_name?: string;
  principal_amount: number;
  issue_date: string;
  maturity_date: string;
  tenure_months: number;
  interest_rate: number;
  deposit_category: string;
  lien_marked_to: string;
  status: string;
  ocr_confidence_average: number;
  service_target_days: number;
  delay_reason?: string;
  created_at: string;
  updated_at: string;
  documents: Array<{
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    storage_path: string;
    sha256_hash: string;
    version: number;
    uploaded_at: string;
  }>;
  verifications: Array<{
    id: string;
    status: string;
    reference_number?: string;
    comments?: string;
    supporting_evidence_url?: string;
    verified_at: string;
  }>;
  decisions: Array<{
    id: string;
    status: string;
    decision_reason?: string;
    conditions_json?: Record<string, any>;
    decided_at: string;
  }>;
}

class ApiClient {
  private tokenKey = 'fdr_auth_token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  clearToken() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('fdr_current_user');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        let errorMsg = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch {
          // Response body was not JSON
        }
        throw new Error(errorMsg);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.error(`Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // 1. Health
  async checkHealth() {
    return this.request<{ status: string; database: string; engine: string }>('/api/health');
  }

  // 2. Authentication & Profile
  auth = {
    login: async (credentials: { email: string; password: string }) => {
      const data = await this.request<{ access_token: string; token_type: string; user: ApiUser }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );
      this.setToken(data.access_token);
      localStorage.setItem('fdr_current_user', JSON.stringify(data.user));
      return data;
    },

    register: async (payload: {
      full_name: string;
      email: string;
      mobile_number: string;
      password: string;
      requested_role: string;
      country?: string;
      state_id?: number;
      district_id?: number;
      institution_id?: string;
      institution_name?: string;
      designation?: string;
      bank_name?: string;
      branch_or_office?: string;
      employee_id?: string;
      office_or_jurisdiction?: string;
      employee_reference?: string;
    }) => {
      const data = await this.request<{ access_token: string; token_type: string; user: ApiUser }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      this.setToken(data.access_token);
      localStorage.setItem('fdr_current_user', JSON.stringify(data.user));
      return data;
    },

    getMe: async () => {
      const user = await this.request<ApiUser>('/api/auth/me');
      localStorage.setItem('fdr_current_user', JSON.stringify(user));
      return user;
    },

    updateMe: async (update: { full_name?: string; mobile_number?: string }) => {
      return this.request<ApiUser>('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(update),
      });
    },

    logout: async () => {
      try {
        await this.request('/api/auth/logout', { method: 'POST' });
      } finally {
        this.clearToken();
      }
    },
  };

  // 3. Locations & Institutions
  locations = {
    getStates: async () => {
      return this.request<StateItem[]>('/api/locations/states');
    },

    getDistricts: async (stateId: number) => {
      return this.request<DistrictItem[]>(`/api/locations/districts?state_id=${stateId}`);
    },

    getInstitutions: async (params?: { district_id?: number; state_id?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.district_id) searchParams.append('district_id', String(params.district_id));
      if (params?.state_id) searchParams.append('state_id', String(params.state_id));
      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.request<InstitutionItem[]>(`/api/institutions${qs}`);
    },

    getInstitution: async (id: string) => {
      return this.request<InstitutionItem>(`/api/institutions/${id}`);
    },

    requestInstitutionAddition: async (data: { institution_name: string; state_id: number; district_id: number }) => {
      return this.request('/api/institutions/requests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  };

  // 4. Banks Master
  banks = {
    list: async () => {
      return this.request<BankItem[]>('/api/banks');
    },
  };

  // 5. Admin Workflows
  admin = {
    getAccessRequests: async (filters?: { role?: string; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (filters?.role && filters.role !== 'ALL') searchParams.append('role', filters.role);
      if (filters?.status && filters.status !== 'ALL') searchParams.append('status', filters.status);
      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.request<AccessRequestItem[]>(`/api/admin/access-requests${qs}`);
    },

    approveAccessRequest: async (requestId: string) => {
      return this.request<{ message: string; status: string }>(`/api/admin/access-requests/${requestId}/approve`, {
        method: 'POST',
      });
    },

    rejectAccessRequest: async (requestId: string, reason: string) => {
      return this.request<{ message: string; status: string }>(`/api/admin/access-requests/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    getUsers: async () => {
      return this.request<ApiUser[]>('/api/admin/users');
    },

    suspendUser: async (userId: string) => {
      return this.request<{ message: string }>(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
      });
    },

    reactivateUser: async (userId: string) => {
      return this.request<{ message: string }>(`/api/admin/users/${userId}/reactivate`, {
        method: 'POST',
      });
    },
  };

  // 6. FDR Operations
  fdrs = {
    list: async (filters?: { status?: string; bank_id?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') searchParams.append('status', filters.status);
      if (filters?.bank_id) searchParams.append('bank_id', filters.bank_id);
      if (filters?.search) searchParams.append('search', filters.search);
      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.request<FDRItem[]>(`/api/fdrs${qs}`);
    },

    get: async (id: string) => {
      return this.request<FDRItem>(`/api/fdrs/${id}`);
    },

    create: async (payload: {
      fdr_number: string;
      institution_id: string;
      bank_id: string;
      branch_name: string;
      holder_name: string;
      joint_holder_name?: string;
      principal_amount: number;
      issue_date: string;
      maturity_date: string;
      tenure_months: number;
      interest_rate: number;
      deposit_category: string;
      lien_marked_to: string;
    }) => {
      return this.request<FDRItem>('/api/fdrs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    update: async (id: string, update: {
      principal_amount?: number;
      interest_rate?: number;
      maturity_date?: string;
      delay_reason?: string;
    }) => {
      return this.request<FDRItem>(`/api/fdrs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(update),
      });
    },

    verifyBank: async (id: string, payload: {
      status: string;
      reference_number?: string;
      comments?: string;
      supporting_evidence_url?: string;
    }) => {
      return this.request<FDRItem>(`/api/fdrs/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    recordDecision: async (id: string, payload: {
      status: string;
      decision_reason: string;
      conditions_json?: Record<string, any>;
    }) => {
      return this.request<FDRItem>(`/api/fdrs/${id}/regulatory-decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    publicVerify: async (token: string) => {
      return this.request<{
        status: string;
        fdr_number_masked: string;
        institution_name: string;
        bank_name: string;
        regulatory_status: string;
        lien_marked_to: string;
        issue_date: string;
        maturity_date: string;
        verified_at: string;
        disclaimer: string;
      }>(`/api/fdrs/public-verify/${token}`);
    },

    ocrVerify: async (formData: FormData) => {
      const response = await fetch(`${API_BASE_URL}/api/fdrs/ocr-verify`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`OCR processing failed with status ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
  };

  // 7. Notifications
  notifications = {
    list: async () => {
      return this.request<Array<{
        id: string;
        title: string;
        message: string;
        type: string;
        is_read: boolean;
        created_at: string;
      }>>('/api/notifications');
    },

    markRead: async (id: string) => {
      return this.request<{ message: string }>(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },
  };

  // 8. Audit Logs
  audit = {
    list: async (limit: number = 50) => {
      return this.request<Array<{
        id: string;
        actor_name: string;
        actor_role: string;
        action: string;
        entity_type?: string;
        entity_id?: string;
        details?: Record<string, any>;
        created_at: string;
      }>>(`/api/audit-logs?limit=${limit}`);
    },
  };
}

export const api = new ApiClient();
