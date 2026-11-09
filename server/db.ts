import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
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
  walletBalance: number; // in USD
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

export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  createdAt: string;
}

export interface PlatformSettings {
  commissionPercent: number; // e.g. 15 for 15%
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

export interface DatabaseSchema {
  users: User[];
  photos: Photo[];
  tariffs: Tariff[];
  calls: CallRequest[];
  transactions: Transaction[];
  withdrawals: WithdrawalRequest[];
  reports: Report[];
  blocks: BlockedUser[];
  settings: PlatformSettings;
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'gondola_db.json');

const DEFAULT_SETTINGS: PlatformSettings = {
  commissionPercent: 15,
  categoryCommissions: {
    'Fitness & Nutrición': 12,
    'Consultoría & Negocios': 18,
    'Idiomas & Educación': 15,
    'Tecnología & Código': 15,
    'Moda & Imagen': 15,
    'Bienestar & Psicología': 15,
    'Música & Arte': 15,
    'Finanzas & Inversión': 20,
  },
  minWithdrawal: 20,
  minRecharge: 5,
  maxRecharge: 2000,
  minTariffPerMin: 1.0,
  maxTariffPerMin: 50.0,
  currency: 'USD',
  isRegistrationEnabled: true,
  isPublishingEnabled: true,
  isImageCatalogEnabled: true,
  isVideoCallsEnabled: true,
  isRechargeEnabled: true,
  isWithdrawalsEnabled: true,
  autoApproveWithdrawals: false,
  categoriesList: [
    'Fitness & Nutrición',
    'Consultoría & Negocios',
    'Idiomas & Educación',
    'Tecnología & Código',
    'Moda & Imagen',
    'Bienestar & Psicología',
    'Música & Arte',
    'Finanzas & Inversión',
  ],
};

function getSeedData(): DatabaseSchema {
  const now = new Date().toISOString();

  const users: User[] = [
    {
      id: 'usr_superadmin',
      email: 'admin@gondolalive.com',
      passwordHash: 'admin123', // In production, hashed with bcrypt
      role: 'superadmin',
      name: 'SuperAdmin Central',
      alias: 'SuperAdmin',
      bio: 'Control maestro de la plataforma GóndolaLive. Supervisión técnica, financiera y de seguridad.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      country: 'España',
      city: 'Madrid',
      languages: ['Español', 'English'],
      status: 'disponible',
      age: 34,
      isAgeVerified: true,
      isEmailVerified: true,
      isBanned: false,
      isSuspended: false,
      isVerifiedBadge: true,
      isFeatured: false,
      categories: ['Supervisión'],
      walletBalance: 8450.00,
      rating: 5.0,
      reviewsCount: 142,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_client_demo',
      email: 'cliente@gondolalive.com',
      passwordHash: 'cliente123',
      role: 'cliente',
      name: 'Martín Almada',
      alias: 'Martin_Explorer',
      bio: 'Cliente frecuente. Apasionado del aprendizaje en vivo, consultoría de negocios y entrenamiento físico.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      country: 'Argentina',
      city: 'Buenos Aires',
      languages: ['Español', 'English'],
      status: 'disponible',
      age: 29,
      isAgeVerified: true,
      isEmailVerified: true,
      isBanned: false,
      isSuspended: false,
      isVerifiedBadge: true,
      isFeatured: false,
      categories: ['Cliente'],
      walletBalance: 125.50,
      rating: 4.9,
      reviewsCount: 18,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_prov_1',
      email: 'sofia.fitness@gondolalive.com',
      passwordHash: 'sofia123',
      role: 'prestador',
      name: 'Sofía Valenzuela',
      alias: 'SofiFit_Coach',
      bio: 'Entrenadora personal certificada por NASM. Especialista en tonificación funcional, hipertrofia y planes de nutrición sin dietas restrictivas.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
      country: 'Estados Unidos',
      city: 'Miami, FL',
      languages: ['Español', 'English'],
      status: 'disponible',
      age: 27,
      isAgeVerified: true,
      isEmailVerified: true,
      isBanned: false,
      isSuspended: false,
      isVerifiedBadge: true,
      isFeatured: true,
      categories: ['Fitness & Nutrición'],
      walletBalance: 420.00,
      rating: 4.96,
      reviewsCount: 88,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_prov_2',
      email: 'lucas.startups@gondolalive.com',
      passwordHash: 'lucas123',
      role: 'prestador',
      name: 'Lucas Moretti',
      alias: 'Lucas_Growth',
      bio: 'Ex-director de producto y fundador serial. Ayudo a fundadores y profesionales a validar ideas de negocio, levantar capital semilla y optimizar funnel de ventas.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
      country: 'España',
      city: 'Madrid',
      languages: ['Español', 'English', 'Italiano'],
      status: 'disponible',
      age: 35,
      isAgeVerified: true,
      isEmailVerified: true,
      isBanned: false,
      isSuspended: false,
      isVerifiedBadge: true,
      isFeatured: true,
      categories: ['Consultoría & Negocios', 'Finanzas & Inversión'],
      walletBalance: 890.00,
      rating: 4.98,
      reviewsCount: 114,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_prov_3',
      email: 'elena.languages@gondolalive.com',
      passwordHash: 'elena123',
      role: 'prestador',
      name: 'Elena Rostova',
      alias: 'Elena_Polyglot',
      bio: 'Lingüista y coach de fonética para entrevistas de trabajo en Silicon Valley y Londres. Clases 1 a 1 de acento neutro y soltura conversacional.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
      country: 'Reino Unido',
      city: 'Londres',
      languages: ['English', 'Español', 'Français', 'Deutsch'],
      status: 'disponible',
      age: 31,
      isAgeVerified: true,
      isEmailVerified: true,
      isBanned: false,
      isSuspended: false,
      isVerifiedBadge: true,
      isFeatured: true,
      categories: ['Idiomas & Educación'],
      walletBalance: 310.00,
      rating: 4.94,
      reviewsCount: 65,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_prov_4',
      email: 'mateo.dev@gondolalive.com',
      passwordHash: 'mateo123',
      role: 'prestador',
      name: 'Mateo Chen',
      alias: 'Mateo_TechLead',
      bio: 'Arquitecto de software fullstack (React, Node, Kubernetes, AI). Code reviews en directo, preparación técnica para entrevistas FAANG y debug en tiempo real.',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80',
      country: 'Argentina',
      city: 'Buenos Aires',
      languages: ['Español', 'English', 'Mandarin'],
      status: 'ocupado',
      age: 28,
      isAgeVerified: true,
      isEmailVerified: true,
      isBanned: false,
      isSuspended: false,
      isVerifiedBadge: true,
      isFeatured: false,
      categories: ['Tecnología & Código'],
      walletBalance: 615.00,
      rating: 4.92,
      reviewsCount: 52,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_prov_5',
      email: 'valentina.style@gondolalive.com',
      passwordHash: 'vale123',
      role: 'prestador',
      name: 'Valentina Rossi',
      alias: 'Valen_StyleLab',
      bio: 'Estilista de moda y colorimetría profesional en Milán. Asesoría de guardarropa en videollamada: revisamos tus prendas en vivo y creamos combinaciones de impacto.',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
      country: 'Italia',
      city: 'Milán',
      languages: ['Italiano', 'Español', 'English'],
      status: 'disponible',
      age: 26,
      isAgeVerified: true,
      isEmailVerified: true,
      isBanned: false,
      isSuspended: false,
      isVerifiedBadge: true,
      isFeatured: true,
      categories: ['Moda & Imagen'],
      walletBalance: 530.00,
      rating: 4.89,
      reviewsCount: 47,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_prov_6',
      email: 'carlos.mind@gondolalive.com',
      passwordHash: 'carlos123',
      role: 'prestador',
      name: 'Dr. Carlos Benítez',
      alias: 'Dr_Carlos_Mind',
      bio: 'Psicólogo clínico enfocado en reducción del estrés, burnout tecnológico y liderazgo consciente. Sesiones guiadas de enfoque y reestructuración cognitiva.',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80',
      country: 'México',
      city: 'Ciudad de México',
      languages: ['Español', 'English'],
      status: 'disponible',
      age: 42,
      isAgeVerified: true,
      isEmailVerified: true,
      isBanned: false,
      isSuspended: false,
      isVerifiedBadge: true,
      isFeatured: false,
      categories: ['Bienestar & Psicología'],
      walletBalance: 780.00,
      rating: 4.97,
      reviewsCount: 96,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_prov_7',
      email: 'camila.vocal@gondolalive.com',
      passwordHash: 'camila123',
      role: 'prestador',
      name: 'Camila Duarte',
      alias: 'Cami_VocalCoach',
      bio: 'Cantante, productora e instructora vocal. Aprende técnicas de respiración diafragmática, calentamiento de cuerdas vocales y presencia escénica.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
      country: 'Colombia',
      city: 'Medellín',
      languages: ['Español', 'Português'],
      status: 'desconectado',
      age: 25,
      isAgeVerified: true,
      isEmailVerified: true,
      isBanned: false,
      isSuspended: false,
      isVerifiedBadge: false,
      isFeatured: false,
      categories: ['Música & Arte'],
      walletBalance: 240.00,
      rating: 4.88,
      reviewsCount: 31,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_prov_8',
      email: 'javier.crypto@gondolalive.com',
      passwordHash: 'javier123',
      role: 'prestador',
      name: 'Javier Alarcón',
      alias: 'Javier_Finanzas',
      bio: 'Especialista en estructuración de portafolios, macroeconomía y gestión de riesgo en activos digitales. Análisis de inversiones 1-a-1 sin intermediarios.',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80',
      country: 'Chile',
      city: 'Santiago',
      languages: ['Español', 'English'],
      status: 'disponible',
      age: 38,
      isAgeVerified: true,
      isEmailVerified: true,
      isBanned: false,
      isSuspended: false,
      isVerifiedBadge: true,
      isFeatured: true,
      categories: ['Finanzas & Inversión', 'Consultoría & Negocios'],
      walletBalance: 1120.00,
      rating: 4.95,
      reviewsCount: 79,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const tariffs: Tariff[] = [
    {
      userId: 'usr_prov_1',
      pricePerMin: 2.50,
      pricePer5Min: 12.00,
      pricePer10Min: 23.00,
      pricePer15Min: 32.00,
      minMinutes: 5,
      maxMinutes: 60,
      autoAccept: true,
      callsEnabled: true,
      updatedAt: now,
    },
    {
      userId: 'usr_prov_2',
      pricePerMin: 4.00,
      pricePer5Min: 19.00,
      pricePer10Min: 36.00,
      pricePer15Min: 50.00,
      minMinutes: 5,
      maxMinutes: 60,
      autoAccept: false,
      callsEnabled: true,
      updatedAt: now,
    },
    {
      userId: 'usr_prov_3',
      pricePerMin: 1.80,
      pricePer5Min: 8.50,
      pricePer10Min: 16.00,
      pricePer15Min: 24.00,
      minMinutes: 5,
      maxMinutes: 60,
      autoAccept: true,
      callsEnabled: true,
      updatedAt: now,
    },
    {
      userId: 'usr_prov_4',
      pricePerMin: 3.50,
      pricePer5Min: 16.50,
      pricePer10Min: 32.00,
      pricePer15Min: 45.00,
      minMinutes: 5,
      maxMinutes: 45,
      autoAccept: false,
      callsEnabled: true,
      updatedAt: now,
    },
    {
      userId: 'usr_prov_5',
      pricePerMin: 2.20,
      pricePer5Min: 10.50,
      pricePer10Min: 20.00,
      pricePer15Min: 28.00,
      minMinutes: 5,
      maxMinutes: 60,
      autoAccept: true,
      callsEnabled: true,
      updatedAt: now,
    },
    {
      userId: 'usr_prov_6',
      pricePerMin: 3.00,
      pricePer5Min: 14.50,
      pricePer10Min: 28.00,
      pricePer15Min: 40.00,
      minMinutes: 10,
      maxMinutes: 60,
      autoAccept: true,
      callsEnabled: true,
      updatedAt: now,
    },
    {
      userId: 'usr_prov_7',
      pricePerMin: 2.00,
      pricePer5Min: 9.50,
      pricePer10Min: 18.00,
      pricePer15Min: 25.00,
      minMinutes: 5,
      maxMinutes: 45,
      autoAccept: false,
      callsEnabled: false,
      updatedAt: now,
    },
    {
      userId: 'usr_prov_8',
      pricePerMin: 3.80,
      pricePer5Min: 18.00,
      pricePer10Min: 35.00,
      pricePer15Min: 49.00,
      minMinutes: 5,
      maxMinutes: 60,
      autoAccept: true,
      callsEnabled: true,
      updatedAt: now,
    },
  ];

  const photos: Photo[] = [
    // Sofía Valenzuela
    {
      id: 'p_sof_1',
      userId: 'usr_prov_1',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      caption: 'Entrenamiento funcional y asesoramiento en nutrición activa.',
      isPrimary: true,
      isPrivate: false,
      order: 1,
      createdAt: now,
    },
    {
      id: 'p_sof_2',
      userId: 'usr_prov_1',
      url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
      caption: 'Rutina matutina de estiramientos y activación muscular.',
      isPrimary: false,
      isPrivate: false,
      order: 2,
      createdAt: now,
    },
    {
      id: 'p_sof_3',
      userId: 'usr_prov_1',
      url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
      caption: 'Entrenamiento en sala y pesas libres.',
      isPrimary: false,
      isPrivate: false,
      order: 3,
      createdAt: now,
    },
    {
      id: 'p_sof_4',
      userId: 'usr_prov_1',
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      caption: 'Plan de hábitos y macros personalizado (Privado para clientes).',
      isPrimary: false,
      isPrivate: true,
      order: 4,
      createdAt: now,
    },

    // Lucas Moretti
    {
      id: 'p_luc_1',
      userId: 'usr_prov_2',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      caption: 'Estrategia de negocios y pitch decks para inversión.',
      isPrimary: true,
      isPrivate: false,
      order: 1,
      createdAt: now,
    },
    {
      id: 'p_luc_2',
      userId: 'usr_prov_2',
      url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
      caption: 'Workshops con fundadores y rondas de feedback.',
      isPrimary: false,
      isPrivate: false,
      order: 2,
      createdAt: now,
    },
    {
      id: 'p_luc_3',
      userId: 'usr_prov_2',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      caption: 'Sesión de estrategia en oficina central.',
      isPrimary: false,
      isPrivate: false,
      order: 3,
      createdAt: now,
    },

    // Elena Rostova
    {
      id: 'p_ele_1',
      userId: 'usr_prov_3',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
      caption: 'Clases 1 a 1 de pronunciación y acento corporativo.',
      isPrimary: true,
      isPrivate: false,
      order: 1,
      createdAt: now,
    },
    {
      id: 'p_ele_2',
      userId: 'usr_prov_3',
      url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
      caption: 'Material de fonética interactiva y casos reales.',
      isPrimary: false,
      isPrivate: false,
      order: 2,
      createdAt: now,
    },

    // Valentina Rossi
    {
      id: 'p_val_1',
      userId: 'usr_prov_5',
      url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      caption: 'Sesión de estilismo en vivo y colorimetría estacional.',
      isPrimary: true,
      isPrivate: false,
      order: 1,
      createdAt: now,
    },
    {
      id: 'p_val_2',
      userId: 'usr_prov_5',
      url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
      caption: 'Selección de básicos atemporales y cápsula de viaje.',
      isPrimary: false,
      isPrivate: false,
      order: 2,
      createdAt: now,
    },
  ];

  const calls: CallRequest[] = [
    {
      id: 'call_seed_1',
      callId: 'room_seed_101',
      clientId: 'usr_client_demo',
      clientName: 'Martín Almada',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      providerId: 'usr_prov_1',
      providerName: 'Sofía Valenzuela',
      providerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
      durationMinutes: 10,
      totalAmount: 23.00,
      commissionAmount: 3.45,
      providerAmount: 19.55,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      startedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      endedAt: new Date(Date.now() - 86400000 * 6 + 600000).toISOString(),
      actualSecondsUsed: 600,
    },
    {
      id: 'call_seed_2',
      callId: 'room_seed_102',
      clientId: 'usr_client_demo',
      clientName: 'Martín Almada',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      providerId: 'usr_prov_2',
      providerName: 'Lucas Moretti',
      providerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
      durationMinutes: 15,
      totalAmount: 50.00,
      commissionAmount: 9.00,
      providerAmount: 41.00,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      startedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      endedAt: new Date(Date.now() - 86400000 * 5 + 900000).toISOString(),
      actualSecondsUsed: 900,
    },
    {
      id: 'call_seed_3',
      callId: 'room_seed_103',
      clientId: 'usr_client_demo',
      clientName: 'Martín Almada',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      providerId: 'usr_prov_1',
      providerName: 'Sofía Valenzuela',
      providerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
      durationMinutes: 15,
      totalAmount: 32.00,
      commissionAmount: 4.80,
      providerAmount: 27.20,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      startedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      endedAt: new Date(Date.now() - 86400000 * 4 + 900000).toISOString(),
      actualSecondsUsed: 880,
    },
    {
      id: 'call_seed_4',
      callId: 'room_seed_104',
      clientId: 'usr_client_demo',
      clientName: 'Martín Almada',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      providerId: 'usr_prov_1',
      providerName: 'Sofía Valenzuela',
      providerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
      durationMinutes: 20,
      totalAmount: 50.00,
      commissionAmount: 7.50,
      providerAmount: 42.50,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      endedAt: new Date(Date.now() - 86400000 * 3 + 1200000).toISOString(),
      actualSecondsUsed: 1200,
    },
    {
      id: 'call_seed_5',
      callId: 'room_seed_105',
      clientId: 'usr_client_demo',
      clientName: 'Martín Almada',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      providerId: 'usr_prov_1',
      providerName: 'Sofía Valenzuela',
      providerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
      durationMinutes: 10,
      totalAmount: 23.00,
      commissionAmount: 3.45,
      providerAmount: 19.55,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      endedAt: new Date(Date.now() - 86400000 * 2 + 600000).toISOString(),
      actualSecondsUsed: 590,
    },
    {
      id: 'call_seed_6',
      callId: 'room_seed_106',
      clientId: 'usr_client_demo',
      clientName: 'Martín Almada',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      providerId: 'usr_prov_2',
      providerName: 'Lucas Moretti',
      providerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
      durationMinutes: 10,
      totalAmount: 36.00,
      commissionAmount: 6.48,
      providerAmount: 29.52,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      startedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      endedAt: new Date(Date.now() - 86400000 * 1 + 600000).toISOString(),
      actualSecondsUsed: 600,
    },
    {
      id: 'call_seed_7',
      callId: 'room_seed_107',
      clientId: 'usr_client_demo',
      clientName: 'Martín Almada',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      providerId: 'usr_prov_1',
      providerName: 'Sofía Valenzuela',
      providerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
      durationMinutes: 15,
      totalAmount: 32.00,
      commissionAmount: 4.80,
      providerAmount: 27.20,
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      endedAt: new Date(Date.now() - 3600000 * 2 + 900000).toISOString(),
      actualSecondsUsed: 900,
    },
  ];

  const transactions: Transaction[] = [
    {
      id: 'tx_seed_1',
      userId: 'usr_client_demo',
      type: 'deposit',
      amount: 200.00,
      balanceAfter: 200.00,
      description: 'Recarga de saldo con Tarjeta Visa **** 4242',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'tx_seed_2',
      userId: 'usr_client_demo',
      type: 'call_payment',
      amount: -23.00,
      balanceAfter: 177.00,
      referenceId: 'call_seed_1',
      description: 'Videollamada 10 min con Sofía Valenzuela',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'tx_seed_3',
      userId: 'usr_client_demo',
      type: 'call_payment',
      amount: -50.00,
      balanceAfter: 127.00,
      referenceId: 'call_seed_2',
      description: 'Videollamada 15 min con Lucas Moretti',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'tx_seed_4',
      userId: 'usr_prov_1',
      type: 'call_earning',
      amount: 19.55,
      balanceAfter: 420.00,
      referenceId: 'call_seed_1',
      description: 'Honorario por videollamada de Martín Almada (10m)',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'tx_seed_5',
      userId: 'usr_superadmin',
      type: 'commission_fee',
      amount: 3.45,
      balanceAfter: 8441.00,
      referenceId: 'call_seed_1',
      description: 'Comisión plataforma (15%) videollamada Sofía Valenzuela',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  const withdrawals: WithdrawalRequest[] = [
    {
      id: 'wd_seed_1',
      userId: 'usr_prov_1',
      userName: 'Sofía Valenzuela',
      userEmail: 'sofia.fitness@gondolalive.com',
      amount: 150.00,
      method: 'bank_transfer',
      accountDetails: 'Chase Bank - Routing: 021000021 - Acc: ****4892',
      status: 'approved',
      notes: 'Transferencia procesada con éxito por SuperAdmin.',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      processedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'wd_seed_2',
      userId: 'usr_prov_2',
      userName: 'Lucas Moretti',
      userEmail: 'lucas.startups@gondolalive.com',
      amount: 250.00,
      method: 'crypto_usdt',
      accountDetails: 'Red TRC20: TLAy2Qj9x98nZkw9kLmB8eQW1281x99z',
      status: 'pending',
      notes: 'Pendiente de verificación de hash de red.',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ];

  const reports: Report[] = [
    {
      id: 'rep_seed_1',
      reporterId: 'usr_client_demo',
      reporterName: 'Martín Almada',
      reportedUserId: 'usr_prov_7',
      reportedUserName: 'Camila Duarte',
      reason: 'Calidad de audio deficiente durante prueba previa',
      description: 'El micrófono tenía interferencias constantes y no se lograba escuchar con claridad.',
      status: 'reviewed',
      actionTaken: 'Se solicitó al usuario prestador verificar sus periféricos antes de habilitar nuevas llamadas.',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ];

  const blocks: BlockedUser[] = [];

  const auditLogs: AuditLog[] = [
    {
      id: 'audit_1',
      adminId: 'usr_superadmin',
      adminEmail: 'admin@gondolalive.com',
      action: 'APPROVE_WITHDRAWAL',
      details: 'Aprobado retiro de $150.00 USD para Sofía Valenzuela (Banco)',
      timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'audit_2',
      adminId: 'usr_superadmin',
      adminEmail: 'admin@gondolalive.com',
      action: 'UPDATE_SETTINGS',
      details: 'Ajuste de comisión general al 15% y activación de WebRTC en alta resolución.',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif_1',
      userId: 'usr_client_demo',
      title: '¡Bienvenido a GóndolaLive!',
      message: 'Explora nuestra góndola de prestadores verificados y agenda tu primera videollamada.',
      type: 'system',
      read: true,
      createdAt: now,
    },
    {
      id: 'notif_2',
      userId: 'usr_prov_1',
      title: 'Honorario acreditado en billetera',
      message: 'Recibiste $19.55 USD por tu videollamada con Martín Almada.',
      type: 'payment_confirmed',
      read: false,
      createdAt: now,
    },
    {
      id: 'notif_3',
      userId: 'usr_prov_2',
      title: 'Solicitud de retiro en proceso',
      message: 'Tu solicitud de retiro por $250.00 USDT está siendo revisada por el equipo SuperAdmin.',
      type: 'withdrawal_status',
      read: false,
      createdAt: now,
    },
  ];

  return {
    users,
    photos,
    tariffs,
    calls,
    transactions,
    withdrawals,
    reports,
    blocks,
    settings: DEFAULT_SETTINGS,
    auditLogs,
    notifications,
  };
}

class RelationalDatabase {
  private data: DatabaseSchema;
  private isWriting = false;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure settings exist and merge with default
        parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
        return parsed;
      }
    } catch (e) {
      console.warn('[DB] Could not load persisted db, creating new seed:', e);
    }
    const seed = getSeedData();
    this.persistSync(seed);
    return seed;
  }

  private persistSync(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed to persist data:', e);
    }
  }

  public save() {
    if (this.isWriting) return;
    this.isWriting = true;
    setTimeout(() => {
      this.persistSync(this.data);
      this.isWriting = false;
    }, 100);
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.users[idx];
  }

  // --- Photos ---
  public getPhotosByUserId(userId: string): Photo[] {
    return this.data.photos
      .filter(p => p.userId === userId)
      .sort((a, b) => a.order - b.order);
  }

  public addPhoto(photo: Photo): Photo {
    this.data.photos.push(photo);
    this.save();
    return photo;
  }

  public deletePhoto(photoId: string, userId: string): boolean {
    const prevLen = this.data.photos.length;
    this.data.photos = this.data.photos.filter(p => !(p.id === photoId && p.userId === userId));
    const deleted = this.data.photos.length < prevLen;
    if (deleted) this.save();
    return deleted;
  }

  public updatePhotoOrder(userId: string, photoIds: string[]): boolean {
    photoIds.forEach((id, idx) => {
      const p = this.data.photos.find(photo => photo.id === id && photo.userId === userId);
      if (p) p.order = idx + 1;
    });
    this.save();
    return true;
  }

  public setPrimaryPhoto(userId: string, photoId: string): boolean {
    this.data.photos.forEach(p => {
      if (p.userId === userId) {
        p.isPrimary = p.id === photoId;
      }
    });
    const primary = this.data.photos.find(p => p.id === photoId && p.userId === userId);
    if (primary) {
      this.updateUser(userId, { avatar: primary.url });
    }
    this.save();
    return true;
  }

  public togglePhotoPrivacy(userId: string, photoId: string, isPrivate: boolean): boolean {
    const photo = this.data.photos.find(p => p.id === photoId && p.userId === userId);
    if (!photo) return false;
    photo.isPrivate = isPrivate;
    this.save();
    return true;
  }

  // --- Tariffs ---
  public getTariffByUserId(userId: string): Tariff {
    let tariff = this.data.tariffs.find(t => t.userId === userId);
    if (!tariff) {
      tariff = {
        userId,
        pricePerMin: 2.0,
        pricePer5Min: 10.0,
        pricePer10Min: 19.0,
        pricePer15Min: 27.0,
        minMinutes: 5,
        maxMinutes: 60,
        autoAccept: true,
        callsEnabled: true,
        updatedAt: new Date().toISOString(),
      };
      this.data.tariffs.push(tariff);
      this.save();
    }
    return tariff;
  }

  public updateTariff(userId: string, updates: Partial<Tariff>): Tariff {
    const idx = this.data.tariffs.findIndex(t => t.userId === userId);
    const now = new Date().toISOString();
    if (idx === -1) {
      const newTariff: Tariff = {
        userId,
        pricePerMin: 2.0,
        pricePer5Min: 10.0,
        pricePer10Min: 19.0,
        pricePer15Min: 27.0,
        minMinutes: 5,
        maxMinutes: 60,
        autoAccept: true,
        callsEnabled: true,
        updatedAt: now,
        ...updates,
      };
      this.data.tariffs.push(newTariff);
      this.save();
      return newTariff;
    }
    this.data.tariffs[idx] = { ...this.data.tariffs[idx], ...updates, updatedAt: now };
    this.save();
    return this.data.tariffs[idx];
  }

  // --- Calls ---
  public getCalls(): CallRequest[] {
    return this.data.calls;
  }

  public getCallById(id: string): CallRequest | undefined {
    return this.data.calls.find(c => c.id === id || c.callId === id);
  }

  public addCall(call: CallRequest): CallRequest {
    this.data.calls.push(call);
    this.save();
    return call;
  }

  public updateCall(id: string, updates: Partial<CallRequest>): CallRequest | undefined {
    const idx = this.data.calls.findIndex(c => c.id === id || c.callId === id);
    if (idx === -1) return undefined;
    this.data.calls[idx] = { ...this.data.calls[idx], ...updates };
    this.save();
    return this.data.calls[idx];
  }

  public getUserCalls(userId: string): CallRequest[] {
    return this.data.calls
      .filter(c => c.clientId === userId || c.providerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Transactions ---
  public getTransactions(): Transaction[] {
    return this.data.transactions;
  }

  public getUserTransactions(userId: string): Transaction[] {
    return this.data.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addTransaction(tx: Transaction): Transaction {
    this.data.transactions.push(tx);
    this.save();
    return tx;
  }

  // --- Withdrawals ---
  public getWithdrawals(): WithdrawalRequest[] {
    return this.data.withdrawals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getUserWithdrawals(userId: string): WithdrawalRequest[] {
    return this.data.withdrawals
      .filter(w => w.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addWithdrawal(withdrawal: WithdrawalRequest): WithdrawalRequest {
    this.data.withdrawals.push(withdrawal);
    this.save();
    return withdrawal;
  }

  public updateWithdrawal(id: string, updates: Partial<WithdrawalRequest>): WithdrawalRequest | undefined {
    const idx = this.data.withdrawals.findIndex(w => w.id === id);
    if (idx === -1) return undefined;
    this.data.withdrawals[idx] = { ...this.data.withdrawals[idx], ...updates };
    this.save();
    return this.data.withdrawals[idx];
  }

  // --- Reports & Moderation ---
  public getReports(): Report[] {
    return this.data.reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addReport(report: Report): Report {
    this.data.reports.push(report);
    this.save();
    return report;
  }

  public updateReport(id: string, updates: Partial<Report>): Report | undefined {
    const idx = this.data.reports.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    this.data.reports[idx] = { ...this.data.reports[idx], ...updates };
    this.save();
    return this.data.reports[idx];
  }

  // --- Blocked Users ---
  public getBlockedUsers(userId: string): BlockedUser[] {
    return this.data.blocks.filter(b => b.userId === userId);
  }

  public isUserBlocked(userId: string, targetId: string): boolean {
    return this.data.blocks.some(b => (b.userId === userId && b.blockedUserId === targetId) || (b.userId === targetId && b.blockedUserId === userId));
  }

  public blockUser(userId: string, blockedUserId: string): BlockedUser {
    const block: BlockedUser = {
      id: 'blk_' + Math.random().toString(36).substring(2, 9),
      userId,
      blockedUserId,
      createdAt: new Date().toISOString(),
    };
    this.data.blocks.push(block);
    this.save();
    return block;
  }

  public unblockUser(userId: string, blockedUserId: string): boolean {
    const prev = this.data.blocks.length;
    this.data.blocks = this.data.blocks.filter(b => !(b.userId === userId && b.blockedUserId === blockedUserId));
    const removed = this.data.blocks.length < prev;
    if (removed) this.save();
    return removed;
  }

  // --- Settings ---
  public getSettings(): PlatformSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<PlatformSettings>): PlatformSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAuditLog(adminId: string, adminEmail: string, action: string, details: string): AuditLog {
    const log: AuditLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      adminId,
      adminEmail,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
    return log;
  }

  // --- Notifications ---
  public getNotifications(userId: string): NotificationItem[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(userId: string, title: string, message: string, type: NotificationItem['type'], data?: any): NotificationItem {
    const notif: NotificationItem = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId,
      title,
      message,
      type,
      read: false,
      data,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public markNotificationAsRead(userId: string, id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(userId: string): boolean {
    this.data.notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    this.save();
    return true;
  }
}

export const db = new RelationalDatabase();
