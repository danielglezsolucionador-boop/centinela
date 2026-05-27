export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://centinela-backend-kzwk.onrender.com';
const DEMO_USERNAME = process.env.NEXT_PUBLIC_CENTINELA_DEMO_USERNAME;
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_CENTINELA_DEMO_PASSWORD;

export class ApiError extends Error {
  status: number;
  url: string;
  body: unknown;

  constructor(status: number, url: string, body: unknown) {
    const detail = typeof body === 'object' && body && 'detail' in body
      ? String((body as { detail?: unknown }).detail)
      : `Request failed with status ${status}`;
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
export const isAuthError = (error: unknown) => isApiError(error) && (error.status === 401 || error.status === 403);

export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('centinela_token') : null;

export const ensureToken = async () => {
  const existing = getToken();
  if (existing) return existing;
  if (!DEMO_USERNAME || !DEMO_PASSWORD) return null;
  try {
    const data = await requestJson(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: DEMO_USERNAME, password: DEMO_PASSWORD }),
    });
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

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

async function requestJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const body = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, url, body);
  return body;
}

export const auth = {
  async login(username: string, password: string) {
    const data = await requestJson(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    setToken(data.access_token);
    return data;
  },
  async me() {
    return requestJson(`${API_URL}/api/v1/auth/me`, { headers: authHeaders() });
  },
  logout() {
    removeToken();
  },
};

export const api = {
  async health() {
    return requestJson(`${API_URL}/api/v1/health`);
  },
  async provenance() {
    return requestJson(`${API_URL}/api/v1/provenance`);
  },
  async analyzePrompt(payload: { prompt: string; agent: string; user: string; model?: string }) {
    return requestJson(`${API_URL}/api/v1/prompt/analyze`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
  },
  async getEcosystemRisk() {
    return requestJson(`${API_URL}/api/v1/risk/ecosystem`, { headers: authHeaders() });
  },
  async getThreatMemory() {
    return requestJson(`${API_URL}/api/v1/stats/db`, { headers: authHeaders() });
  },
  async getIncidents() {
    return requestJson(`${API_URL}/api/v1/incidents`, { headers: authHeaders() });
  },
  async getCorrelations() {
    return requestJson(`${API_URL}/api/v1/correlations/active`, { headers: authHeaders() });
  },
  async getDbStats() {
    return requestJson(`${API_URL}/api/v1/stats/db`, { headers: authHeaders() });
  },
  async getObservabilityMetrics() {
    return requestJson(`${API_URL}/api/v1/observability/metrics`, { headers: authHeaders() });
  },
  async getAgentMap() {
    return requestJson(`${API_URL}/api/v1/agents/map`, { headers: authHeaders() });
  },
  async getAgentsMap() {
    return requestJson(`${API_URL}/api/v1/agents/map`, { headers: authHeaders() });
  },
  async getAgentAnomalies() {
    return requestJson(`${API_URL}/api/v1/agents/anomalies`, { headers: authHeaders() });
  },
  async getDetectionStats() {
    return requestJson(`${API_URL}/api/v1/detection/stats`, { headers: authHeaders() });
  },
  async getPolicyStats() {
    return requestJson(`${API_URL}/api/v1/policy/all`, { headers: authHeaders() });
  },
};

export function createWebSocket(onMessage: (data: unknown) => void) {
  const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
  const ws = new WebSocket(`${wsUrl}/ws`);
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {}
  };
  return ws;
}
