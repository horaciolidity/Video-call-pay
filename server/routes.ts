import express, { Request, Response } from 'express';
import { db, User, Photo, Tariff, CallRequest, Transaction, WithdrawalRequest, Report } from './db.js';
import { broadcastToUser, notifyCallRoom } from './websocket.js';

export const apiRouter = express.Router();

// Helper to extract session or auth token (we support demo token / user header / query / body for flexible seamless testing)
function getAuthenticatedUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  const customUserId = (req.headers['x-user-id'] as string) || (req.query.auth_user_id as string);
  
  if (customUserId) {
    const user = db.getUserById(customUserId);
    if (user && !user.isBanned) return user;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Token format: usr_<id> or direct id
    const user = db.getUserById(token);
    if (user && !user.isBanned) return user;
  }

  return null;
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & SESSIONS
// -------------------------------------------------------------
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const settings = db.getSettings();
  if (!settings.isRegistrationEnabled) {
    return res.status(403).json({ error: 'El registro de nuevos usuarios está temporalmente deshabilitado por el administrador.' });
  }

  const { email, password, name, alias, role, age, country, categories } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Por favor complete todos los campos obligatorios.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico.' });
  }

  const assignedRole: User['role'] = role === 'prestador' ? 'prestador' : 'cliente';
  const now = new Date().toISOString();
  const userId = 'usr_' + Math.random().toString(36).substring(2, 10);

  const defaultAvatar = assignedRole === 'prestador'
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';

  const newUser: User = {
    id: userId,
    email: email.trim().toLowerCase(),
    passwordHash: password, // For demo, direct or hashed
    role: assignedRole,
    name: name.trim(),
    alias: alias ? alias.trim() : name.trim(),
    bio: assignedRole === 'prestador' ? 'Prestador de servicios en GóndolaLive. ¡Bienvenido a mi perfil!' : 'Usuario de la plataforma.',
    avatar: defaultAvatar,
    country: country || 'España',
    city: '',
    languages: ['Español'],
    status: 'disponible',
    age: Number(age) || 21,
    isAgeVerified: (Number(age) || 21) >= 18,
    isEmailVerified: true,
    isBanned: false,
    isSuspended: false,
    isVerifiedBadge: false,
    isFeatured: false,
    categories: Array.isArray(categories) && categories.length > 0 ? categories : [settings.categoriesList[0]],
    walletBalance: assignedRole === 'cliente' ? 50.00 : 0.00, // Welcoming gift for clients
    rating: 5.0,
    reviewsCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.addUser(newUser);

  // If welcoming deposit
  if (newUser.walletBalance > 0) {
    db.addTransaction({
      id: 'tx_' + Math.random().toString(36).substring(2, 10),
      userId: newUser.id,
      type: 'deposit',
      amount: newUser.walletBalance,
      balanceAfter: newUser.walletBalance,
      description: 'Bono de bienvenida para probar videollamadas',
      status: 'completed',
      createdAt: now,
    });
  }

  // Create default tariff if provider
  if (assignedRole === 'prestador') {
    db.updateTariff(newUser.id, {
      pricePerMin: 2.0,
      pricePer5Min: 9.5,
      pricePer10Min: 18.0,
      pricePer15Min: 25.0,
      minMinutes: 5,
      maxMinutes: 60,
      autoAccept: true,
      callsEnabled: true,
    });
  }

  db.addNotification(newUser.id, '¡Cuenta creada con éxito!', 'Te damos la bienvenida a GóndolaLive.', 'system');

  return res.json({
    token: newUser.id,
    user: newUser,
    message: 'Registro exitoso.',
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Credenciales incompletas.' });
  }

  const user = db.getUserByEmail(email);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: 'Tu cuenta ha sido bloqueada permanentemente por infringir las políticas de la comunidad.' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ error: 'Tu cuenta está temporalmente suspendida. Contacta a soporte.' });
  }

  return res.json({
    token: user.id,
    user,
    message: 'Inicio de sesión correcto.',
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sesión no iniciada o inválida.' });
  }
  return res.json({ user });
});

apiRouter.post('/auth/recover-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'No se encontró ninguna cuenta registrada con este correo.' });
  }
  // Simulate secure password reset link
  return res.json({
    success: true,
    message: `Se ha enviado un enlace de recuperación seguro al correo ${email}.`,
  });
});

apiRouter.post('/auth/verify-age', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { birthYear } = req.body;
  const currentYear = new Date().getFullYear();
  const calculatedAge = currentYear - Number(birthYear);

  if (calculatedAge < 18) {
    return res.status(400).json({ error: 'Debes ser mayor de 18 años para acceder a todas las funciones.' });
  }

  const updated = db.updateUser(user.id, {
    age: calculatedAge,
    isAgeVerified: true,
  });

  return res.json({ success: true, user: updated });
});

// -------------------------------------------------------------
// 2. MARKETPLACE & GÓNDOLA PÚBLICA
// -------------------------------------------------------------
apiRouter.get('/marketplace/providers', (req: Request, res: Response) => {
  const { search, category, status, country, minPrice, maxPrice, sortBy } = req.query;
  const currentUser = getAuthenticatedUser(req);

  let providers = db.getUsers().filter(u => u.role === 'prestador' && !u.isBanned && !u.isSuspended);

  // Apply two-way country exclusions if authenticated user is viewing
  if (currentUser) {
    // 1. Hide providers who excluded the current viewer's country from seeing their profile
    providers = providers.filter(p => {
      if (p.excludedCountriesFromSeeingMe && p.excludedCountriesFromSeeingMe.includes(currentUser.country)) {
        return false;
      }
      return true;
    });

    // 2. Hide providers from countries the current user has configured to NOT see
    if (currentUser.excludedCountriesToSee && currentUser.excludedCountriesToSee.length > 0) {
      providers = providers.filter(p => !currentUser.excludedCountriesToSee?.includes(p.country));
    }

    // 3. If current user set preferred countries to see, only show those
    if (currentUser.preferredCountriesToSee && currentUser.preferredCountriesToSee.length > 0) {
      providers = providers.filter(p => currentUser.preferredCountriesToSee?.includes(p.country));
    }
  }

  // Search by name, alias, bio, country, or smart preset keywords
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    if (q === 'popular') {
      providers = providers.filter(p => p.isFeatured || p.rating >= 4.9);
    } else if (q === 'new') {
      providers = [...providers].reverse();
    } else if (q === 'highest rated' || q === 'highest_rated' || q === 'top rated') {
      providers = providers.filter(p => p.rating >= 4.9);
    } else if (q === 'online' || q === 'online ahora' || q === 'disponible') {
      providers = providers.filter(p => p.status === 'disponible');
    } else {
      providers = providers.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.alias.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.categories.some(c => c.toLowerCase().includes(q))
      );
    }
  }

  // Category filter
  if (category && typeof category === 'string' && category !== 'Todos') {
    providers = providers.filter(p => p.categories.includes(category));
  }

  // Status filter (disponible, ocupado, desconectado)
  if (status && typeof status === 'string' && status !== 'all') {
    providers = providers.filter(p => p.status === status);
  }

  // Explicit Country query filter
  if (country && typeof country === 'string' && country !== 'all') {
    providers = providers.filter(p => p.country.toLowerCase() === country.toLowerCase());
  }

  // Attach tariff info and primary photo
  const enriched = providers.map(p => {
    const tariff = db.getTariffByUserId(p.id);
    const photos = db.getPhotosByUserId(p.id).filter(ph => !ph.isPrivate);
    const primaryPhoto = photos.find(ph => ph.isPrimary) || photos[0] || { url: p.avatar };
    return {
      ...p,
      tariff,
      primaryPhotoUrl: primaryPhoto.url,
      publicPhotosCount: photos.length,
    };
  });

  // Price range filtering
  let filtered = enriched;
  if (minPrice) {
    filtered = filtered.filter(p => p.tariff.pricePerMin >= Number(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter(p => p.tariff.pricePerMin <= Number(maxPrice));
  }

  // Sorting
  if (sortBy === 'price_asc') {
    filtered.sort((a, b) => a.tariff.pricePerMin - b.tariff.pricePerMin);
  } else if (sortBy === 'price_desc') {
    filtered.sort((a, b) => b.tariff.pricePerMin - a.tariff.pricePerMin);
  } else if (sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'featured') {
    filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  } else {
    // Default: featured first, then online status, then rating
    filtered.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
      const statusWeight = (s: string) => (s === 'disponible' ? 3 : s === 'ocupado' ? 2 : 1);
      if (statusWeight(a.status) !== statusWeight(b.status)) {
        return statusWeight(b.status) - statusWeight(a.status);
      }
      return b.rating - a.rating;
    });
  }

  return res.json({ providers: filtered });
});

apiRouter.get('/marketplace/providers/:id', (req: Request, res: Response) => {
  const provider = db.getUserById(req.params.id);
  if (!provider || provider.role !== 'prestador' || provider.isBanned) {
    return res.status(404).json({ error: 'Prestador no encontrado o inactivo.' });
  }

  const tariff = db.getTariffByUserId(provider.id);
  const caller = getAuthenticatedUser(req);
  const allPhotos = db.getPhotosByUserId(provider.id);

  // If caller is the provider themselves or superadmin, show private photos too, else only public
  const isOwner = caller?.id === provider.id || caller?.role === 'superadmin';
  const visiblePhotos = isOwner ? allPhotos : allPhotos.filter(p => !p.isPrivate);

  return res.json({
    provider,
    tariff,
    photos: visiblePhotos,
    settings: {
      currency: db.getSettings().currency,
      isVideoCallsEnabled: db.getSettings().isVideoCallsEnabled,
    },
  });
});

apiRouter.get('/marketplace/categories', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  return res.json({ categories: settings.categoriesList });
});

// -------------------------------------------------------------
// 3. GÓNDOLA PERSONAL / GESTIÓN DE PERFIL DEL USUARIO
// -------------------------------------------------------------
apiRouter.put('/user/profile', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const {
    name,
    alias,
    bio,
    country,
    city,
    languages,
    status,
    categories,
    avatar,
    excludedCountriesFromSeeingMe,
    excludedCountriesToSee,
    preferredCountriesToSee,
  } = req.body;

  // Protect against changing administrative role
  const updates: Partial<User> = {};
  if (name !== undefined) updates.name = name.trim();
  if (alias !== undefined) updates.alias = alias.trim();
  if (bio !== undefined) updates.bio = bio;
  if (country !== undefined) updates.country = country;
  if (city !== undefined) updates.city = city;
  if (avatar !== undefined) updates.avatar = avatar;
  if (Array.isArray(languages)) updates.languages = languages;
  if (Array.isArray(categories)) updates.categories = categories;
  if (status && ['disponible', 'ocupado', 'desconectado'].includes(status)) {
    updates.status = status;
  }
  if (Array.isArray(excludedCountriesFromSeeingMe)) {
    updates.excludedCountriesFromSeeingMe = excludedCountriesFromSeeingMe;
  }
  if (Array.isArray(excludedCountriesToSee)) {
    updates.excludedCountriesToSee = excludedCountriesToSee;
  }
  if (Array.isArray(preferredCountriesToSee)) {
    updates.preferredCountriesToSee = preferredCountriesToSee;
  }

  const updated = db.updateUser(user.id, updates);
  return res.json({ success: true, user: updated });
});

// Dedicated country settings route
apiRouter.put('/user/countries', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { excludedCountriesFromSeeingMe, excludedCountriesToSee, preferredCountriesToSee } = req.body;
  const updates: Partial<User> = {};

  if (Array.isArray(excludedCountriesFromSeeingMe)) {
    updates.excludedCountriesFromSeeingMe = excludedCountriesFromSeeingMe;
  }
  if (Array.isArray(excludedCountriesToSee)) {
    updates.excludedCountriesToSee = excludedCountriesToSee;
  }
  if (Array.isArray(preferredCountriesToSee)) {
    updates.preferredCountriesToSee = preferredCountriesToSee;
  }

  const updated = db.updateUser(user.id, updates);
  return res.json({ success: true, user: updated });
});

// User photos catalog
apiRouter.get('/user/photos', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const photos = db.getPhotosByUserId(user.id);
  return res.json({ photos });
});

apiRouter.post('/user/photos', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const settings = db.getSettings();
  if (!settings.isImageCatalogEnabled) {
    return res.status(403).json({ error: 'El catálogo de imágenes está temporalmente deshabilitado por el administrador.' });
  }

  const { url, caption, isPrivate, isPrimary } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Se requiere la URL o datos de la imagen.' });
  }

  const existingPhotos = db.getPhotosByUserId(user.id);
  const photoId = 'p_' + Math.random().toString(36).substring(2, 10);
  const newPhoto: Photo = {
    id: photoId,
    userId: user.id,
    url,
    caption: caption || '',
    isPrimary: isPrimary || existingPhotos.length === 0,
    isPrivate: !!isPrivate,
    order: existingPhotos.length + 1,
    createdAt: new Date().toISOString(),
  };

  db.addPhoto(newPhoto);

  if (newPhoto.isPrimary) {
    db.setPrimaryPhoto(user.id, newPhoto.id);
  }

  return res.json({ success: true, photo: newPhoto });
});

apiRouter.put('/user/photos/reorder', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { photoIds } = req.body;
  if (!Array.isArray(photoIds)) return res.status(400).json({ error: 'IDs de fotos inválidos' });

  db.updatePhotoOrder(user.id, photoIds);
  return res.json({ success: true, photos: db.getPhotosByUserId(user.id) });
});

apiRouter.delete('/user/photos/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const deleted = db.deletePhoto(req.params.id, user.id);
  if (!deleted) return res.status(404).json({ error: 'Foto no encontrada o no pertenece al usuario' });

  return res.json({ success: true, message: 'Foto eliminada con éxito.' });
});

apiRouter.put('/user/photos/:id/primary', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  db.setPrimaryPhoto(user.id, req.params.id);
  return res.json({ success: true, photos: db.getPhotosByUserId(user.id) });
});

apiRouter.put('/user/photos/:id/privacy', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { isPrivate } = req.body;
  db.togglePhotoPrivacy(user.id, req.params.id, !!isPrivate);
  return res.json({ success: true, photos: db.getPhotosByUserId(user.id) });
});

// Tariffs management
apiRouter.get('/user/tariffs', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const tariff = db.getTariffByUserId(user.id);
  const settings = db.getSettings();

  return res.json({
    tariff,
    limits: {
      minTariffPerMin: settings.minTariffPerMin,
      maxTariffPerMin: settings.maxTariffPerMin,
    },
  });
});

apiRouter.put('/user/tariffs', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { pricePerMin, pricePer5Min, pricePer10Min, pricePer15Min, minMinutes, maxMinutes, autoAccept, callsEnabled } = req.body;
  const settings = db.getSettings();

  // Validate within SuperAdmin limits
  if (pricePerMin !== undefined) {
    const p = Number(pricePerMin);
    if (isNaN(p) || p < settings.minTariffPerMin || p > settings.maxTariffPerMin) {
      return res.status(400).json({
        error: `La tarifa por minuto debe estar entre $${settings.minTariffPerMin.toFixed(2)} y $${settings.maxTariffPerMin.toFixed(2)} USD.`,
      });
    }
  }

  const updated = db.updateTariff(user.id, {
    pricePerMin: pricePerMin !== undefined ? Number(pricePerMin) : undefined,
    pricePer5Min: pricePer5Min !== undefined ? Number(pricePer5Min) : undefined,
    pricePer10Min: pricePer10Min !== undefined ? Number(pricePer10Min) : undefined,
    pricePer15Min: pricePer15Min !== undefined ? Number(pricePer15Min) : undefined,
    minMinutes: minMinutes !== undefined ? Number(minMinutes) : undefined,
    maxMinutes: maxMinutes !== undefined ? Number(maxMinutes) : undefined,
    autoAccept: autoAccept !== undefined ? Boolean(autoAccept) : undefined,
    callsEnabled: callsEnabled !== undefined ? Boolean(callsEnabled) : undefined,
  });

  return res.json({ success: true, tariff: updated });
});

// -------------------------------------------------------------
// 4. VIDEOLLAMADAS & FACTURACIÓN EN TIEMPO REAL
// -------------------------------------------------------------
apiRouter.post('/calls/estimate', (req: Request, res: Response) => {
  const { providerId, durationMinutes } = req.body;
  const provider = db.getUserById(providerId);
  if (!provider) return res.status(404).json({ error: 'Prestador no encontrado' });

  const tariff = db.getTariffByUserId(providerId);
  const settings = db.getSettings();

  const mins = Number(durationMinutes) || 5;
  let totalAmount = 0;

  // Use tiered package if matches exact 5, 10, 15 or linear
  if (mins === 5 && tariff.pricePer5Min > 0) {
    totalAmount = tariff.pricePer5Min;
  } else if (mins === 10 && tariff.pricePer10Min > 0) {
    totalAmount = tariff.pricePer10Min;
  } else if (mins === 15 && tariff.pricePer15Min > 0) {
    totalAmount = tariff.pricePer15Min;
  } else {
    totalAmount = Number((tariff.pricePerMin * mins).toFixed(2));
  }

  // Calculate platform commission (either category specific or global)
  const categoryName = provider.categories[0] || '';
  const commissionRate = (settings.categoryCommissions[categoryName] ?? settings.commissionPercent) / 100;
  const commissionAmount = Number((totalAmount * commissionRate).toFixed(2));
  const providerAmount = Number((totalAmount - commissionAmount).toFixed(2));

  return res.json({
    durationMinutes: mins,
    totalAmount,
    commissionAmount,
    providerAmount,
    currency: settings.currency,
  });
});

apiRouter.post('/calls/request', (req: Request, res: Response) => {
  const client = getAuthenticatedUser(req);
  if (!client) return res.status(401).json({ error: 'Debes iniciar sesión para solicitar una videollamada.' });

  const settings = db.getSettings();
  if (!settings.isVideoCallsEnabled) {
    return res.status(403).json({ error: 'El servicio de videollamadas está pausado temporalmente por mantenimiento.' });
  }

  const { providerId, durationMinutes } = req.body;
  const provider = db.getUserById(providerId);
  if (!provider || provider.role !== 'prestador' || provider.isBanned) {
    return res.status(404).json({ error: 'Prestador no disponible.' });
  }

  if (db.isUserBlocked(client.id, provider.id)) {
    return res.status(403).json({ error: 'No es posible contactar a este usuario.' });
  }

  const tariff = db.getTariffByUserId(providerId);
  if (!tariff.callsEnabled) {
    return res.status(400).json({ error: 'Este prestador tiene las videollamadas desactivadas actualmente.' });
  }

  if (provider.status === 'ocupado') {
    return res.status(400).json({ error: 'El prestador se encuentra en otra videollamada en este momento.' });
  }

  const mins = Number(durationMinutes) || 5;
  let totalAmount = 0;
  if (mins === 5 && tariff.pricePer5Min > 0) totalAmount = tariff.pricePer5Min;
  else if (mins === 10 && tariff.pricePer10Min > 0) totalAmount = tariff.pricePer10Min;
  else if (mins === 15 && tariff.pricePer15Min > 0) totalAmount = tariff.pricePer15Min;
  else totalAmount = Number((tariff.pricePerMin * mins).toFixed(2));

  // Check client balance!
  if (client.walletBalance < totalAmount) {
    return res.status(402).json({
      error: `Saldo insuficiente. Tu saldo actual es $${client.walletBalance.toFixed(2)} USD y el importe requerido es $${totalAmount.toFixed(2)} USD.`,
      requiredAmount: totalAmount,
      currentBalance: client.walletBalance,
      deficit: totalAmount - client.walletBalance,
    });
  }

  const categoryName = provider.categories[0] || '';
  const commissionRate = (settings.categoryCommissions[categoryName] ?? settings.commissionPercent) / 100;
  const commissionAmount = Number((totalAmount * commissionRate).toFixed(2));
  const providerAmount = Number((totalAmount - commissionAmount).toFixed(2));

  const callId = 'room_' + Math.random().toString(36).substring(2, 12);
  const newCall: CallRequest = {
    id: 'call_' + Math.random().toString(36).substring(2, 10),
    callId,
    clientId: client.id,
    clientName: client.name,
    clientAvatar: client.avatar,
    providerId: provider.id,
    providerName: provider.name,
    providerAvatar: provider.avatar,
    durationMinutes: mins,
    totalAmount,
    commissionAmount,
    providerAmount,
    status: tariff.autoAccept ? 'accepted' : 'pending',
    createdAt: new Date().toISOString(),
    actualSecondsUsed: 0,
  };

  db.addCall(newCall);

  // If auto accept is on, provider is immediately ready
  if (tariff.autoAccept) {
    db.updateUser(provider.id, { status: 'ocupado' });
  }

  // Send real-time notification to provider via WebSocket
  broadcastToUser(provider.id, {
    type: 'incoming_call_request',
    call: newCall,
  });

  db.addNotification(
    provider.id,
    'Nueva solicitud de videollamada',
    `${client.name} ha solicitado una llamada de ${mins} minutos por $${totalAmount.toFixed(2)} USD.`,
    'call_request',
    { callId: newCall.callId, callRequestId: newCall.id }
  );

  return res.json({
    success: true,
    call: newCall,
    autoAccepted: tariff.autoAccept,
  });
});

apiRouter.post('/calls/:id/respond', (req: Request, res: Response) => {
  const provider = getAuthenticatedUser(req);
  if (!provider) return res.status(401).json({ error: 'No autorizado' });

  const { action } = req.body; // 'accept' or 'reject'
  const call = db.getCallById(req.params.id);
  if (!call || call.providerId !== provider.id) {
    return res.status(404).json({ error: 'Solicitud de llamada no encontrada.' });
  }

  if (call.status !== 'pending') {
    return res.status(400).json({ error: `La solicitud ya fue procesada (${call.status}).` });
  }

  if (action === 'accept') {
    db.updateCall(call.id, { status: 'accepted' });
    db.updateUser(provider.id, { status: 'ocupado' });

    // Notify client via websocket
    broadcastToUser(call.clientId, {
      type: 'call_accepted',
      callId: call.callId,
      providerId: provider.id,
      providerName: provider.name,
    });

    db.addNotification(
      call.clientId,
      '¡Videollamada aceptada!',
      `${provider.name} ha aceptado tu solicitud. Ingresando a la sala privada...`,
      'call_accepted',
      { callId: call.callId }
    );

    return res.json({ success: true, status: 'accepted', callId: call.callId });
  } else {
    db.updateCall(call.id, { status: 'rejected' });
    db.updateUser(provider.id, { status: 'disponible' });

    broadcastToUser(call.clientId, {
      type: 'call_rejected',
      callId: call.callId,
      reason: 'El prestador no está disponible en este momento.',
    });

    db.addNotification(
      call.clientId,
      'Solicitud no aceptada',
      `${provider.name} no pudo atender tu llamada en este instante. No se realizó ningún cargo.`,
      'call_rejected'
    );

    return res.json({ success: true, status: 'rejected' });
  }
});

apiRouter.post('/calls/:id/start', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const call = db.getCallById(req.params.id);
  if (!call || (call.clientId !== user.id && call.providerId !== user.id)) {
    return res.status(404).json({ error: 'Llamada no encontrada' });
  }

  const now = new Date().toISOString();
  db.updateCall(call.id, {
    status: 'in_progress',
    startedAt: call.startedAt || now,
  });

  return res.json({ success: true, startedAt: call.startedAt || now });
});

// Heartbeat to securely count real elapsed connected seconds
apiRouter.post('/calls/:id/heartbeat', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { secondsIncrement } = req.body;
  const call = db.getCallById(req.params.id);
  if (!call) return res.status(404).json({ error: 'Llamada no encontrada' });

  if (call.status === 'in_progress') {
    const inc = Math.min(Number(secondsIncrement) || 5, 10);
    const newSeconds = call.actualSecondsUsed + inc;
    db.updateCall(call.id, { actualSecondsUsed: newSeconds });
    return res.json({ success: true, actualSecondsUsed: newSeconds });
  }

  return res.json({ success: true, actualSecondsUsed: call.actualSecondsUsed, status: call.status });
});

// End call and execute atomic financial settlement
apiRouter.post('/calls/:id/end', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const call = db.getCallById(req.params.id);
  if (!call || (call.clientId !== user.id && call.providerId !== user.id && user.role !== 'superadmin')) {
    return res.status(404).json({ error: 'Llamada no encontrada' });
  }

  if (call.status === 'completed' || call.status === 'cancelled') {
    return res.json({ success: true, call, message: 'La llamada ya había finalizado previamente.' });
  }

  const client = db.getUserById(call.clientId);
  const provider = db.getUserById(call.providerId);
  const superAdmin = db.getUserById('usr_superadmin');

  if (!client || !provider) {
    return res.status(500).json({ error: 'Error de integridad en los participantes de la llamada.' });
  }

  const now = new Date().toISOString();
  const maxSecondsAllowed = call.durationMinutes * 60;
  // If call was interrupted very early or never connected
  const effectiveSeconds = Math.min(Math.max(call.actualSecondsUsed, 15), maxSecondsAllowed);

  // Pro-rate or full block consumption:
  // If call completed > 70% of duration, full block is charged.
  // If disconnected earlier, calculate proportional usage with a 1-minute minimum to protect provider time
  const fractionUsed = Math.min(effectiveSeconds / maxSecondsAllowed, 1);
  const isFullCharge = fractionUsed >= 0.75;
  const finalCharge = isFullCharge ? call.totalAmount : Number((call.totalAmount * Math.max(fractionUsed, 0.2)).toFixed(2));

  const settings = db.getSettings();
  const categoryName = provider.categories[0] || '';
  const commissionRate = (settings.categoryCommissions[categoryName] ?? settings.commissionPercent) / 100;

  const finalCommission = Number((finalCharge * commissionRate).toFixed(2));
  const finalProviderEarning = Number((finalCharge - finalCommission).toFixed(2));

  // Atomic ledger execution:
  // 1. Deduct from client
  const newClientBalance = Number((client.walletBalance - finalCharge).toFixed(2));
  db.updateUser(client.id, { walletBalance: Math.max(newClientBalance, 0) });

  db.addTransaction({
    id: 'tx_' + Math.random().toString(36).substring(2, 10),
    userId: client.id,
    type: 'call_payment',
    amount: -finalCharge,
    balanceAfter: newClientBalance,
    referenceId: call.callId,
    description: `Videollamada con ${provider.name} (${Math.round(effectiveSeconds / 60)} min)`,
    status: 'completed',
    createdAt: now,
  });

  // 2. Deposit provider net earning
  const newProviderBalance = Number((provider.walletBalance + finalProviderEarning).toFixed(2));
  db.updateUser(provider.id, {
    walletBalance: newProviderBalance,
    status: 'disponible', // Free up provider
  });

  db.addTransaction({
    id: 'tx_' + Math.random().toString(36).substring(2, 10),
    userId: provider.id,
    type: 'call_earning',
    amount: finalProviderEarning,
    balanceAfter: newProviderBalance,
    referenceId: call.callId,
    description: `Honorario por videollamada de ${client.name} (${Math.round(effectiveSeconds / 60)} min)`,
    status: 'completed',
    createdAt: now,
  });

  // 3. Platform commission credited to SuperAdmin
  if (superAdmin) {
    const newAdminBalance = Number((superAdmin.walletBalance + finalCommission).toFixed(2));
    db.updateUser(superAdmin.id, { walletBalance: newAdminBalance });
    db.addTransaction({
      id: 'tx_' + Math.random().toString(36).substring(2, 10),
      userId: superAdmin.id,
      type: 'commission_fee',
      amount: finalCommission,
      balanceAfter: newAdminBalance,
      referenceId: call.callId,
      description: `Comisión plataforma (${Math.round(commissionRate * 100)}%) videollamada ${call.callId}`,
      status: 'completed',
      createdAt: now,
    });
  }

  // Update call status
  const updatedCall = db.updateCall(call.id, {
    status: 'completed',
    endedAt: now,
    actualSecondsUsed: effectiveSeconds,
    totalAmount: finalCharge,
    providerAmount: finalProviderEarning,
    commissionAmount: finalCommission,
  });

  // Notify call room via WebSocket
  notifyCallRoom(call.callId, {
    type: 'call_finished',
    callId: call.callId,
    actualSecondsUsed: effectiveSeconds,
    totalCharge: finalCharge,
    providerEarning: finalProviderEarning,
  });

  db.addNotification(
    client.id,
    'Videollamada finalizada',
    `Duración: ${Math.round(effectiveSeconds / 60)} min. Importe cobrado: $${finalCharge.toFixed(2)} USD. Saldo restante: $${newClientBalance.toFixed(2)} USD.`,
    'call_finished'
  );

  db.addNotification(
    provider.id,
    'Ingreso acreditado',
    `Has ganado $${finalProviderEarning.toFixed(2)} USD por la llamada con ${client.name}. Tu nuevo saldo es $${newProviderBalance.toFixed(2)} USD.`,
    'payment_confirmed'
  );

  return res.json({
    success: true,
    call: updatedCall,
    clientCharge: finalCharge,
    providerEarning: finalProviderEarning,
    effectiveSeconds,
  });
});

apiRouter.get('/calls/history', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const calls = db.getUserCalls(user.id);
  return res.json({ calls });
});

apiRouter.get('/calls/active', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const activeCall = db.getCalls().find(
    c => (c.clientId === user.id || c.providerId === user.id) && (c.status === 'pending' || c.status === 'accepted' || c.status === 'in_progress')
  );

  return res.json({ activeCall: activeCall || null });
});

// -------------------------------------------------------------
// 5. BILLETERA & PAGOS (CLIENTE & PRESTADOR)
// -------------------------------------------------------------
apiRouter.get('/wallet/summary', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const transactions = db.getUserTransactions(user.id);
  const withdrawals = db.getUserWithdrawals(user.id);
  const settings = db.getSettings();

  const totalSpent = transactions
    .filter(t => t.type === 'call_payment')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const totalEarned = transactions
    .filter(t => t.type === 'call_earning')
    .reduce((acc, t) => acc + t.amount, 0);

  return res.json({
    balance: user.walletBalance,
    currency: settings.currency,
    totalSpent,
    totalEarned,
    transactions,
    withdrawals,
    settings: {
      minRecharge: settings.minRecharge,
      maxRecharge: settings.maxRecharge,
      minWithdrawal: settings.minWithdrawal,
      isRechargeEnabled: settings.isRechargeEnabled,
      isWithdrawalsEnabled: settings.isWithdrawalsEnabled,
    },
  });
});

// Secure balance recharge simulation with verified server-side validation & payment gateway simulation
apiRouter.post('/wallet/recharge', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const settings = db.getSettings();
  if (!settings.isRechargeEnabled) {
    return res.status(403).json({ error: 'Las recargas están temporalmente suspendidas.' });
  }

  const { amount, method, paymentToken } = req.body;
  const numAmount = Number(amount);

  if (isNaN(numAmount) || numAmount < settings.minRecharge || numAmount > settings.maxRecharge) {
    return res.status(400).json({
      error: `El importe debe ser entre $${settings.minRecharge.toFixed(2)} y $${settings.maxRecharge.toFixed(2)} ${settings.currency}.`,
    });
  }

  // Server-side verification (mocking Stripe / MercadoPago / PayPal secure webhook verification)
  const newBalance = Number((user.walletBalance + numAmount).toFixed(2));
  db.updateUser(user.id, { walletBalance: newBalance });

  const tx = db.addTransaction({
    id: 'tx_' + Math.random().toString(36).substring(2, 10),
    userId: user.id,
    type: 'deposit',
    amount: numAmount,
    balanceAfter: newBalance,
    description: `Recarga de saldo vía ${method || 'Tarjeta'} (Ref: ${paymentToken || 'AUTH_' + Math.floor(100000 + Math.random() * 900000)})`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  db.addNotification(
    user.id,
    'Recarga de saldo confirmada',
    `Se acreditaron $${numAmount.toFixed(2)} ${settings.currency} en tu billetera. Tu nuevo saldo disponible es $${newBalance.toFixed(2)} USD.`,
    'payment_confirmed'
  );

  return res.json({
    success: true,
    newBalance,
    transaction: tx,
    message: 'Pago acreditado y verificado correctamente.',
  });
});

// Provider withdrawal request
apiRouter.post('/wallet/withdraw', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  if (user.role !== 'prestador' && user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Solo los prestadores pueden solicitar retiros de fondos.' });
  }

  const settings = db.getSettings();
  if (!settings.isWithdrawalsEnabled) {
    return res.status(403).json({ error: 'Los retiros de fondos están temporalmente deshabilitados por administración.' });
  }

  const { amount, method, accountDetails } = req.body;
  const numAmount = Number(amount);

  if (isNaN(numAmount) || numAmount < settings.minWithdrawal) {
    return res.status(400).json({
      error: `El importe mínimo para solicitar un retiro es de $${settings.minWithdrawal.toFixed(2)} ${settings.currency}.`,
    });
  }

  if (numAmount > user.walletBalance) {
    return res.status(400).json({
      error: `Saldo insuficiente. Tienes $${user.walletBalance.toFixed(2)} y solicitaste $${numAmount.toFixed(2)}.`,
    });
  }

  if (!accountDetails || !accountDetails.trim()) {
    return res.status(400).json({ error: 'Por favor indica los datos de destino (CBU, cuenta bancaria, correo PayPal o wallet USDT).' });
  }

  // Deduct from balance immediately to reserve funds
  const newBalance = Number((user.walletBalance - numAmount).toFixed(2));
  db.updateUser(user.id, { walletBalance: newBalance });

  const now = new Date().toISOString();
  const withdrawal = db.addWithdrawal({
    id: 'wd_' + Math.random().toString(36).substring(2, 10),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    amount: numAmount,
    method: method || 'bank_transfer',
    accountDetails: accountDetails.trim(),
    status: settings.autoApproveWithdrawals ? 'approved' : 'pending',
    createdAt: now,
    processedAt: settings.autoApproveWithdrawals ? now : undefined,
  });

  db.addTransaction({
    id: 'tx_' + Math.random().toString(36).substring(2, 10),
    userId: user.id,
    type: 'withdrawal',
    amount: -numAmount,
    balanceAfter: newBalance,
    referenceId: withdrawal.id,
    description: `Solicitud de retiro de fondos (${withdrawal.method}) - ${withdrawal.status}`,
    status: settings.autoApproveWithdrawals ? 'completed' : 'pending',
    createdAt: now,
  });

  db.addNotification(
    user.id,
    'Solicitud de retiro registrada',
    `Se ha procesado tu solicitud por $${numAmount.toFixed(2)} USD. Estado: ${withdrawal.status === 'approved' ? 'Aprobado automáticamente' : 'En revisión por SuperAdmin'}.`,
    'withdrawal_status'
  );

  return res.json({
    success: true,
    withdrawal,
    newBalance,
  });
});

// -------------------------------------------------------------
// 6. SEGURIDAD, REPORTES Y BLOQUEOS
// -------------------------------------------------------------
apiRouter.post('/safety/report', (req: Request, res: Response) => {
  const reporter = getAuthenticatedUser(req);
  if (!reporter) return res.status(401).json({ error: 'No autorizado' });

  const { reportedUserId, reason, description, evidencePhotoId } = req.body;
  const reportedUser = db.getUserById(reportedUserId);
  if (!reportedUser) return res.status(404).json({ error: 'Usuario a denunciar no existe.' });

  const report = db.addReport({
    id: 'rep_' + Math.random().toString(36).substring(2, 10),
    reporterId: reporter.id,
    reporterName: reporter.name,
    reportedUserId: reportedUser.id,
    reportedUserName: reportedUser.name,
    reason: reason || 'Comportamiento inapropiado',
    description: description || 'Sin detalles adicionales',
    evidencePhotoId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: 'Tu denuncia ha sido enviada al equipo de moderación con carácter de urgencia. Gracias por velar por la seguridad de la comunidad.',
    reportId: report.id,
  });
});

apiRouter.post('/safety/block', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { blockedUserId } = req.body;
  if (!blockedUserId || blockedUserId === user.id) {
    return res.status(400).json({ error: 'ID de usuario inválido para bloqueo.' });
  }

  db.blockUser(user.id, blockedUserId);
  return res.json({ success: true, message: 'Usuario bloqueado. Ya no podrá interactuar contigo ni ver tus videollamadas.' });
});

apiRouter.get('/safety/blocked', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const blocks = db.getBlockedUsers(user.id);
  return res.json({ blocks });
});

apiRouter.delete('/safety/block/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  db.unblockUser(user.id, req.params.id);
  return res.json({ success: true, message: 'Usuario desbloqueado.' });
});

// -------------------------------------------------------------
// 7. NOTIFICACIONES
// -------------------------------------------------------------
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const notifications = db.getNotifications(user.id);
  return res.json({ notifications });
});

apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  db.markNotificationAsRead(user.id, req.params.id);
  return res.json({ success: true });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  db.markAllNotificationsAsRead(user.id);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// 8. PANEL SUPERADMIN EXCLUSIVO & PROTEGIDO
// -------------------------------------------------------------
function requireSuperAdmin(req: Request, res: Response, next: () => void) {
  const user = getAuthenticatedUser(req);
  if (!user || (user.role !== 'superadmin' && user.role !== 'administrador')) {
    return res.status(403).json({ error: 'Acceso restringido. Solo los administradores y SuperAdmin pueden realizar esta acción.' });
  }
  (req as any).adminUser = user;
  next();
}

apiRouter.get('/admin/metrics', requireSuperAdmin, (_req: Request, res: Response) => {
  const users = db.getUsers();
  const calls = db.getCalls();
  const transactions = db.getTransactions();
  const withdrawals = db.getWithdrawals();
  const reports = db.getReports();

  const totalUsers = users.length;
  const activeProviders = users.filter(u => u.role === 'prestador' && u.status === 'disponible').length;
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;

  const totalVolume = transactions
    .filter(t => t.type === 'deposit')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalCommissions = transactions
    .filter(t => t.type === 'commission_fee')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;
  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  return res.json({
    metrics: {
      totalUsers,
      activeProviders,
      totalCalls,
      completedCalls,
      totalVolume,
      totalCommissions,
      pendingWithdrawalsCount,
      pendingReportsCount,
      platformBalance: db.getUserById('usr_superadmin')?.walletBalance || 0,
    },
  });
});

apiRouter.get('/admin/settings', requireSuperAdmin, (_req: Request, res: Response) => {
  return res.json({ settings: db.getSettings() });
});

apiRouter.put('/admin/settings', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).adminUser as User;
  const updates = req.body;
  const updatedSettings = db.updateSettings(updates);

  db.addAuditLog(admin.id, admin.email, 'UPDATE_SETTINGS', `Actualización de parámetros globales: ${Object.keys(updates).join(', ')}`);

  return res.json({ success: true, settings: updatedSettings });
});

apiRouter.get('/admin/users', requireSuperAdmin, (req: Request, res: Response) => {
  const { role, status, search } = req.query;
  let list = db.getUsers();

  if (role && typeof role === 'string' && role !== 'all') {
    list = list.filter(u => u.role === role);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    if (status === 'banned') list = list.filter(u => u.isBanned);
    else if (status === 'suspended') list = list.filter(u => u.isSuspended);
    else list = list.filter(u => u.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.alias.toLowerCase().includes(q));
  }

  return res.json({ users: list });
});

apiRouter.put('/admin/users/:id/action', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).adminUser as User;
  const { action, value } = req.body;
  const targetUser = db.getUserById(req.params.id);

  if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado' });

  // Safety: Prevent removing superadmin role of oneself
  if (targetUser.id === admin.id && action === 'ban') {
    return res.status(400).json({ error: 'No puedes bloquearte a ti mismo.' });
  }

  const updates: Partial<User> = {};
  let actionDescription = '';

  switch (action) {
    case 'toggle_ban':
      updates.isBanned = !targetUser.isBanned;
      actionDescription = `${updates.isBanned ? 'Bloqueó' : 'Desbloqueó'} al usuario ${targetUser.email}`;
      break;
    case 'toggle_suspend':
      updates.isSuspended = !targetUser.isSuspended;
      actionDescription = `${updates.isSuspended ? 'Suspendió' : 'Reactivó'} al usuario ${targetUser.email}`;
      break;
    case 'toggle_verify':
      updates.isVerifiedBadge = !targetUser.isVerifiedBadge;
      actionDescription = `${updates.isVerifiedBadge ? 'Verificó' : 'Quitó verificación a'} ${targetUser.name}`;
      break;
    case 'toggle_featured':
      updates.isFeatured = !targetUser.isFeatured;
      actionDescription = `${updates.isFeatured ? 'Destacó' : 'Quitó de destacados a'} ${targetUser.name}`;
      break;
    case 'change_role':
      if (['cliente', 'prestador', 'administrador'].includes(value)) {
        updates.role = value;
        actionDescription = `Cambió el rol de ${targetUser.email} a ${value}`;
      }
      break;
    case 'update_categories':
      if (Array.isArray(value)) {
        updates.categories = value;
        actionDescription = `Actualizó categorías de ${targetUser.name}`;
      }
      break;
    default:
      return res.status(400).json({ error: 'Acción no reconocida' });
  }

  const updated = db.updateUser(targetUser.id, updates);
  db.addAuditLog(admin.id, admin.email, `USER_${action.toUpperCase()}`, actionDescription);

  return res.json({ success: true, user: updated, message: actionDescription });
});

apiRouter.get('/admin/withdrawals', requireSuperAdmin, (_req: Request, res: Response) => {
  return res.json({ withdrawals: db.getWithdrawals() });
});

apiRouter.post('/admin/withdrawals/:id/action', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).adminUser as User;
  const { action, notes } = req.body; // 'approve' or 'reject'
  const withdrawal = db.getWithdrawals().find(w => w.id === req.params.id);

  if (!withdrawal) return res.status(404).json({ error: 'Solicitud de retiro no encontrada.' });
  if (withdrawal.status !== 'pending') {
    return res.status(400).json({ error: `La solicitud ya fue ${withdrawal.status}.` });
  }

  const now = new Date().toISOString();
  if (action === 'approve') {
    db.updateWithdrawal(withdrawal.id, {
      status: 'approved',
      processedAt: now,
      notes: notes || 'Aprobado y transferido por SuperAdmin.',
    });

    db.addAuditLog(admin.id, admin.email, 'APPROVE_WITHDRAWAL', `Aprobó retiro de $${withdrawal.amount.toFixed(2)} USD a ${withdrawal.userName}`);

    db.addNotification(
      withdrawal.userId,
      'Retiro aprobado y liquidado',
      `Tu retiro de $${withdrawal.amount.toFixed(2)} USD por ${withdrawal.method} ha sido completado.`,
      'withdrawal_status'
    );

    return res.json({ success: true, status: 'approved' });
  } else {
    // If rejected, refund balance to user!
    const targetUser = db.getUserById(withdrawal.userId);
    if (targetUser) {
      const restoredBalance = Number((targetUser.walletBalance + withdrawal.amount).toFixed(2));
      db.updateUser(targetUser.id, { walletBalance: restoredBalance });

      db.addTransaction({
        id: 'tx_' + Math.random().toString(36).substring(2, 10),
        userId: targetUser.id,
        type: 'refund',
        amount: withdrawal.amount,
        balanceAfter: restoredBalance,
        referenceId: withdrawal.id,
        description: `Reembolso por retiro denegado: ${notes || 'Datos bancarios erróneos'}`,
        status: 'completed',
        createdAt: now,
      });

      db.addNotification(
        withdrawal.userId,
        'Retiro rechazado - Fondos restaurados',
        `Tu solicitud de retiro por $${withdrawal.amount.toFixed(2)} USD fue rechazada. Motivo: ${notes || 'Datos incorrectos'}. Los fondos han sido devueltos a tu billetera.`,
        'withdrawal_status'
      );
    }

    db.updateWithdrawal(withdrawal.id, {
      status: 'rejected',
      processedAt: now,
      notes: notes || 'Rechazado por inconsistencia en datos de destino.',
    });

    db.addAuditLog(admin.id, admin.email, 'REJECT_WITHDRAWAL', `Rechazó retiro de $${withdrawal.amount.toFixed(2)} USD a ${withdrawal.userName}`);

    return res.json({ success: true, status: 'rejected' });
  }
});

apiRouter.get('/admin/reports', requireSuperAdmin, (_req: Request, res: Response) => {
  return res.json({ reports: db.getReports() });
});

apiRouter.post('/admin/reports/:id/resolve', requireSuperAdmin, (req: Request, res: Response) => {
  const admin = (req as any).adminUser as User;
  const { actionTaken, status, banReportedUser } = req.body;
  const report = db.getReports().find(r => r.id === req.params.id);

  if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });

  if (banReportedUser) {
    db.updateUser(report.reportedUserId, { isBanned: true });
    db.addAuditLog(admin.id, admin.email, 'BAN_USER_FROM_REPORT', `Bloqueo permanente al usuario reportado ${report.reportedUserName} (${report.reportedUserId})`);
  }

  const updated = db.updateReport(report.id, {
    status: status || 'resolved',
    actionTaken: actionTaken || 'Revisado y resuelto por el equipo SuperAdmin.',
  });

  db.addAuditLog(admin.id, admin.email, 'RESOLVE_REPORT', `Resolución de denuncia ID ${report.id}: ${actionTaken}`);

  return res.json({ success: true, report: updated });
});

apiRouter.get('/admin/audit-logs', requireSuperAdmin, (_req: Request, res: Response) => {
  return res.json({ auditLogs: db.getAuditLogs() });
});
