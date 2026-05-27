export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://centinela-backend-kzwk.onrender.com';
const DEMO_USERNAME = process.env.NEXT_PUBLIC_CENTINELA_DEMO_USERNAME;
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_CENTINELA_DEMO_PASSWORD;

// ── Token management ──────────────────────────────────────────────────
export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('centinela_token') : null;
export const ensureToken = async () => {
  const existing = getToken();
  if (existing) return existing;
  if (!DEMO_USERNAME || !DEMO_PASSWORD) return null;
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: DEMO_USERNAME, password: DEMO_PASSWORD }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access_token) {
      setToken(data.access_token);
      return data.access_token;
    }
  } catch {}
  return null;
};
export const setToken = (token: string) => localStorage.setItem('centinela_token', token);
export const removeToken = () => localStorage.removeItem('centinela_token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Auth ──────────────────────────────────────────────────────────────
export const auth = {
  async login(username: string, password: string) {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    setToken(data.access_token);
    return data;
  },
  async me() {
    const res = await fetch(`${API_URL}/api/v1/auth/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },
  logout() { removeToken(); },
};

// ── API ───────────────────────────────────────────────────────────────
export const api = {
  async health() {
    const res = await fetch(`${API_URL}/api/v1/health`);
    return res.json();
  },
  async analyzePrompt(payload: { prompt: string; agent: string; user: string; model?: string }) {
    const res = await fetch(`${API_URL}/api/v1/prompt/analyze`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async getEcosystemRisk() {
    const res = await fetch(`${API_URL}/api/v1/risk/ecosystem`, { headers: authHeaders() });
    return res.json();
  },
  async getThreatMemory() {
    const res = await fetch(`${API_URL}/api/v1/stats/db`, { headers: authHeaders() });
    return res.json();
  },
  async getIncidents() {
    const res = await fetch(`${API_URL}/api/v1/incidents`, { headers: authHeaders() });
    return res.json();
  },
  async getCorrelations() {
    const res = await fetch(`${API_URL}/api/v1/correlations/active`, { headers: authHeaders() });
    return res.json();
  },
  async getDbStats() {
    const res = await fetch(`${API_URL}/api/v1/stats/db`, { headers: authHeaders() });
    return res.json();
  },
  async getObservabilityMetrics() {
    const res = await fetch(`${API_URL}/api/v1/observability/metrics`, { headers: authHeaders() });
    return res.json();
  },
  async getAgentMap() {
    const res = await fetch(`${API_URL}/api/v1/agents/map`, { headers: authHeaders() });
    return res.json();
  },
  async getAgentAnomalies() {
    const res = await fetch(`${API_URL}/api/v1/agents/anomalies`, { headers: authHeaders() });
    return res.json();
  },
  async getDetectionStats() {
    const res = await fetch(`${API_URL}/api/v1/detection/stats`, { headers: authHeaders() });
    return res.json();
  },
  async getPolicyStats() {
    const res = await fetch(`${API_URL}/api/v1/policy/all`, { headers: authHeaders() });
    return res.json();
  },
};

export function createWebSocket(onMessage: (data: unknown) => void) {
  const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
  const ws = new WebSocket(`${wsUrl}/ws`);
  ws.onmessage = (event) => {
    try { onMessage(JSON.parse(event.data)); } catch {}
  };
  return ws;
}
