'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, ensureToken } from '@/lib/api';

type HumanRequest = {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: string;
  proposed_action: string;
  action_type: string;
  source_agent: string;
  target_system: string;
  client_name: string;
  risk_score: number;
  confidence_score: number;
  evidence?: Record<string, unknown>;
  recommended_decision: string;
  created_at?: string;
  reviewer_notes?: string;
};

type PricingPlan = {
  id: string;
  name: string;
  price_label: string;
  description: string;
  features: string[];
  payment_status: string;
};

type HumanCabinSummary = {
  mode: string;
  protection_status: string;
  global_risk: string;
  risk_temperature: string;
  plan_current: string;
  subscription_status: string;
  active_incidents: number;
  pending_decisions: number;
  blocked_actions: number;
  system_confidence: number;
  average_response_minutes: number;
  top_priority: HumanRequest | null;
  requests: HumanRequest[];
  plans: PricingPlan[];
  audit_events_count: number;
  blocked_action_message: string;
};

const FALLBACK_SUMMARY: HumanCabinSummary = {
  mode: 'DEMO_LOCAL',
  protection_status: 'Vigilado',
  global_risk: 'critical',
  risk_temperature: 'CRITICAL',
  plan_current: 'Premium demo/local',
  subscription_status: 'demo_local_no_payment',
  active_incidents: 7,
  pending_decisions: 5,
  blocked_actions: 1,
  system_confidence: 74,
  average_response_minutes: 11,
  audit_events_count: 0,
  blocked_action_message: 'Acción no permitida en esta versión. Requiere autorización superior y política explícita.',
  top_priority: null,
  requests: [
    {
      id: 'HC-CRIT-001',
      title: 'Riesgo crítico cliente: bloqueo defensivo pendiente',
      description: 'Señal crítica de demostración local. No se afirma incidente productivo.',
      severity: 'critical',
      status: 'pending_review',
      proposed_action: 'Congelar ruta afectada y pedir más evidencia antes de cualquier cambio real.',
      action_type: 'containment_review',
      source_agent: 'Inteligencia de amenazas',
      target_system: 'API Gateway demo',
      client_name: 'Cliente Norte Demo',
      risk_score: 94,
      confidence_score: 0.84,
      evidence: { data_state: 'DEMO_LOCAL', origin: 'Inteligencia de amenazas' },
      recommended_decision: 'Mantener contención reversible y pedir evidencia adicional.',
    },
    {
      id: 'HC-HIGH-001',
      title: 'Permiso sensible en revisión',
      description: 'Capacidad de escritura pendiente de control humano.',
      severity: 'high',
      status: 'pending_review',
      proposed_action: 'Pausar y revisar permisos.',
      action_type: 'pause_sensitive_permission',
      source_agent: 'Análisis interno',
      target_system: 'Agente operativo demo',
      client_name: 'Cliente Sur Demo',
      risk_score: 82,
      confidence_score: 0.76,
      evidence: { data_state: 'DEMO_LOCAL', origin: 'Análisis interno' },
      recommended_decision: 'Pausar hasta completar evidencia técnica.',
    },
    {
      id: 'HC-BLOCK-001',
      title: 'Acción sensible bloqueada',
      description: 'Solicitud irreversible bloqueada por política.',
      severity: 'critical',
      status: 'blocked',
      proposed_action: 'Acción no permitida en esta versión. Requiere autorización superior y política explícita.',
      action_type: 'irreversible_action',
      source_agent: 'Motor de riesgo',
      target_system: 'Infraestructura demo',
      client_name: 'Cliente Norte Demo',
      risk_score: 99,
      confidence_score: 0.9,
      evidence: { data_state: 'DEMO_LOCAL', origin: 'Motor de riesgo' },
      recommended_decision: 'Mantener bloqueado.',
    },
  ],
  plans: [
    {
      id: 'plan_empresa',
      name: 'Plan Empresa',
      price_label: 'S/199/mes',
      description: 'Monitoreo defensivo base, cabina cliente y reportes ejecutivos básicos.',
      features: ['monitoreo defensivo base', 'alertas priorizadas', 'cabina cliente', 'reportes ejecutivos básicos'],
      payment_status: 'prepared_no_checkout',
    },
    {
      id: 'plan_premium',
      name: 'Plan Premium',
      price_label: 'S/499/mes',
      description: 'Evidencia profunda, decisiones humanas e historial avanzado.',
      features: ['todo empresa', 'mayor profundidad de evidencia', 'decisiones humanas', 'historial avanzado'],
      payment_status: 'prepared_no_checkout',
    },
    {
      id: 'plan_corporativo',
      name: 'Plan Corporativo',
      price_label: 'desde S/999/mes',
      description: 'Múltiples activos, gobierno de riesgo, prioridad alta y capa interna ampliada.',
      features: ['todo premium', 'múltiples activos/clientes', 'gobierno de riesgo', 'prioridad alta'],
      payment_status: 'prepared_no_checkout',
    },
  ],
};

const tabs = [
  'Vista Cliente',
  'Vista Admin',
  'Vista CEO/CEREBRO',
  'Decisiones humanas',
  'Evidencia',
  'Historial',
  'Planes / Comercial',
];

const severityLabels: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
  info: 'Informativo',
};

function severityClass(severity: string) {
  if (severity === 'critical') return 'risk-critical';
  if (severity === 'high') return 'risk-high';
  if (severity === 'medium') return 'risk-medium';
  if (severity === 'info') return 'risk-low';
  return 'risk-safe';
}

function modeLabel(mode: string, authenticated: boolean) {
  if (!authenticated) return 'DEMO LOCAL';
  return mode === 'DEMO_LOCAL' ? 'DEMO LOCAL AUTENTICADO' : 'DATOS VERIFICADOS';
}

export default function HumanCabinPage() {
  const [summary, setSummary] = useState<HumanCabinSummary>(FALLBACK_SUMMARY);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [authenticated, setAuthenticated] = useState(false);
  const [actionState, setActionState] = useState('Sin acciones ejecutadas.');

  useEffect(() => {
    let active = true;
    async function loadCabin() {
      const token = await ensureToken();
      if (!active) return;
      setAuthenticated(Boolean(token));
      if (!token) {
        setSummary(FALLBACK_SUMMARY);
        return;
      }
      try {
        const data = await api.getHumanCabinSummary();
        if (!active) return;
        setSummary({
          ...FALLBACK_SUMMARY,
          ...data,
          requests: Array.isArray(data.requests) ? data.requests : FALLBACK_SUMMARY.requests,
          plans: Array.isArray(data.plans) ? data.plans : FALLBACK_SUMMARY.plans,
        });
      } catch {
        if (!active) return;
        setSummary(FALLBACK_SUMMARY);
      }
    }
    loadCabin();
    return () => {
      active = false;
    };
  }, []);

  const sortedRequests = useMemo(() => {
    return [...(summary.requests || [])].sort((a, b) => b.risk_score - a.risk_score);
  }, [summary.requests]);

  const topPriority = summary.top_priority || sortedRequests[0] || null;

  async function runAction(requestId: string, action: 'approve' | 'reject' | 'pause' | 'more-evidence' | 'escalate' | 'block-sensitive-action') {
    if (!authenticated) {
      setActionState('Acción preparada. Inicia sesión para registrar auditoría real.');
      return;
    }
    try {
      const result = await api.humanCabinAction(requestId, action, `Acción ${action} desde Cabina Humana local.`);
      const updated = result?.request as HumanRequest | undefined;
      if (updated) {
        setSummary((current) => ({
          ...current,
          requests: current.requests.map((item) => item.id === updated.id ? updated : item),
          audit_events_count: current.audit_events_count + 1,
        }));
      }
      setActionState('Acción humana registrada con auditoría.');
    } catch {
      setActionState('No se pudo registrar la acción. La cabina mantiene estado preparado.');
    }
  }

  return (
    <section className="sentinela-human-premium" data-testid="sentinela-human-cabin">
      <header className="sentinela-command-header">
        <div>
          <span className="sentinela-eyebrow">Cabina Humana</span>
          <h1>Decisiones críticas con evidencia</h1>
          <p>
            Centro defensivo premium para revisar riesgo, priorizar decisiones y
            actuar solo con trazabilidad. Datos marcados como demo/local cuando no
            existe evidencia productiva autenticada.
          </p>
        </div>
        <aside>
          <span>{modeLabel(summary.mode, authenticated)}</span>
          <strong>{summary.risk_temperature}</strong>
          <p>Plan actual: {summary.plan_current}</p>
          <small>{summary.subscription_status.replaceAll('_', ' ')}</small>
        </aside>
      </header>

      <section className="sentinela-premium-metrics" aria-label="Estado ejecutivo">
        <article>
          <span>Riesgo global</span>
          <strong className={severityClass(summary.global_risk)}>{severityLabels[summary.global_risk] || summary.global_risk}</strong>
          <p>Temperatura {summary.risk_temperature}</p>
        </article>
        <article>
          <span>Incidentes activos</span>
          <strong>{summary.active_incidents}</strong>
          <p>Ordenados por gravedad real.</p>
        </article>
        <article>
          <span>Decisiones pendientes</span>
          <strong>{summary.pending_decisions}</strong>
          <p>Cola humana con auditoría.</p>
        </article>
        <article>
          <span>Acciones bloqueadas</span>
          <strong>{summary.blocked_actions}</strong>
          <p>Sin ejecución sensible automática.</p>
        </article>
        <article>
          <span>Confianza</span>
          <strong>{summary.system_confidence}%</strong>
          <p>Confianza no equivale a protección absoluta.</p>
        </article>
        <article>
          <span>Respuesta promedio</span>
          <strong>{summary.average_response_minutes} min</strong>
          <p>Estimación local de demostración.</p>
        </article>
      </section>

      {topPriority && (
        <section className="sentinela-crisis-summary">
          <div>
            <span className="sentinela-eyebrow">Prioridad operativa</span>
            <h2>{topPriority.title}</h2>
            <p>{topPriority.description}</p>
          </div>
          <div className="traceability-strip">
            <span>{severityLabels[topPriority.severity]}</span>
            <span>Riesgo {topPriority.risk_score}</span>
            <span>Confianza {Math.round(topPriority.confidence_score * 100)}%</span>
            <span>{topPriority.source_agent}</span>
          </div>
        </section>
      )}

      <nav className="sentinela-human-tabs" aria-label="Capas de Cabina Humana">
        {tabs.map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Vista Cliente' && (
        <section className="sentinela-tab-panel">
          <div className="sentinela-panel-heading">
            <span className="sentinela-eyebrow">Capa Cliente</span>
            <h2>Lo que ve una empresa protegida</h2>
            <p>Sin fuentes internas protegidas, sin métodos sensibles y sin rutas administrativas.</p>
          </div>
          <div className="sentinela-client-grid">
            {sortedRequests.slice(0, 4).map((item) => (
              <article key={item.id} className={`sentinela-review-card ${item.severity}`}>
                <div>
                  <span>{severityLabels[item.severity]}</span>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <small>{item.recommended_decision}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'Vista Admin' && (
        <section className="sentinela-tab-panel">
          <div className="sentinela-panel-heading">
            <span className="sentinela-eyebrow">Capa Admin / Operador</span>
            <h2>Cola de decisiones humanas</h2>
            <p>Acciones reversibles, evidencia visible y auditoría obligatoria.</p>
          </div>
          <div className="sentinela-decision-grid">
            {sortedRequests.map((item) => (
              <article key={item.id} className="sentinela-decision-card">
                <div className="sentinela-decision-topline">
                  <span className={severityClass(item.severity)}>{severityLabels[item.severity]}</span>
                  <small>{item.status}</small>
                </div>
                <strong>{item.title}</strong>
                <p>{item.proposed_action}</p>
                <div className="sentinela-human-actions">
                  <button onClick={() => runAction(item.id, 'approve')}>Aprobar</button>
                  <button onClick={() => runAction(item.id, 'reject')}>Rechazar</button>
                  <button onClick={() => runAction(item.id, 'pause')}>Pausar</button>
                  <button onClick={() => runAction(item.id, 'more-evidence')}>Más evidencia</button>
                  <button onClick={() => runAction(item.id, 'escalate')}>Escalar</button>
                  <button onClick={() => runAction(item.id, 'block-sensitive-action')}>Bloquear</button>
                </div>
              </article>
            ))}
          </div>
          <p className="sentinela-action-state">{actionState}</p>
        </section>
      )}

      {activeTab === 'Vista CEO/CEREBRO' && (
        <section className="sentinela-tab-panel">
          <div className="sentinela-panel-heading">
            <span className="sentinela-eyebrow">Capa Estratégica Interna</span>
            <h2>Decisión final y coordinación protegida</h2>
            <p>Esta capa traduce riesgo, evidencia faltante y acciones que requieren aprobación humana.</p>
          </div>
          <div className="sentinela-strategy-grid">
            <article>
              <span>Decisión crítica</span>
              <strong>{topPriority?.recommended_decision || 'Sin decisión crítica activa.'}</strong>
              <p>No se ejecutan acciones irreversibles sin aprobación superior y política explícita.</p>
            </article>
            <article>
              <span>Evidencia faltante</span>
              <strong>{sortedRequests.filter((item) => item.status === 'needs_more_evidence').length}</strong>
              <p>Cuando la evidencia es incompleta, la cabina no declara certeza.</p>
            </article>
            <article>
              <span>Construcción defensiva</span>
              <strong>Preparada, no ejecutada</strong>
              <p>Las mejoras técnicas quedan como tareas preparadas hasta tener aprobación y evidencia.</p>
            </article>
          </div>
        </section>
      )}

      {activeTab === 'Decisiones humanas' && (
        <section className="sentinela-tab-panel">
          <div className="sentinela-panel-heading">
            <span className="sentinela-eyebrow">Human Review</span>
            <h2>Panel de decisión</h2>
            <p>Acción propuesta, impacto, riesgo y recomendación en una vista compacta.</p>
          </div>
          <div className="sentinela-decision-list">
            {sortedRequests.map((item) => (
              <article key={item.id}>
                <span>{item.id}</span>
                <strong>{item.title}</strong>
                <p>{item.recommended_decision}</p>
                <small>{item.target_system} · {item.client_name}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'Evidencia' && (
        <section className="sentinela-tab-panel">
          <div className="sentinela-panel-heading">
            <span className="sentinela-eyebrow">Trazabilidad</span>
            <h2>Evidencia limpia y segura</h2>
            <p>Origen visible seguro, timestamp, confidence score, risk score y sistema afectado.</p>
          </div>
          <div className="sentinela-evidence-table" role="table">
            {sortedRequests.map((item) => (
              <div role="row" key={item.id}>
                <span>{item.source_agent}</span>
                <strong>{item.target_system}</strong>
                <em>Risk {item.risk_score}</em>
                <em>Confidence {Math.round(item.confidence_score * 100)}%</em>
                <small>{String(item.evidence?.data_state || summary.mode)}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'Historial' && (
        <section className="sentinela-tab-panel">
          <div className="sentinela-panel-heading">
            <span className="sentinela-eyebrow">Auditoría</span>
            <h2>Historial de amenazas y decisiones</h2>
            <p>{summary.audit_events_count} eventos de auditoría registrados en backend autenticado.</p>
          </div>
          <div className="sentinela-history-grid">
            {sortedRequests.map((item) => (
              <article key={item.id}>
                <span>{item.status}</span>
                <strong>{item.title}</strong>
                <p>{item.reviewer_notes || 'Sin nota humana registrada todavía.'}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'Planes / Comercial' && (
        <section className="sentinela-tab-panel">
          <div className="sentinela-panel-heading">
            <span className="sentinela-eyebrow">Planes comerciales</span>
            <h2>Sin plan gratis, sin checkout falso</h2>
            <p>La cabina muestra precios oficiales iniciales. El pago real queda preparado, no activado.</p>
          </div>
          <div className="sentinela-pricing-grid">
            {summary.plans.map((plan) => (
              <article key={plan.id}>
                <span>{plan.name}</span>
                <strong>{plan.price_label}</strong>
                <p>{plan.description}</p>
                <ul>
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <button type="button" disabled>Pago real pendiente</button>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
