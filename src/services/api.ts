import {
  User,
  Photo,
  Tariff,
  CallRequest,
  Transaction,
  WithdrawalRequest,
  Report,
  PlatformSettings,
  AuditLog,
  NotificationItem,
  EnrichedProvider,
} from '../types';

let currentAuthToken: string | null = localStorage.getItem('gondola_token') || 'usr_client_demo';

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
  if (token) {
    localStorage.setItem('gondola_token', token);
  } else {
    localStorage.removeItem('gondola_token');
  }
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (currentAuthToken) {
    headers.set('Authorization', `Bearer ${currentAuthToken}`);
    headers.set('x-user-id', currentAuthToken);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}: Solicitud fallida`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) => request<{ token: string; user: User; message: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request<{ token: string; user: User; message: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request<{ user: User }>('/api/auth/me'),
  recoverPassword: (email: string) => request<{ success: boolean; message: string }>('/api/auth/recover-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyAge: (birthYear: number) => request<{ success: boolean; user: User }>('/api/auth/verify-age', { method: 'POST', body: JSON.stringify({ birthYear }) }),

  // Marketplace
  getProviders: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<{ providers: EnrichedProvider[] }>(`/api/marketplace/providers${q ? `?${q}` : ''}`);
  },
  getProviderById: (id: string) => request<{ provider: User; tariff: Tariff; photos: Photo[]; settings: any }>(`/api/marketplace/providers/${id}`),
  getCategories: () => request<{ categories: string[] }>('/api/marketplace/categories'),

  // User Profile & Catalog
  updateProfile: (updates: Partial<User>) => request<{ success: boolean; user: User }>('/api/user/profile', { method: 'PUT', body: JSON.stringify(updates) }),
  getUserPhotos: () => request<{ photos: Photo[] }>('/api/user/photos'),
  addPhoto: (data: { url: string; caption?: string; isPrivate?: boolean; isPrimary?: boolean }) => request<{ success: boolean; photo: Photo }>('/api/user/photos', { method: 'POST', body: JSON.stringify(data) }),
  reorderPhotos: (photoIds: string[]) => request<{ success: boolean; photos: Photo[] }>('/api/user/photos/reorder', { method: 'PUT', body: JSON.stringify({ photoIds }) }),
  deletePhoto: (id: string) => request<{ success: boolean }>('/api/user/photos/' + id, { method: 'DELETE' }),
  setPrimaryPhoto: (id: string) => request<{ success: boolean; photos: Photo[] }>(`/api/user/photos/${id}/primary`, { method: 'PUT' }),
  togglePhotoPrivacy: (id: string, isPrivate: boolean) => request<{ success: boolean; photos: Photo[] }>(`/api/user/photos/${id}/privacy`, { method: 'PUT', body: JSON.stringify({ isPrivate }) }),

  // Tariffs
  getTariffs: () => request<{ tariff: Tariff; limits: { minTariffPerMin: number; maxTariffPerMin: number } }>('/api/user/tariffs'),
  updateTariffs: (updates: Partial<Tariff>) => request<{ success: boolean; tariff: Tariff }>('/api/user/tariffs', { method: 'PUT', body: JSON.stringify(updates) }),

  // Calls
  estimateCall: (providerId: string, durationMinutes: number) => request<{
    durationMinutes: number;
    totalAmount: number;
    commissionAmount: number;
    providerAmount: number;
    currency: string;
  }>('/api/calls/estimate', { method: 'POST', body: JSON.stringify({ providerId, durationMinutes }) }),

  requestCall: (providerId: string, durationMinutes: number) => request<{
    success: boolean;
    call: CallRequest;
    autoAccepted: boolean;
  }>('/api/calls/request', { method: 'POST', body: JSON.stringify({ providerId, durationMinutes }) }),

  respondCall: (id: string, action: 'accept' | 'reject') => request<{ success: boolean; status: string; callId?: string }>(`/api/calls/${id}/respond`, { method: 'POST', body: JSON.stringify({ action }) }),
  startCall: (id: string) => request<{ success: boolean; startedAt: string }>(`/api/calls/${id}/start`, { method: 'POST' }),
  callHeartbeat: (id: string, secondsIncrement: number = 5) => request<{ success: boolean; actualSecondsUsed: number; status?: string }>(`/api/calls/${id}/heartbeat`, { method: 'POST', body: JSON.stringify({ secondsIncrement }) }),
  endCall: (id: string) => request<{
    success: boolean;
    call: CallRequest;
    clientCharge: number;
    providerEarning: number;
    effectiveSeconds: number;
  }>(`/api/calls/${id}/end`, { method: 'POST' }),
  getActiveCall: () => request<{ activeCall: CallRequest | null }>('/api/calls/active'),
  getCallHistory: () => request<{ calls: CallRequest[] }>('/api/calls/history'),

  // Wallet
  getWalletSummary: () => request<{
    balance: number;
    currency: string;
    totalSpent: number;
    totalEarned: number;
    transactions: Transaction[];
    withdrawals: WithdrawalRequest[];
    settings: any;
  }>('/api/wallet/summary'),
  rechargeWallet: (amount: number, method: string, paymentToken?: string) => request<{
    success: boolean;
    newBalance: number;
    transaction: Transaction;
    message: string;
  }>('/api/wallet/recharge', { method: 'POST', body: JSON.stringify({ amount, method, paymentToken }) }),
  requestWithdrawal: (amount: number, method: string, accountDetails: string) => request<{
    success: boolean;
    withdrawal: WithdrawalRequest;
    newBalance: number;
  }>('/api/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount, method, accountDetails }) }),

  // Safety
  reportUser: (reportedUserId: string, reason: string, description: string, evidencePhotoId?: string) => request<{ success: boolean; message: string; reportId: string }>('/api/safety/report', { method: 'POST', body: JSON.stringify({ reportedUserId, reason, description, evidencePhotoId }) }),
  blockUser: (blockedUserId: string) => request<{ success: boolean; message: string }>('/api/safety/block', { method: 'POST', body: JSON.stringify({ blockedUserId }) }),
  getBlockedUsers: () => request<{ blocks: any[] }>('/api/safety/blocked'),
  unblockUser: (blockedUserId: string) => request<{ success: boolean; message: string }>(`/api/safety/block/${blockedUserId}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request<{ notifications: NotificationItem[] }>('/api/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  // SuperAdmin
  getAdminMetrics: () => request<{ metrics: any }>('/api/admin/metrics'),
  getAdminSettings: () => request<{ settings: PlatformSettings }>('/api/admin/settings'),
  updateAdminSettings: (updates: Partial<PlatformSettings>) => request<{ success: boolean; settings: PlatformSettings }>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(updates) }),
  getAdminUsers: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<{ users: User[] }>(`/api/admin/users${q ? `?${q}` : ''}`);
  },
  adminUserAction: (userId: string, action: string, value?: any) => request<{ success: boolean; user: User; message: string }>(`/api/admin/users/${userId}/action`, { method: 'PUT', body: JSON.stringify({ action, value }) }),
  getAdminWithdrawals: () => request<{ withdrawals: WithdrawalRequest[] }>('/api/admin/withdrawals'),
  adminWithdrawalAction: (id: string, action: 'approve' | 'reject', notes?: string) => request<{ success: boolean; status: string }>(`/api/admin/withdrawals/${id}/action`, { method: 'POST', body: JSON.stringify({ action, notes }) }),
  getAdminReports: () => request<{ reports: Report[] }>('/api/admin/reports'),
  resolveAdminReport: (id: string, actionTaken: string, banReportedUser?: boolean) => request<{ success: boolean; report: Report }>(`/api/admin/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify({ actionTaken, banReportedUser }) }),
  getAdminAuditLogs: () => request<{ auditLogs: AuditLog[] }>('/api/admin/audit-logs'),
};
