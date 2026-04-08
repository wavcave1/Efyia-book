const BASE_URL = import.meta.env.VITE_API_URL || 'https://efyia-book-backend.up.railway.app';

function getToken() {
  return localStorage.getItem('efyia_token');
}

async function request(method, path, body = null, requiresAuth = false) {
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (requiresAuth) {
    throw Object.assign(new Error('Authentication required.'), { status: 401 });
  }

  const init = { method, headers };
  if (body !== null) {
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new Error('Unable to connect to the server. Please check your internet connection.');
  }

  if (response.status === 204) return null;

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Unexpected server response (${response.status}).`);
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed with status ${response.status}.`;
    throw Object.assign(new Error(message), { status: response.status, details: data?.details });
  }

  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

// ─── Studios ─────────────────────────────────────────────────────────────────
export const studiosApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString();
    return api.get(`/api/studios${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => api.get(`/api/studios/${id}`),
  getBySlug: (slug) => api.get(`/api/studios/slug/${slug}`),
  create: (data) => api.post('/api/studios', data),
  update: (id, data) => api.put(`/api/studios/${id}`, data),
  delete: (id) => api.delete(`/api/studios/${id}`),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsApi = {
  list: () => api.get('/api/bookings'),
  getById: (id) => api.get(`/api/bookings/${id}`),
  create: (data) => api.post('/api/bookings', data),
  updateStatus: (id, status) => api.patch(`/api/bookings/${id}/status`, { status }),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  listByStudio: (studioId) => api.get(`/api/reviews?studioId=${studioId}`),
  create: (data) => api.post('/api/reviews', data),
  reply: (id, ownerReply) => api.patch(`/api/reviews/${id}/reply`, { ownerReply }),
  delete: (id) => api.delete(`/api/reviews/${id}`),
};

// ─── Favorites ────────────────────────────────────────────────────────────────
export const favoritesApi = {
  list: () => api.get('/api/favorites'),
  add: (studioId) => api.post('/api/favorites', { studioId }),
  remove: (studioId) => api.delete(`/api/favorites/${studioId}`),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get('/api/users'),
  updateMe: (data) => api.patch('/api/users/me', data),
  adminUpdate: (id, data) => api.patch(`/api/users/${id}`, data),
};

// ─── Public studio pages (no auth required) ───────────────────────────────────
export const publicApi = {
  getStudioBySlug: (slug) => api.get(`/api/public/studios/${slug}`),
};

// ─── Studio profile (owner-scoped branding) ───────────────────────────────────
export const studioProfileApi = {
  get: () => api.get('/api/studio/profile'),
  update: (data) => api.patch('/api/studio/profile', data),
};

// ─── Stripe Connect & Payments ───────────────────────────────────────────────
export const stripeConnectApi = {
  onboard: (studioId) => api.post('/api/connect/onboard', { studioId }),
  refresh: (studioId) => api.post('/api/connect/refresh-link', { studioId }),
  status: (studioId) => api.get(`/api/connect/status/${studioId}`),
};

export const paymentsApi = {
  createIntent: (bookingId) => api.post('/api/payments/intents', { bookingId }),
  refund: (bookingId, reason) => api.post('/api/payments/refunds', { bookingId, reason }),
};


// ─── Admin (internal control plane) ──────────────────────────────────────────
export const adminApi = {
  dashboardSummary: () => api.get('/api/admin/dashboard'),

  listAccounts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString();
    return api.get(`/api/admin/accounts${qs ? `?${qs}` : ''}`);
  },
  getAccount: (id) => api.get(`/api/admin/accounts/${id}`),
  createAccount: (data) => api.post('/api/admin/accounts', data),
  updateAccount: (id, data) => api.patch(`/api/admin/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/api/admin/accounts/${id}`),
  resetAccountPassword: (id) => api.post(`/api/admin/accounts/${id}/reset-password`, {}),
  revokeAccountSessions: (id) => api.post(`/api/admin/accounts/${id}/revoke-sessions`, {}),
  enableOwnerProfile: (id, data = {}) => api.post(`/api/admin/accounts/${id}/enable-owner-profile`, data),

  listStudios: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString();
    return api.get(`/api/admin/studios${qs ? `?${qs}` : ''}`);
  },
  createStudio: (data) => api.post('/api/admin/studios', data),
  updateStudio: (id, data) => api.patch(`/api/admin/studios/${id}`, data),
  deleteStudio: (id) => api.delete(`/api/admin/studios/${id}`),

  listProfiles: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString();
    return api.get(`/api/admin/profiles${qs ? `?${qs}` : ''}`);
  },
  createProfile: (data) => api.post('/api/admin/profiles', data),
  updateProfile: (id, data) => api.patch(`/api/admin/profiles/${id}`, data),
  deleteProfile: (id) => api.delete(`/api/admin/profiles/${id}`),

  listPermissions: () => api.get('/api/admin/permissions'),
  updatePermission: (id, data) => api.patch(`/api/admin/permissions/${id}`, data),
};
