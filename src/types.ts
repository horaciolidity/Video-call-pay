export interface User {
  id: string;
  email: string;
  role: 'cliente' | 'prestador' | 'administrador' | 'superadmin';
  name: string;
  alias: string;
  bio: string;
  avatar: string;
  country: string;
  city: string;
  languages: string[];
  status: 'disponible' | 'ocupado' | 'desconectado';
  age: number;
  isAgeVerified: boolean;
  isEmailVerified: boolean;
  isBanned: boolean;
  isSuspended: boolean;
  isVerifiedBadge: boolean;
  isFeatured: boolean;
  categories: string[];
  walletBalance: number;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  userId: string;
  url: string;
  caption: string;
  isPrimary: boolean;
  isPrivate: boolean;
  order: number;
  createdAt: string;
}

export interface Tariff {
  userId: string;
  pricePerMin: number;
  pricePer5Min: number;
  pricePer10Min: number;
  pricePer15Min: number;
  minMinutes: number;
  maxMinutes: number;
  autoAccept: boolean;
  callsEnabled: boolean;
  updatedAt: string;
}

export interface CallRequest {
  id: string;
  callId: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  durationMinutes: number;
  totalAmount: number;
  commissionAmount: number;
  providerAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled' | 'interrupted';
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  actualSecondsUsed: number;
  disconnectReason?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'call_payment' | 'call_earning' | 'commission_fee' | 'withdrawal' | 'refund';
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: 'bank_transfer' | 'crypto_usdt' | 'paypal' | 'mercadopago';
  accountDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  processedAt?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  description: string;
  evidencePhotoId?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  actionTaken?: string;
  createdAt: string;
}

export interface PlatformSettings {
  commissionPercent: number;
  categoryCommissions: Record<string, number>;
  minWithdrawal: number;
  minRecharge: number;
  maxRecharge: number;
  minTariffPerMin: number;
  maxTariffPerMin: number;
  currency: string;
  isRegistrationEnabled: boolean;
  isPublishingEnabled: boolean;
  isImageCatalogEnabled: boolean;
  isVideoCallsEnabled: boolean;
  isRechargeEnabled: boolean;
  isWithdrawalsEnabled: boolean;
  autoApproveWithdrawals: boolean;
  categoriesList: string[];
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'call_request' | 'call_accepted' | 'call_rejected' | 'call_finished' | 'payment_confirmed' | 'low_balance' | 'withdrawal_status' | 'system';
  read: boolean;
  data?: any;
  createdAt: string;
}

export interface EnrichedProvider extends User {
  tariff: Tariff;
  primaryPhotoUrl: string;
  publicPhotosCount: number;
}
