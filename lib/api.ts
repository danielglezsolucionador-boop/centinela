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

export class ApiTimeoutError extends Error {
  status = 408;
  url: string;

  constructor(url: string) {
    super('Request timed out');
    this.name = 'AbortError';
    this.url = url;
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

async function requestJson(url: string, init?: RequestInit, timeoutMs = 8000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller?.signal,
    });
    const body = await readJson(res);
    if (!res.ok) throw new ApiError(res.status, url, body);
    return body;
  } catch (error) {
    if (typeof error === 'object' && error && 'name' in error && String((error as { name?: unknown }).name) === 'AbortError') {
      throw new ApiTimeoutError(url);
    }
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
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
  async getOperationalIntelligence() {
    return requestJson(`${API_URL}/api/v1/intelligence/operational`, { headers: authHeaders() });
  },
  async getTemporalCorrelation() {
    return requestJson(`${API_URL}/api/v1/intelligence/temporal-correlation`, { headers: authHeaders() });
  },
  async getPhase3Summary() {
    return requestJson(`${API_URL}/api/v1/intelligence/phase3-summary`, { headers: authHeaders() });
  },
  async getAdversarialReasoning() {
    return requestJson(`${API_URL}/api/v1/intelligence/adversarial`, { headers: authHeaders() });
  },
  async getOperationalScoring() {
    return requestJson(`${API_URL}/api/v1/intelligence/scoring`, { headers: authHeaders() });
  },
  async getSignalCorrelation() {
    return requestJson(`${API_URL}/api/v1/intelligence/signal-correlation`, { headers: authHeaders() });
  },
  async getExposureInventory() {
    return requestJson(`${API_URL}/api/v1/intelligence/exposure`, { headers: authHeaders() });
  },
  async getCognitiveStability() {
    return requestJson(`${API_URL}/api/v1/intelligence/cognition`, { headers: authHeaders() });
  },
  async getOperationalSurvivability() {
    return requestJson(`${API_URL}/api/v1/intelligence/survivability`, { headers: authHeaders() });
  },
  async getFreezeGovernance() {
    return requestJson(`${API_URL}/api/v1/intelligence/freeze-governance`, { headers: authHeaders() });
  },
  async getOperationalCertification() {
    return requestJson(`${API_URL}/api/v1/intelligence/certification`, { headers: authHeaders() });
  },
  async getPhase4Summary() {
    return requestJson(`${API_URL}/api/v1/resilience/phase4-summary`, { headers: authHeaders() });
  },
  async getDegradedRuntime() {
    return requestJson(`${API_URL}/api/v1/resilience/degraded-runtime`, { headers: authHeaders() });
  },
  async getPartialFailure() {
    return requestJson(`${API_URL}/api/v1/resilience/partial-failure`, { headers: authHeaders() });
  },
  async getRecoveryState() {
    return requestJson(`${API_URL}/api/v1/resilience/recovery`, { headers: authHeaders() });
  },
  async getFallbackModes() {
    return requestJson(`${API_URL}/api/v1/resilience/fallback`, { headers: authHeaders() });
  },
  async getRuntimeIntegrity() {
    return requestJson(`${API_URL}/api/v1/resilience/integrity`, { headers: authHeaders() });
  },
  async getDependencyAwareness() {
    return requestJson(`${API_URL}/api/v1/resilience/dependencies`, { headers: authHeaders() });
  },
  async getResilienceStressValidation() {
    return requestJson(`${API_URL}/api/v1/resilience/stress-validation`, { headers: authHeaders() });
  },
  async getRollbackIntelligence() {
    return requestJson(`${API_URL}/api/v1/resilience/rollback-intelligence`, { headers: authHeaders() });
  },
  async getResilienceCertification() {
    return requestJson(`${API_URL}/api/v1/resilience/certification`, { headers: authHeaders() });
  },
  async getPhase5Summary() {
    return requestJson(`${API_URL}/api/v1/ecosystem/phase5-summary`, { headers: authHeaders() });
  },
  async getEcosystemAssets() {
    return requestJson(`${API_URL}/api/v1/ecosystem/assets`, { headers: authHeaders() });
  },
  async getEndpointIntelligence() {
    return requestJson(`${API_URL}/api/v1/ecosystem/endpoints`, { headers: authHeaders() });
  },
  async getEcosystemDependencies() {
    return requestJson(`${API_URL}/api/v1/ecosystem/dependencies`, { headers: authHeaders() });
  },
  async getExternalExposure() {
    return requestJson(`${API_URL}/api/v1/ecosystem/exposure`, { headers: authHeaders() });
  },
  async getSensitiveExposure() {
    return requestJson(`${API_URL}/api/v1/ecosystem/sensitive-exposure`, { headers: authHeaders() });
  },
  async getSupplyChainAwareness() {
    return requestJson(`${API_URL}/api/v1/ecosystem/supply-chain`, { headers: authHeaders() });
  },
  async getTrustZones() {
    return requestJson(`${API_URL}/api/v1/ecosystem/trust-zones`, { headers: authHeaders() });
  },
  async getExternalRiskCorrelation() {
    return requestJson(`${API_URL}/api/v1/ecosystem/external-risk`, { headers: authHeaders() });
  },
  async getEcosystemIntelligence() {
    return requestJson(`${API_URL}/api/v1/ecosystem/intelligence`, { headers: authHeaders() });
  },
  async getEcosystemCertification() {
    return requestJson(`${API_URL}/api/v1/ecosystem/certification`, { headers: authHeaders() });
  },
  async getPhase6Summary() {
    return requestJson(`${API_URL}/api/v1/adversarial/phase6-summary`, { headers: authHeaders() });
  },
  async getAttackPaths() {
    return requestJson(`${API_URL}/api/v1/adversarial/attack-paths`, { headers: authHeaders() });
  },
  async getPrivilegeReasoning() {
    return requestJson(`${API_URL}/api/v1/adversarial/privilege`, { headers: authHeaders() });
  },
  async getLateralMovement() {
    return requestJson(`${API_URL}/api/v1/adversarial/lateral-movement`, { headers: authHeaders() });
  },
  async getExploitability() {
    return requestJson(`${API_URL}/api/v1/adversarial/exploitability`, { headers: authHeaders() });
  },
  async getStrategicCorrelation() {
    return requestJson(`${API_URL}/api/v1/adversarial/strategic-correlation`, { headers: authHeaders() });
  },
  async getBehavioralModeling() {
    return requestJson(`${API_URL}/api/v1/adversarial/behavior`, { headers: authHeaders() });
  },
  async getThreatEscalation() {
    return requestJson(`${API_URL}/api/v1/adversarial/escalation`, { headers: authHeaders() });
  },
  async getScenarioSimulation() {
    return requestJson(`${API_URL}/api/v1/adversarial/simulation`, { headers: authHeaders() });
  },
  async getStrategicRisk() {
    return requestJson(`${API_URL}/api/v1/adversarial/strategic-risk`, { headers: authHeaders() });
  },
  async getAdversarialCertification() {
    return requestJson(`${API_URL}/api/v1/adversarial/certification`, { headers: authHeaders() });
  },
  async getPhase7Summary() {
    return requestJson(`${API_URL}/api/v1/governance/phase7-summary`, { headers: authHeaders() });
  },
  async getFreezeGovernance() {
    return requestJson(`${API_URL}/api/v1/governance/freeze`, { headers: authHeaders() });
  },
  async getReleaseIntegrity() {
    return requestJson(`${API_URL}/api/v1/governance/release-integrity`, { headers: authHeaders() });
  },
  async getDeploymentTrust() {
    return requestJson(`${API_URL}/api/v1/governance/deployment-trust`, { headers: authHeaders() });
  },
  async getRuntimeTrust() {
    return requestJson(`${API_URL}/api/v1/governance/runtime-trust`, { headers: authHeaders() });
  },
  async getOperationalAudit() {
    return requestJson(`${API_URL}/api/v1/governance/operational-audit`, { headers: authHeaders() });
  },
  async getGovernanceEscalation() {
    return requestJson(`${API_URL}/api/v1/governance/escalation`, { headers: authHeaders() });
  },
  async getExecutiveRisk() {
    return requestJson(`${API_URL}/api/v1/governance/executive-risk`, { headers: authHeaders() });
  },
  async getEnterpriseSurvivability() {
    return requestJson(`${API_URL}/api/v1/governance/survivability`, { headers: authHeaders() });
  },
  async getOperationalReadiness() {
    return requestJson(`${API_URL}/api/v1/governance/readiness`, { headers: authHeaders() });
  },
  async getFinalCertification() {
    return requestJson(`${API_URL}/api/v1/governance/final-certification`, { headers: authHeaders() });
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
