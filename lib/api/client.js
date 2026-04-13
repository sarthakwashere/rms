/**
 * AODB RMS API Client — aligned with Go server /api/v1/rms and /api/v1/resource
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081';

// --------------------------------------------------------------------------
// Auth helpers
// --------------------------------------------------------------------------

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('rms_token') || '';
}
function getTenantId() {
  if (typeof window === 'undefined') return '';
  try {
    const u = localStorage.getItem('rms_user');
    if (!u) return '';
    const tid = JSON.parse(u).tenant_id || '';
    // Demo login used this id while Flyway/API seed data lives on tenant "default".
    if (tid === 'rms-review-tenant') return 'default';
    return tid;
  } catch {
    return '';
  }
}
function buildHeaders(extra) {
  const token = getToken();
  const tenantId = getTenantId();
  return {
    'Content-Type': 'application/json',
    ...(token && {
      Authorization: `Bearer ${token}`
    }),
    ...(tenantId && {
      'X-Tenant-ID': tenantId
    }),
    ...extra
  };
}
async function request(path, init = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers || {})
    }
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error || j.message || j.detail || msg;
    } catch {}
    if (res.status === 401) {
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    throw new Error(msg);
  }
  // DELETE / void handlers often return 204 or 200 with empty body — avoid res.json() on empty
  if (res.status === 204 || res.status === 205) return undefined;
  const text = await res.text();
  if (!text || !text.trim()) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// SWR fetcher
export const swrFetcher = url => request(url);

// --------------------------------------------------------------------------
// Auth
// --------------------------------------------------------------------------

export const AuthAPI = {
  login: (username, password) => request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password
    })
  })
};

// --------------------------------------------------------------------------
// RMS — Allocations  (/api/v1/rms/allocations)
// --------------------------------------------------------------------------

export const AllocationAPI = {
  list: params => {
    const q = new URLSearchParams();
    if (params?.flight_id) q.set('flight_id', params.flight_id);
    if (params?.resource_type) q.set('resource_type', params.resource_type);
    const qs = q.toString();
    return request(`/api/v1/rms/allocations${qs ? `?${qs}` : ''}`);
  },
  create: req => request('/api/v1/rms/allocations', {
    method: 'POST',
    body: JSON.stringify(req)
  }),
  reallocate: (id, resourceId, reason) => request(`/api/v1/rms/allocations/${id}/reallocate`, {
    method: 'POST',
    body: JSON.stringify({
      resource_id: resourceId,
      reason
    })
  }),
  release: id => request(`/api/v1/rms/allocations/${id}/release`, {
    method: 'POST'
  }),
  /** Only allowed server-side for RELEASED or CANCELLED allocations */
  delete: id => request(`/api/v1/rms/allocations/${id}`, {
    method: 'DELETE'
  })
};

// --------------------------------------------------------------------------
// RMS — Conflicts  (/api/v1/rms/conflicts)
// --------------------------------------------------------------------------

export const ConflictAPI = {
  list: () => request('/api/v1/rms/conflicts')
};

// --------------------------------------------------------------------------
// RMS — Auto-allocation  (/api/v1/rms/run)
// --------------------------------------------------------------------------

export const EngineAPI = {
  runAutoAllocation: () => request('/api/v1/rms/run', {
    method: 'POST'
  })
};

// --------------------------------------------------------------------------
// Resources  (/api/v1/resource)
// --------------------------------------------------------------------------

export const ResourceAPI = {
  // Gates are currently exposed from /ref, others from /resources in Go backend
  gates: () => request('/api/v1/ref/gates'),
  stands: () => request('/api/v1/resources/stands'),
  belts: () => request('/api/v1/resources/belts'),
  runways: () => request('/api/v1/resources/runways'),
  terminals: () => request('/api/v1/resources/terminals')
};

// --------------------------------------------------------------------------
// Flights  (/api/v1/flights) — for allocation context
// --------------------------------------------------------------------------

export const FlightAPI = {
  list: params => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    if (params?.limit) q.set('page_size', String(params.limit));
    const qs = q.toString();
    return request(`/api/v1/flights${qs ? `?${qs}` : ''}`).then(r => r.data || []);
  }
};

// --------------------------------------------------------------------------
// SWR Key constants
// --------------------------------------------------------------------------

export const SWR = {
  allocations: '/api/v1/rms/allocations',
  conflicts: '/api/v1/rms/conflicts',
  rules: '/api/v1/rms/rules',
  constraints: '/api/v1/rms/constraints',
  templates: '/api/v1/rms/templates',
  simulations: '/api/v1/rms/simulations',
  gates: '/api/v1/ref/gates',
  stands: '/api/v1/resources/stands',
  belts: '/api/v1/resources/belts',
  runways: '/api/v1/resources/runways',
  terminals: '/api/v1/resources/terminals'
};

// --------------------------------------------------------------------------
// Rules  (/api/v1/rms/rules)
// --------------------------------------------------------------------------

export const RulesAPI = {
  list: () => request('/api/v1/rms/rules'),
  create: rule => request('/api/v1/rms/rules', {
    method: 'POST',
    body: JSON.stringify(rule)
  }),
  update: (id, updates) => request(`/api/v1/rms/rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),
  delete: id => request(`/api/v1/rms/rules/${id}`, {
    method: 'DELETE'
  }),
  toggle: (id, is_active) => request(`/api/v1/rms/rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      is_active
    })
  })
};

// --------------------------------------------------------------------------
// Constraints  (/api/v1/rms/constraints)
// --------------------------------------------------------------------------

export const ConstraintsAPI = {
  list: () => request('/api/v1/rms/constraints'),
  create: c => request('/api/v1/rms/constraints', {
    method: 'POST',
    body: JSON.stringify(c)
  }),
  update: (id, updates) => request(`/api/v1/rms/constraints/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),
  delete: id => request(`/api/v1/rms/constraints/${id}`, {
    method: 'DELETE'
  })
};

// --------------------------------------------------------------------------
// Templates  (/api/v1/rms/templates)
// --------------------------------------------------------------------------

export const TemplatesAPI = {
  list: () => request('/api/v1/rms/templates'),
  create: t => request('/api/v1/rms/templates', {
    method: 'POST',
    body: JSON.stringify(t)
  }),
  update: (id, updates) => request(`/api/v1/rms/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),
  apply: (id, date_from, date_to) => request(`/api/v1/rms/templates/${id}/apply`, {
    method: 'POST',
    body: JSON.stringify({
      date_from,
      date_to
    })
  }),
  delete: id => request(`/api/v1/rms/templates/${id}`, {
    method: 'DELETE'
  })
};

// --------------------------------------------------------------------------
// Simulations  (/api/v1/rms/simulations)
// --------------------------------------------------------------------------

export const SimulationsAPI = {
  list: () => request('/api/v1/rms/simulations'),
  create: s => request('/api/v1/rms/simulations', {
    method: 'POST',
    body: JSON.stringify(s)
  }),
  run: id => request(`/api/v1/rms/simulations/${id}/run`, {
    method: 'POST'
  }),
  apply: id => request(`/api/v1/rms/simulations/${id}/apply`, {
    method: 'POST'
  }),
  delete: id => request(`/api/v1/rms/simulations/${id}`, {
    method: 'DELETE'
  })
};
