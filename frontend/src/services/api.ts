/**
 * API Service Layer for Electricity Theft Intelligence Platform
 * Centralized HTTP Client, JWT token management, and type-safe endpoints.
 */

import type {
  AuthTokenResponse,
  UserProfile,
  OnboardingStatus,
  DashboardMetrics,
  InspectionCaseSummary,
  InspectionCaseDetail,
  CaseConsumptionData,
  MapPoint,
  InspectionOfficer,
  InspectionReportsData,
  FeedbackSummary,
  NotificationItem,
  BoardPostItem,
  BoardPostAdminItem,
  BoardPostCreatePayload,
  BoardPostUpdatePayload,
  ConsumerProfile,
  ConsumerUsage,
  BillItem,
  ConsumerIssueItem,
  IssueCreatePayload,
  IssueResolvePayload,
  AggregateEnforcementStats,
  ThreeTierMonitoringResponse,
  FeatureDriftResponse,
  ModelRegistryItem,
  FeedbackReviewRecord,
  CandidateTrainingResponse
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  public setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  public clearToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      const activeRole = localStorage.getItem('auth_role');
      const currentPath = window.location.pathname;
      this.clearToken();
      sessionStorage.clear();

      if (!currentPath.includes('/login')) {
        if (activeRole === 'CONSUMER' || currentPath.startsWith('/consumer')) {
          window.location.href = '/consumer/login?expired=1';
        } else if (activeRole === 'BOARD_COMMUNICATION_ADMIN' || currentPath.startsWith('/board-admin')) {
          window.location.href = '/board-admin/login?expired=1';
        } else {
          window.location.href = '/login?expired=1';
        }
      }
      throw new Error('Your session has expired. Please sign in again.');
    }

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred.';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch {
        errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // --- Auth APIs ---
  async login(username_or_email: string, password: string): Promise<AuthTokenResponse> {
    const data = await this.request<AuthTokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email, password })
    });
    this.setToken(data.access_token);
    return data;
  }

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  // --- Onboarding APIs ---
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    return this.request<OnboardingStatus>('/users/onboarding-status');
  }

  async completeOnboarding(version: string = 'v1.0'): Promise<OnboardingStatus> {
    return this.request<OnboardingStatus>('/users/onboarding-complete', {
      method: 'POST',
      body: JSON.stringify({ completed: true, version })
    });
  }

  async resetOnboarding(): Promise<OnboardingStatus> {
    return this.request<OnboardingStatus>('/users/onboarding-reset', {
      method: 'POST'
    });
  }

  // --- Inspection APIs ---
  async getDashboard(): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>('/inspections/dashboard');
  }

  async getCases(filters?: { status?: string; zone?: string; risk?: string }): Promise<InspectionCaseSummary[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.zone) params.append('zone', filters.zone);
    if (filters?.risk) params.append('risk', filters.risk);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<InspectionCaseSummary[]>(`/inspections/cases${queryString}`);
  }

  async getCaseDetail(caseId: number): Promise<InspectionCaseDetail> {
    return this.request<InspectionCaseDetail>(`/inspections/cases/${caseId}`);
  }

  async getCaseConsumption(caseId: number, days: number = 60): Promise<CaseConsumptionData> {
    return this.request<CaseConsumptionData>(`/inspections/cases/${caseId}/consumption?days=${days}`);
  }

  async getMapData(): Promise<MapPoint[]> {
    return this.request<MapPoint[]>('/inspections/map');
  }

  async getOfficers(): Promise<InspectionOfficer[]> {
    return this.request<InspectionOfficer[]>('/inspections/employees');
  }

  async assignCase(caseId: number, payload: { employee_id: number; scheduled_date: string; instructions?: string }) {
    return this.request<{ message: string }>(`/inspections/cases/${caseId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async scheduleCase(caseId: number, payload: { scheduled_date: string; notes?: string }) {
    return this.request<{ message: string }>(`/inspections/cases/${caseId}/schedule`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async recordOutcome(caseId: number, payload: {
    outcome: 'THEFT_CONFIRMED' | 'NO_THEFT_FOUND' | 'INCONCLUSIVE';
    meter_tampered?: boolean;
    direct_hooking_detected?: boolean;
    meter_seal_broken?: boolean;
    estimated_units_stolen?: number;
    penalty_amount_inr?: number;
    findings_summary?: string;
    evidence_notes?: string;
  }) {
    return this.request<{ message: string; eligible_for_retraining: boolean; ground_truth_label: number | null }>(
      `/inspections/cases/${caseId}/record-outcome`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
  }

  async getReports(): Promise<InspectionReportsData> {
    return this.request<InspectionReportsData>('/inspections/reports');
  }

  async downloadCaseSuspicionReport(caseId: number): Promise<Blob> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/inspections/cases/${caseId}/suspicion-report`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({ detail: 'Failed to download suspicion report' }));
      throw new Error(errJson.detail || 'Failed to download suspicion report');
    }
    return response.blob();
  }

  // --- Feedback APIs ---
  async getFeedbackSummary(): Promise<FeedbackSummary> {
    return this.request<FeedbackSummary>('/feedback/summary');
  }

  // --- Notifications APIs ---
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/notifications');
  }

  async markNotificationRead(id: number) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'POST'
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/notifications/read-all', {
      method: 'POST'
    });
  }

  // --- Consumer Portal APIs ---
  async getConsumerProfile(): Promise<ConsumerProfile> {
    return this.request<ConsumerProfile>('/consumers/me');
  }

  async getConsumerUsage(): Promise<ConsumerUsage> {
    return this.request<ConsumerUsage>('/consumers/me/usage');
  }

  async getMyBills(): Promise<BillItem[]> {
    return this.request<BillItem[]>('/billing/my-bills');
  }

  async getBillDetail(billId: number): Promise<BillItem> {
    return this.request<BillItem>(`/billing/${billId}`);
  }

  async getMyIssues(): Promise<ConsumerIssueItem[]> {
    return this.request<ConsumerIssueItem[]>('/issues/my-issues');
  }

  async reportIssue(payload: IssueCreatePayload): Promise<ConsumerIssueItem> {
    return this.request<ConsumerIssueItem>('/issues/report', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- Board Communication APIs ---
  async getBoardPosts(category?: string): Promise<BoardPostItem[]> {
    const query = category && category !== 'ALL' ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<BoardPostItem[]>(`/posts${query}`);
  }

  async getBoardPostDetail(postId: number): Promise<BoardPostItem> {
    return this.request<BoardPostItem>(`/posts/${postId}`);
  }

  async getAdminBoardPosts(): Promise<BoardPostAdminItem[]> {
    return this.request<BoardPostAdminItem[]>('/posts/admin');
  }

  async createBoardPost(payload: BoardPostCreatePayload): Promise<BoardPostAdminItem> {
    return this.request<BoardPostAdminItem>('/posts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateBoardPost(postId: number, payload: BoardPostUpdatePayload): Promise<BoardPostAdminItem> {
    return this.request<BoardPostAdminItem>(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async deleteBoardPost(postId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/posts/${postId}`, {
      method: 'DELETE'
    });
  }

  async getEnforcementSummary(): Promise<AggregateEnforcementStats> {
    return this.request<AggregateEnforcementStats>('/posts/enforcement-summary');
  }

  async getAdminIssues(): Promise<ConsumerIssueItem[]> {
    return this.request<ConsumerIssueItem[]>('/issues');
  }

  async respondToIssue(issueId: number, payload: IssueResolvePayload): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/issues/${issueId}/respond`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- Phase 6: Model Monitoring, Governance & Lifecycle APIs ---
  async getModelMonitoring(): Promise<ThreeTierMonitoringResponse> {
    return this.request<ThreeTierMonitoringResponse>('/models/monitoring');
  }

  async getDataAndFeatureDrift(): Promise<FeatureDriftResponse> {
    return this.request<FeatureDriftResponse>('/models/drift');
  }

  async getModelRegistry(): Promise<ModelRegistryItem[]> {
    return this.request<ModelRegistryItem[]>('/models/registry');
  }

  async trainCandidateModel(payload?: { allow_benchmark_demonstration?: boolean }): Promise<CandidateTrainingResponse> {
    return this.request<CandidateTrainingResponse>('/models/candidate/train', {
      method: 'POST',
      body: JSON.stringify(payload || {})
    });
  }

  async promoteCandidateModel(version: string): Promise<{ message: string; version: string; status: string }> {
    return this.request<{ message: string; version: string; status: string }>(`/models/candidate/${encodeURIComponent(version)}/promote`, {
      method: 'POST'
    });
  }

  async rollbackToChampion(): Promise<{ message: string; active_model: string; status: string }> {
    return this.request<{ message: string; active_model: string; status: string }>('/models/rollback', {
      method: 'POST'
    });
  }

  async getFeedbackReview(page: number = 1, limit: number = 20): Promise<{
    total: number;
    eligible_count: number;
    ineligible_count: number;
    page: number;
    limit: number;
    items: FeedbackReviewRecord[];
  }> {
    return this.request(`/feedback/review?page=${page}&limit=${limit}`);
  }

  async toggleFeedbackEligibility(feedbackId: number, isEligible: boolean): Promise<{ message: string; feedback_id: number; is_eligible_for_retraining: boolean }> {
    return this.request(`/feedback/${feedbackId}/eligibility?is_eligible=${isEligible}`, {
      method: 'PATCH'
    });
  }
}

export const api = new ApiClient();
