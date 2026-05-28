'use client';

import { useEffect, useState } from 'react';
import { DataProvenanceBadge, DataState, OperationalNotice, classifyDataState, isVerifiedData, protectedValue } from '@/components/OperationalState';
import { api, ensureToken } from '@/lib/api';

export default function Dashboard() {
  const [backendData, setBackendData] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [risk, setRisk] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [temporalCorrelation, setTemporalCorrelation] = useState<any>(null);
  const [phase3Summary, setPhase3Summary] = useState<any>(null);
  const [phase4Summary, setPhase4Summary] = useState<any>(null);
  const [phase5Summary, setPhase5Summary] = useState<any>(null);
  const [phase6Summary, setPhase6Summary] = useState<any>(null);
  const [phase7Summary, setPhase7Summary] = useState<any>(null);
  const [fetchDiagnostics, setFetchDiagnostics] = useState<any[]>([]);
  const [dataState, setDataState] = useState<DataState>('loading');

  useEffect(() => {
    const fetchData = async () => {
      const safeFetch = async (label: string, loader: () => Promise<any>) => {
        try {
          return { label, ok: true, data: await loader(), state: 'verified' as DataState };
        } catch (error) {
          return { label, ok: false, data: null, state: classifyDataState(error) };
        }
      };

      try {
        const token = await ensureToken();
        if (!token) {
          setBackendData(null);
          setRisk(null);
          setIncidents([]);
          setIntelligence(null);
          setTemporalCorrelation(null);
          setPhase3Summary(null);
          setPhase4Summary(null);
          setPhase5Summary(null);
          setPhase6Summary(null);
          setPhase7Summary(null);
          setFetchDiagnostics([]);
          setDataState('auth_required');
          return;
        }

        const results = await Promise.all([
          safeFetch('memory', api.getThreatMemory),
          safeFetch('risk', api.getEcosystemRisk),
          safeFetch('incidents', api.getIncidents),
          safeFetch('operational_intelligence', api.getOperationalIntelligence),
          safeFetch('temporal_correlation', api.getTemporalCorrelation),
          safeFetch('phase3_summary', api.getPhase3Summary),
          safeFetch('phase4_resilience', api.getPhase4Summary),
          safeFetch('phase5_ecosystem', api.getPhase5Summary),
          safeFetch('phase6_adversarial', api.getPhase6Summary),
          safeFetch('phase7_governance', api.getPhase7Summary),
        ]);
        const byLabel = Object.fromEntries(results.map(result => [result.label, result]));
        const failures = results.filter(result => !result.ok);
        const successes = results.filter(result => result.ok);

        setBackendData(byLabel.memory?.ok ? byLabel.memory.data : null);
        setRisk(byLabel.risk?.ok ? byLabel.risk.data : null);
        setIncidents(byLabel.incidents?.ok && Array.isArray(byLabel.incidents.data) ? byLabel.incidents.data : []);
        setIntelligence(byLabel.operational_intelligence?.ok ? byLabel.operational_intelligence.data : null);
        setTemporalCorrelation(byLabel.temporal_correlation?.ok ? byLabel.temporal_correlation.data : null);
        setPhase3Summary(byLabel.phase3_summary?.ok ? byLabel.phase3_summary.data : null);
        setPhase4Summary(byLabel.phase4_resilience?.ok ? byLabel.phase4_resilience.data : null);
        setPhase5Summary(byLabel.phase5_ecosystem?.ok ? byLabel.phase5_ecosystem.data : null);
        setPhase6Summary(byLabel.phase6_adversarial?.ok ? byLabel.phase6_adversarial.data : null);
        setPhase7Summary(byLabel.phase7_governance?.ok ? byLabel.phase7_governance.data : null);
        setFetchDiagnostics(results.map(result => ({
          label: result.label,
          ok: result.ok,
          state: result.state,
        })));

        if (failures.length === 0) {
          setDataState('verified');
        } else if (successes.length > 0) {
          setDataState(failures.some(result => result.state === 'timeout') ? 'limited_visibility' : 'partial_operation');
        } else if (failures.every(result => result.state === 'auth_required')) {
          setDataState('auth_degraded');
        } else if (failures.some(result => result.state === 'timeout')) {
          setDataState('timeout');
        } else {
          setDataState('data_unavailable');
        }
      } catch (error) {
        console.info('Protected dashboard data state:', classifyDataState(error));
        setBackendData(null);
        setRisk(null);
        setIncidents([]);
        setIntelligence(null);
        setTemporalCorrelation(null);
        setPhase3Summary(null);
        setPhase4Summary(null);
        setPhase5Summary(null);
        setPhase6Summary(null);
        setPhase7Summary(null);
        setFetchDiagnostics([]);
        setDataState(classifyDataState(error));
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const verified = isVerifiedData(dataState);
  const totalEvents = verified ? backendData?.total_events ?? 0 : 0;
  const threatEvents = verified ? backendData?.threat_events ?? 0 : 0;
  const blockedEvents = verified ? backendData?.blocked_events ?? 0 : 0;
  const totalIncidents = verified ? backendData?.total_incidents ?? 0 : 0;
  const globalScore = verified && totalEvents > 0
    ? Math.max(0, Math.round(100 - (threatEvents / totalEvents) * 100))
    : null;
  const agentesActivos = verified && risk?.agents ? Object.keys(risk.agents).length : 0;

  const amenazasRecientes = verified ? incidents.slice(0, 6).map((inc: any) => ({
    id: inc.id,
    tipo: inc.threat_types?.[0] ?? 'Amenaza detectada',
    sistema: inc.agent?.toUpperCase() ?? 'UNKNOWN',
    severidad: inc.severity ?? 'LOW',
    tiempo: inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : '-',
    bloqueado: inc.policy_action === 'BLOCK',
  })) : [];

  const timeline = verified ? incidents.slice(0, 7).map((inc: any) => ({
    tiempo: inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : '-',
    evento: inc.policy_action === 'BLOCK'
      ? `Amenaza bloqueada - ${inc.threat_types?.[0] ?? 'desconocida'}`
      : `Amenaza detectada - ${inc.threat_types?.[0] ?? 'desconocida'}`,
    sistema: inc.agent?.toUpperCase() ?? 'UNKNOWN',
    tipo: inc.policy_action === 'BLOCK' ? 'block' : 'info',
  })) : [];

  const sistemas = verified && risk?.agents
    ? Object.entries(risk.agents).map(([nombre, data]: [string, any]) => ({
      nombre: nombre.toUpperCase(),
      score: Math.max(0, Math.round(100 - data.score)),
      estado: data.score >= 70 ? 'warning' : 'live',
    }))
    : [];
  const intelligenceReady = verified && intelligence;
  const classificationCounts = intelligenceReady ? intelligence.classification_counts ?? {} : {};
  const signalNoise = intelligenceReady ? intelligence.signal_noise ?? {} : {};
  const evidenceCount = intelligenceReady ? intelligence.evidence_count ?? 0 : 0;
  const intelligenceState = intelligenceReady ? intelligence.data_state ?? 'UNKNOWN' : 'PROTECTED';
  const temporalReady = verified && temporalCorrelation;
  const repeatedEvents = temporalReady ? temporalCorrelation.repeated_events ?? [] : [];
  const recurringAnomalies = temporalReady ? temporalCorrelation.recurring_anomalies ?? [] : [];
  const recurringDegradation = temporalReady ? temporalCorrelation.recurring_degradation ?? [] : [];
  const confidenceSummary = temporalReady ? temporalCorrelation.correlation_confidence ?? {} : {};
  const memoryEvidenceCount = temporalReady ? temporalCorrelation.evidence_count ?? 0 : 0;
  const phase3Ready = verified && phase3Summary;
  const phase3Evidence = phase3Ready ? phase3Summary.evidence_count ?? 0 : 0;
  const phase3Scoring = phase3Ready ? phase3Summary.scoring ?? {} : {};
  const phase3Adversarial = phase3Ready ? phase3Summary.adversarial ?? {} : {};
  const phase3Correlation = phase3Ready ? phase3Summary.correlation ?? {} : {};
  const phase3Exposure = phase3Ready ? phase3Summary.exposure ?? {} : {};
  const phase3Cognition = phase3Ready ? phase3Summary.cognition ?? {} : {};
  const phase3Survivability = phase3Ready ? phase3Summary.survivability ?? {} : {};
  const phase3Freeze = phase3Ready ? phase3Summary.freeze_governance ?? {} : {};
  const phase3Certification = phase3Ready ? phase3Summary.certification ?? {} : {};
  const phase4Ready = Boolean(phase4Summary);
  const phase4Runtime = phase4Ready ? phase4Summary.degraded_runtime ?? {} : {};
  const phase4Recovery = phase4Ready ? phase4Summary.recovery ?? {} : {};
  const phase4Fallback = phase4Ready ? phase4Summary.fallback ?? {} : {};
  const phase4Integrity = phase4Ready ? phase4Summary.integrity ?? {} : {};
  const phase4Dependencies = phase4Ready ? phase4Summary.dependencies ?? {} : {};
  const phase4Rollback = phase4Ready ? phase4Summary.rollback ?? {} : {};
  const phase4Certification = phase4Ready ? phase4Summary.certification ?? {} : {};
  const phase5Ready = Boolean(phase5Summary);
  const phase5Assets = phase5Ready ? phase5Summary.asset_inventory ?? {} : {};
  const phase5Endpoints = phase5Ready ? phase5Summary.endpoint_intelligence ?? {} : {};
  const phase5Dependencies = phase5Ready ? phase5Summary.dependency_mapping ?? {} : {};
  const phase5Exposure = phase5Ready ? phase5Summary.external_exposure ?? {} : {};
  const phase5Secrets = phase5Ready ? phase5Summary.sensitive_exposure ?? {} : {};
  const phase5SupplyChain = phase5Ready ? phase5Summary.supply_chain ?? {} : {};
  const phase5Trust = phase5Ready ? phase5Summary.trust_zones ?? {} : {};
  const phase5Risk = phase5Ready ? phase5Summary.external_risk_correlation ?? {} : {};
  const phase5Ecosystem = phase5Ready ? phase5Summary.ecosystem_intelligence ?? {} : {};
  const phase5Certification = phase5Ready ? phase5Summary.certification ?? {} : {};
  const phase6Ready = Boolean(phase6Summary);
  const phase6Attack = phase6Ready ? phase6Summary.attack_paths ?? {} : {};
  const phase6Exploitability = phase6Ready ? phase6Summary.exploitability ?? {} : {};
  const phase6Strategic = phase6Ready ? phase6Summary.strategic_correlation ?? {} : {};
  const phase6Behavior = phase6Ready ? phase6Summary.behavioral_modeling ?? {} : {};
  const phase6Escalation = phase6Ready ? phase6Summary.escalation ?? {} : {};
  const phase6Simulation = phase6Ready ? phase6Summary.scenario_simulation ?? {} : {};
  const phase6Risk = phase6Ready ? phase6Summary.strategic_risk ?? {} : {};
  const phase6Certification = phase6Ready ? phase6Summary.certification ?? {} : {};
  const phase7Ready = Boolean(phase7Summary);
  const phase7Freeze = phase7Ready ? phase7Summary.freeze_governance ?? {} : {};
  const phase7Release = phase7Ready ? phase7Summary.release_integrity ?? {} : {};
  const phase7Deployment = phase7Ready ? phase7Summary.deployment_trust ?? {} : {};
  const phase7Runtime = phase7Ready ? phase7Summary.runtime_trust ?? {} : {};
  const phase7Audit = phase7Ready ? phase7Summary.operational_audit ?? {} : {};
  const phase7Escalation = phase7Ready ? phase7Summary.governance_escalation ?? {} : {};
  const phase7Executive = phase7Ready ? phase7Summary.executive_risk ?? {} : {};
  const phase7Survivability = phase7Ready ? phase7Summary.enterprise_survivability ?? {} : {};
  const phase7Readiness = phase7Ready ? phase7Summary.operational_readiness ?? {} : {};
  const phase7Final = phase7Ready ? phase7Summary.final_certification ?? {} : {};
  const failedFetches = fetchDiagnostics.filter(item => !item.ok);

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <h1 className="font-syne" style={{ fontSize: '22px', fontWeight: 800, color: '#E8F5E8' }}>
            CENTRO DE COMANDO
          </h1>
          <DataProvenanceBadge state="live_runtime" />
          <DataProvenanceBadge state={dataState} />
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          AI Runtime Security - {protectedValue(dataState, agentesActivos)} agentes monitoreados - {verified ? 'datos autenticados' : 'data protegida no verificada'}
        </p>
      </div>

      <div className="grid-metrics" style={{ marginBottom: '24px' }}>
        <MetricCard
          label="SECURITY HEALTH SCORE"
          value={globalScore !== null ? `${globalScore}` : '--'}
          unit="/100"
          color={globalScore !== null && globalScore >= 80 ? 'var(--green-neon)' : 'var(--yellow-warn)'}
          sub={verified ? 'Verified authenticated data' : dataState === 'auth_required' ? 'AUTH REQUIRED' : 'DATA UNAVAILABLE'}
          subColor={verified ? 'var(--green-neon)' : 'var(--yellow-warn)'}
          icon="O"
        />
        <MetricCard
          label="THREATS BLOQUEADAS"
          value={`${protectedValue(dataState, blockedEvents)}`}
          color="var(--red-alert)"
          sub={verified ? `${totalIncidents} incidentes abiertos` : 'Protected metric'}
          subColor={verified ? 'var(--red-alert)' : 'var(--yellow-warn)'}
          icon="!"
        />
        <MetricCard
          label="PROMPTS ANALIZADOS"
          value={`${protectedValue(dataState, totalEvents)}`}
          color="var(--green-neon)"
          sub={verified ? 'Total historico real' : 'Protected metric'}
          subColor="var(--text-secondary)"
          icon=">"
        />
        <MetricCard
          label="AGENTES ACTIVOS"
          value={`${protectedValue(dataState, agentesActivos)}`}
          color="var(--blue-info)"
          sub={verified ? 'Monitoreados en tiempo real' : 'Protected metric'}
          subColor={verified ? 'var(--green-neon)' : 'var(--yellow-warn)'}
          icon="#"
        />
      </div>

      <div className="card-base" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8', marginBottom: 6 }}>
              PHASE 7 GOVERNANCE FOUNDATION
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: 760 }}>
              Freeze, release, deployment, runtime, audit, escalation, survivability and readiness validation. Local evidence only; no fake enterprise certification.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DataProvenanceBadge state={dataState} />
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(255,184,0,0.08)',
              color: 'var(--yellow-warn)',
              border: '1px solid rgba(255,184,0,0.25)',
              fontWeight: 800,
              letterSpacing: '1px',
              fontFamily: 'Syne, sans-serif',
              whiteSpace: 'nowrap',
            }}>
              NO FAKE FREEZE
            </span>
          </div>
        </div>
        {!phase7Ready ? (
          <OperationalNotice state={dataState} subject="phase 7 governance foundation" />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'FREEZE', value: phase7Freeze.classification ?? 'UNKNOWN', sub: phase7Freeze.deploy_integrity ?? 'evidence required', color: phase7Freeze.classification === 'SAFE_TO_DEPLOY' ? 'var(--green-neon)' : phase7Freeze.classification === 'FREEZE_REQUIRED' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'RELEASE', value: phase7Release.classification ?? 'UNKNOWN', sub: phase7Release.deployment_consistency_validation ?? 'traceability', color: phase7Release.classification === 'TRUSTED' ? 'var(--green-neon)' : phase7Release.classification === 'UNTRUSTED' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'DEPLOY RISK', value: phase7Deployment.risk_classification ?? 'UNKNOWN', sub: phase7Deployment.deployment_validation?.deploy_continuity_validation ?? 'continuity', color: phase7Deployment.risk_classification === 'LOW_RISK' ? 'var(--green-neon)' : phase7Deployment.risk_classification === 'UNSAFE' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'RUNTIME TRUST', value: phase7Runtime.classification ?? 'UNKNOWN', sub: phase7Runtime.runtime_trust_validation?.runtime_integrity_validation ?? 'runtime', color: phase7Runtime.classification === 'TRUSTWORTHY' ? 'var(--green-neon)' : phase7Runtime.classification === 'UNTRUSTWORTHY' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'AUDIT', value: phase7Audit.classification ?? 'UNKNOWN', sub: `${phase7Audit.continuous_audit_visibility?.length ?? 0} findings`, color: phase7Audit.classification === 'VERIFIED' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
                { label: 'ESCALATION', value: phase7Escalation.classification ?? 'UNKNOWN', sub: `${phase7Escalation.escalation_visibility?.length ?? 0} triggers`, color: phase7Escalation.classification === 'STABLE' ? 'var(--green-neon)' : phase7Escalation.classification === 'ESCALATED' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'EXEC RISK', value: phase7Executive.classification ?? 'UNKNOWN', sub: 'executive summary', color: phase7Executive.classification === 'LOW' ? 'var(--green-neon)' : phase7Executive.classification === 'HIGH' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'SURVIVABILITY', value: phase7Survivability.classification ?? 'UNKNOWN', sub: 'enterprise mode', color: phase7Survivability.classification === 'OPERATIONALLY_SURVIVABLE' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
                { label: 'READINESS', value: phase7Readiness.classification ?? 'UNKNOWN', sub: `${phase7Readiness.operational_visibility?.length ?? 0} blockers`, color: phase7Readiness.classification === 'ENTERPRISE_FOUNDATION_READY' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
                { label: 'FINAL', value: phase7Final.classification ?? 'UNKNOWN', sub: 'honest certification', color: phase7Final.classification === 'OPERATIONALLY_ENTERPRISE_FOUNDATION' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
              ].map(item => (
                <div key={item.label} style={{ border: '1px solid rgba(0,255,136,0.08)', borderRadius: 8, padding: 12, background: 'rgba(0,255,136,0.025)', minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 15, color: item.color, fontWeight: 900, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,184,0,0.18)', background: 'rgba(255,184,0,0.04)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>DEPLOY DECISION</div>
                <div style={{ fontSize: 12, color: 'var(--yellow-warn)', lineHeight: 1.6 }}>
                  {phase7Freeze.classification === 'SAFE_TO_DEPLOY'
                    ? 'Deploy appears safe from current evidence.'
                    : 'Deploy remains gated by local source, release, runtime or survivability evidence.'}
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.16)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>LIMITATION</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {phase7Summary.limitations?.[0] ?? 'Local governance evidence only; live deployment proof must be validated separately.'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card-base" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8', marginBottom: 6 }}>
              PHASE 6 ADVERSARIAL REASONING
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: 760 }}>
              Defensive attack-path, exploitability, escalation, behavior, simulation and strategic risk reasoning. No fake attackers, no CVE claims, no compromise theater.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DataProvenanceBadge state={dataState} />
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(255,184,0,0.08)',
              color: 'var(--yellow-warn)',
              border: '1px solid rgba(255,184,0,0.25)',
              fontWeight: 800,
              letterSpacing: '1px',
              fontFamily: 'Syne, sans-serif',
              whiteSpace: 'nowrap',
            }}>
              NO FAKE ATTACKERS
            </span>
          </div>
        </div>
        {!phase6Ready ? (
          <OperationalNotice state={dataState} subject="phase 6 adversarial reasoning" />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'ATTACK PATHS', value: phase6Attack.confidence ?? 'UNKNOWN', sub: phase6Attack.attack_chain_baseline ?? 'candidate only', color: phase6Attack.confidence === 'HIGH_CONFIDENCE' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'EXPLOITABILITY', value: phase6Exploitability.classification ?? 'UNKNOWN', sub: `confidence ${phase6Exploitability.confidence ?? 'UNKNOWN'}`, color: phase6Exploitability.classification === 'HIGH' ? 'var(--red-alert)' : phase6Exploitability.classification === 'MEDIUM' ? 'var(--yellow-warn)' : 'var(--text-secondary)' },
                { label: 'STRATEGIC', value: phase6Strategic.threat_confidence ?? 'UNKNOWN', sub: phase6Strategic.escalation_intelligence ?? 'none', color: 'var(--yellow-warn)' },
                { label: 'BEHAVIOR', value: phase6Behavior.classification ?? 'UNKNOWN', sub: 'no actor claim', color: phase6Behavior.classification === 'HIGHLY_SUSPICIOUS' ? 'var(--red-alert)' : 'var(--blue-info)' },
                { label: 'ESCALATION', value: phase6Escalation.classification ?? 'UNKNOWN', sub: 'controlled escalation', color: phase6Escalation.classification === 'HIGH_RISK' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'SIMULATION', value: phase6Simulation.simulation_classification ?? 'UNKNOWN', sub: `${phase6Simulation.scenarios?.length ?? 0} scenarios`, color: 'var(--blue-info)' },
                { label: 'RISK', value: phase6Risk.classification ?? 'UNKNOWN', sub: phase6Risk.uncertainty_visible ? 'uncertainty visible' : 'evidence mapped', color: phase6Risk.classification === 'HIGH' ? 'var(--red-alert)' : phase6Risk.classification === 'ELEVATED' ? 'var(--yellow-warn)' : 'var(--green-neon)' },
                { label: 'CERTIFICATION', value: phase6Certification.classification ?? 'UNKNOWN', sub: 'not military-grade', color: phase6Certification.classification === 'STRATEGICALLY_COHERENT' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
              ].map(item => (
                <div key={item.label} style={{ border: '1px solid rgba(0,255,136,0.08)', borderRadius: 8, padding: 12, background: 'rgba(0,255,136,0.025)', minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 16, color: item.color, fontWeight: 900, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.35 }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.16)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>CLAIMS</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  No attacker identity, no malware, no CVE, no compromise, no nation-state attribution.
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,184,0,0.18)', background: 'rgba(255,184,0,0.04)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>LIMITATION</div>
                <div style={{ fontSize: 12, color: 'var(--yellow-warn)', lineHeight: 1.6 }}>
                  {phase6Summary.limitations?.[0] ?? 'Operational evidence only; adversarial reasoning remains bounded by confidence.'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card-base" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8', marginBottom: 6 }}>
              PHASE 5 ECOSYSTEM VISIBILITY
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: 760 }}>
              Runtime assets, endpoints, dependencies, public exposure, redacted sensitive exposure, supply chain, trust zones and ecosystem risk. Route and manifest evidence only.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DataProvenanceBadge state={dataState} />
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(0,170,255,0.08)',
              color: 'var(--blue-info)',
              border: '1px solid rgba(0,170,255,0.25)',
              fontWeight: 800,
              letterSpacing: '1px',
              fontFamily: 'Syne, sans-serif',
              whiteSpace: 'nowrap',
            }}>
              NO FAKE ASSETS
            </span>
          </div>
        </div>
        {!phase5Ready ? (
          <OperationalNotice state={dataState} subject="phase 5 ecosystem visibility" />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'ASSETS', value: phase5Assets.asset_count ?? 0, sub: `${phase5Assets.runtime_assets ?? 0} runtime`, color: 'var(--green-neon)' },
                { label: 'ENDPOINTS', value: phase5Endpoints.endpoint_count ?? 0, sub: `${phase5Exposure.public_endpoint_count ?? 0} public`, color: 'var(--blue-info)' },
                { label: 'DEPENDENCIES', value: phase5Dependencies.dependency_count ?? 0, sub: `${phase5Dependencies.external_dependency_count ?? 0} external`, color: 'var(--blue-info)' },
                { label: 'SENSITIVE', value: phase5Secrets.finding_count ?? 0, sub: phase5Secrets.secret_values_returned ? 'unsafe' : 'values redacted', color: (phase5Secrets.finding_count ?? 0) > 0 ? 'var(--yellow-warn)' : 'var(--green-neon)' },
                { label: 'SUPPLY CHAIN', value: phase5SupplyChain.supply_chain_operational_risk ?? 'UNKNOWN', sub: `${phase5SupplyChain.package_count ?? 0} packages`, color: phase5SupplyChain.supply_chain_operational_risk === 'HIGH' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'TRUST ZONES', value: phase5Trust.zones?.length ?? 0, sub: 'boundary map', color: 'var(--green-neon)' },
                { label: 'EXTERNAL RISK', value: phase5Risk.risk_level ?? 'UNKNOWN', sub: `${phase5Risk.correlations?.length ?? 0} correlations`, color: phase5Risk.risk_level === 'REVIEW_REQUIRED' ? 'var(--yellow-warn)' : 'var(--text-secondary)' },
                { label: 'CERTIFICATION', value: phase5Certification.classification ?? 'UNKNOWN', sub: 'not enterprise-grade', color: phase5Certification.classification === 'OPERATIONALLY_CONNECTED' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
              ].map(item => (
                <div key={item.label} style={{ border: '1px solid rgba(0,255,136,0.08)', borderRadius: 8, padding: 12, background: 'rgba(0,255,136,0.025)', minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 16, color: item.color, fontWeight: 900, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.35 }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.16)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>ECOSYSTEM SUMMARY</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {phase5Ecosystem.ecosystem_operational_summary ?? 'Ecosystem summary unavailable.'}
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.16)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>LIMITATIONS</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {phase5Summary.limitations?.[0] ?? 'Local source, health, route metadata and manifests only.'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card-base" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8', marginBottom: 6 }}>
              OPERATIONAL INTELLIGENCE BASELINE
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: 680 }}>
              Normalized event snapshot from stored runtime evidence. No ML claim, no fake realtime, no fabricated anomaly scoring.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DataProvenanceBadge state={dataState} />
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(255,184,0,0.08)',
              color: 'var(--yellow-warn)',
              border: '1px solid rgba(255,184,0,0.25)',
              fontWeight: 800,
              letterSpacing: '1px',
              fontFamily: 'Syne, sans-serif',
              whiteSpace: 'nowrap',
            }}>
              NO ML CLAIM
            </span>
          </div>
        </div>
        {!verified ? (
          <OperationalNotice state={dataState} subject="operational intelligence baseline" />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'EVIDENCE EVENTS', value: evidenceCount, sub: intelligenceState, color: evidenceCount > 0 ? 'var(--green-neon)' : 'var(--yellow-warn)' },
                { label: 'SIGNAL', value: signalNoise.signal ?? 0, sub: 'correlation-worthy', color: 'var(--red-alert)' },
                { label: 'NOISE', value: signalNoise.noise ?? 0, sub: 'low operational action', color: 'var(--text-secondary)' },
                { label: 'LOW CONFIDENCE', value: signalNoise.low_confidence ?? 0, sub: 'do not escalate', color: 'var(--yellow-warn)' },
                { label: 'DUPLICATES', value: signalNoise.duplicate ?? 0, sub: 'suppressed', color: 'var(--blue-info)' },
              ].map(item => (
                <div key={item.label} style={{ border: '1px solid rgba(0,255,136,0.08)', borderRadius: 8, padding: 12, background: 'rgba(0,255,136,0.025)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 24, color: item.color, fontWeight: 900, lineHeight: 1 }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 8 }}>
              {['NORMAL', 'SUSPICIOUS', 'DEGRADED', 'HIGH_RISK', 'CRITICAL'].map(kind => (
                <div key={kind} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>{kind}</span>
                  <span style={{ fontSize: 13, color: kind === 'CRITICAL' || kind === 'HIGH_RISK' ? 'var(--red-alert)' : kind === 'DEGRADED' || kind === 'SUSPICIOUS' ? 'var(--yellow-warn)' : 'var(--green-neon)', fontWeight: 900 }}>
                    {classificationCounts[kind] ?? 0}
                  </span>
                </div>
              ))}
            </div>
            {evidenceCount === 0 && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 8, border: '1px solid rgba(255,184,0,0.25)', background: 'rgba(255,184,0,0.06)', color: 'var(--yellow-warn)', fontSize: 12, lineHeight: 1.6 }}>
                INSUFFICIENT DATA: intelligence baseline is ready, but there are no stored runtime events to classify. This must not be presented as operational stability.
              </div>
            )}
          </>
        )}
      </div>

      <div className="card-base" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8', marginBottom: 6 }}>
              PHASE 3 OPERATIONAL INTELLIGENCE FOUNDATIONS
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: 760 }}>
              Evidence-based adversarial reasoning, scoring, correlation, exposure, cognitive stability, survivability and freeze governance. No fake realtime, no invented attack chains.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DataProvenanceBadge state={dataState} />
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(0,170,255,0.08)',
              color: 'var(--blue-info)',
              border: '1px solid rgba(0,170,255,0.25)',
              fontWeight: 800,
              letterSpacing: '1px',
              fontFamily: 'Syne, sans-serif',
              whiteSpace: 'nowrap',
            }}>
              EVIDENCE ONLY
            </span>
          </div>
        </div>
        {!verified ? (
          <OperationalNotice state={dataState} subject="phase 3 operational intelligence foundations" />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'EVIDENCE', value: phase3Evidence, sub: phase3Summary?.data_state ?? 'UNKNOWN', color: phase3Evidence ? 'var(--green-neon)' : 'var(--yellow-warn)' },
                { label: 'ADVERSARIAL', value: phase3Adversarial.confidence ?? 'UNKNOWN', sub: `${phase3Adversarial.attack_paths?.length ?? 0} path candidates`, color: phase3Adversarial.confidence === 'CONFIRMED' ? 'var(--red-alert)' : phase3Adversarial.confidence === 'SUSPICIOUS' ? 'var(--yellow-warn)' : 'var(--text-secondary)' },
                { label: 'SCORING', value: phase3Scoring.security_level ?? 'UNKNOWN', sub: phase3Scoring.score === null || phase3Scoring.score === undefined ? 'no score without evidence' : `score ${phase3Scoring.score} / confidence ${phase3Scoring.confidence}`, color: phase3Scoring.security_level === 'CRITICAL' || phase3Scoring.security_level === 'HIGH' ? 'var(--red-alert)' : phase3Scoring.security_level === 'MEDIUM' ? 'var(--yellow-warn)' : 'var(--green-neon)' },
                { label: 'CORRELATION', value: phase3Correlation.escalation?.state ?? 'UNKNOWN', sub: `${phase3Correlation.groups?.length ?? 0} grouped signals`, color: phase3Correlation.escalation?.state === 'OPERATIONAL_THREAT_CANDIDATE' ? 'var(--red-alert)' : 'var(--text-secondary)' },
                { label: 'EXPOSURE', value: phase3Exposure.classification_counts?.PUBLIC ?? 0, sub: 'public route inventory', color: 'var(--blue-info)' },
                { label: 'SURVIVABILITY', value: phase3Survivability.state ?? 'UNKNOWN', sub: 'fallback visibility', color: phase3Survivability.state === 'READY' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
                { label: 'FREEZE', value: phase3Freeze.freeze_status ?? 'UNKNOWN', sub: phase3Freeze.governance_escalation ?? 'pending', color: phase3Freeze.freeze_status === 'FREEZE_RECOMMENDED' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'CERTIFICATION', value: phase3Certification.classification ?? 'UNKNOWN', sub: 'not enterprise-grade', color: 'var(--green-neon)' },
              ].map(item => (
                <div key={item.label} style={{ border: '1px solid rgba(0,255,136,0.08)', borderRadius: 8, padding: 12, background: 'rgba(0,255,136,0.025)', minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 16, color: item.color, fontWeight: 900, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.35 }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.16)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>EXECUTIVE SUMMARY</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {phase3Cognition.executive_summary ?? 'No cognitive summary available without authenticated evidence.'}
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,184,0,0.18)', background: 'rgba(255,184,0,0.04)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>UNCERTAINTY</div>
                <div style={{ fontSize: 12, color: phase3Scoring.uncertainty_visible ? 'var(--yellow-warn)' : 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {phase3Scoring.uncertainty_visible ? 'Uncertainty visible: low or unknown evidence reduces confidence.' : 'Current evidence supports the displayed confidence level.'}
                </div>
              </div>
            </div>
            {phase3Evidence === 0 && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 8, border: '1px solid rgba(255,184,0,0.25)', background: 'rgba(255,184,0,0.06)', color: 'var(--yellow-warn)', fontSize: 12, lineHeight: 1.6 }}>
                INSUFFICIENT DATA: Phase 3 foundations are installed, but no stored runtime evidence exists yet. This must not be presented as operational readiness.
              </div>
            )}
          </>
        )}
      </div>

      <div className="card-base" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8', marginBottom: 6 }}>
              PHASE 4 RESILIENCE & DEGRADED RUNTIME HANDLING
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: 760 }}>
              Degraded mode, partial failure, recovery, integrity, dependency and rollback awareness. No fake uptime, no hidden degradation, no panic UI.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DataProvenanceBadge state={dataState} />
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(255,184,0,0.08)',
              color: 'var(--yellow-warn)',
              border: '1px solid rgba(255,184,0,0.25)',
              fontWeight: 800,
              letterSpacing: '1px',
              fontFamily: 'Syne, sans-serif',
              whiteSpace: 'nowrap',
            }}>
              NO FAKE UPTIME
            </span>
          </div>
        </div>
        {!phase4Ready ? (
          <div>
            <OperationalNotice state={dataState} subject="phase 4 resilience and degraded runtime handling" />
            {failedFetches.length > 0 && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                {failedFetches.slice(0, 6).map(item => (
                  <div key={item.label} style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,184,0,0.18)', background: 'rgba(255,184,0,0.04)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1 }}>{item.label.toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: 'var(--yellow-warn)', marginTop: 6, fontWeight: 800 }}>{item.state}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'RUNTIME', value: phase4Summary.classification ?? 'UNKNOWN', sub: `continuity ${phase4Summary.continuity_level ?? 'UNKNOWN'}`, color: phase4Summary.classification === 'STABLE' ? 'var(--green-neon)' : phase4Summary.classification === 'UNSTABLE' ? 'var(--red-alert)' : 'var(--yellow-warn)' },
                { label: 'FALLBACK', value: phase4Runtime.visible_fallback_state ?? 'UNKNOWN', sub: `${phase4Runtime.active_degradations?.length ?? 0} active degradations`, color: phase4Runtime.visible_fallback_state === 'STABLE' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
                { label: 'RECOVERY', value: phase4Recovery.recovery_state ?? 'UNKNOWN', sub: `confidence ${phase4Recovery.recovery_confidence ?? 'UNKNOWN'}`, color: phase4Recovery.recovery_state === 'STABLE' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
                { label: 'INTEGRITY', value: phase4Integrity.runtime_trust ?? 'UNKNOWN', sub: 'runtime trust validation', color: phase4Integrity.runtime_trust === 'TRUSTED' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
                { label: 'DEPENDENCIES', value: phase4Dependencies.dependency_survivability_impact ?? 'UNKNOWN', sub: `${phase4Dependencies.dependency_count ?? 0} dependencies`, color: phase4Dependencies.dependency_survivability_impact === 'HIGH' ? 'var(--red-alert)' : 'var(--blue-info)' },
                { label: 'ROLLBACK', value: phase4Rollback.rollback_risk ?? 'UNKNOWN', sub: `confidence ${phase4Rollback.rollback_confidence ?? 'UNKNOWN'}`, color: phase4Rollback.rollback_risk === 'HIGH' ? 'var(--red-alert)' : phase4Rollback.rollback_risk === 'MEDIUM' ? 'var(--yellow-warn)' : 'var(--green-neon)' },
                { label: 'CERTIFICATION', value: phase4Certification.classification ?? 'UNKNOWN', sub: 'not enterprise-grade', color: phase4Certification.classification === 'OPERATIONALLY_RESILIENT' ? 'var(--green-neon)' : 'var(--yellow-warn)' },
              ].map(item => (
                <div key={item.label} style={{ border: '1px solid rgba(0,255,136,0.08)', borderRadius: 8, padding: 12, background: 'rgba(0,255,136,0.025)', minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 16, color: item.color, fontWeight: 900, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.35 }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.16)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>ACTIVE DEGRADATION</div>
                <div style={{ fontSize: 12, color: phase4Runtime.active_degradations?.length ? 'var(--yellow-warn)' : 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {phase4Runtime.active_degradations?.length ? phase4Runtime.active_degradations.join(', ') : 'No active degradation from current evidence.'}
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.16)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>FALLBACK SUMMARY</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {phase4Fallback.operational_summaries?.[0]?.summary ?? 'Fallback state unavailable.'}
                </div>
              </div>
            </div>
            {failedFetches.length > 0 && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 8, border: '1px solid rgba(255,184,0,0.25)', background: 'rgba(255,184,0,0.06)', color: 'var(--yellow-warn)', fontSize: 12, lineHeight: 1.6 }}>
                PARTIAL OPERATION: {failedFetches.length} protected request(s) degraded. Centinela is preserving visibility without presenting fake normal operation.
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card-base" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8', marginBottom: 6 }}>
                HISTORICAL MEMORY & TEMPORAL CORRELATION
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Persisted normalized event memory. Repetition and confidence are evidence-based; no fabricated memory.
              </p>
            </div>
            <DataProvenanceBadge state={dataState} />
          </div>
          {!verified ? (
            <OperationalNotice state={dataState} subject="historical memory and temporal correlation" />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'MEMORY EVENTS', value: memoryEvidenceCount, color: memoryEvidenceCount > 0 ? 'var(--green-neon)' : 'var(--yellow-warn)' },
                  { label: 'REPEATED', value: repeatedEvents.length, color: repeatedEvents.length ? 'var(--yellow-warn)' : 'var(--text-secondary)' },
                  { label: 'ANOMALIES', value: recurringAnomalies.length, color: recurringAnomalies.length ? 'var(--red-alert)' : 'var(--text-secondary)' },
                  { label: 'DEGRADATION', value: recurringDegradation.length, color: recurringDegradation.length ? 'var(--yellow-warn)' : 'var(--text-secondary)' },
                ].map(item => (
                  <div key={item.label} style={{ border: '1px solid rgba(0,255,136,0.08)', borderRadius: 8, padding: 12, background: 'rgba(0,255,136,0.025)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>{item.label}</div>
                    <div style={{ fontSize: 22, color: item.color, fontWeight: 900, lineHeight: 1 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 8, marginBottom: 14 }}>
                {['UNKNOWN', 'LOW', 'MEDIUM', 'HIGH'].map(level => (
                  <div key={level} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.16)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>{level}</span>
                    <span style={{ fontSize: 12, color: level === 'HIGH' ? 'var(--red-alert)' : level === 'MEDIUM' ? 'var(--yellow-warn)' : 'var(--text-secondary)', fontWeight: 900 }}>{confidenceSummary[level] ?? 0}</span>
                  </div>
                ))}
              </div>
              {memoryEvidenceCount === 0 ? (
                <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,184,0,0.25)', background: 'rgba(255,184,0,0.06)', color: 'var(--yellow-warn)', fontSize: 12, lineHeight: 1.6 }}>
                  INSUFFICIENT DATA: historical memory is ready, but no persisted normalized events exist yet.
                </div>
              ) : repeatedEvents.length === 0 && recurringAnomalies.length === 0 && recurringDegradation.length === 0 ? (
                <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,255,136,0.12)', background: 'rgba(0,255,136,0.035)', color: 'var(--text-secondary)', fontSize: 12 }}>
                  No recurring patterns detected from current persisted evidence.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...recurringAnomalies, ...repeatedEvents, ...recurringDegradation].slice(0, 5).map((item: any, index: number) => (
                    <div key={`${item.type}-${index}`} style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(0,255,136,0.08)', background: 'rgba(0,0,0,0.16)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 800 }}>{item.type}</span>
                        <span style={{ fontSize: 10, color: item.confidence === 'HIGH' ? 'var(--red-alert)' : item.confidence === 'MEDIUM' ? 'var(--yellow-warn)' : 'var(--text-secondary)', fontWeight: 800 }}>{item.confidence}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {item.count} eventos · {item.key?.join(' / ') ?? 'unknown'} · {item.max_severity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="card-base" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: 12 }}>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8' }}>
              SECURITY SCORE POR SISTEMA
            </h2>
            <DataProvenanceBadge state={dataState} />
          </div>
          <OperationalNotice state={dataState} subject="security score by system" />
          {verified && sistemas.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin datos de agentes disponibles.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sistemas.map((s: any) => (
                <div key={s.nombre} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '90px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{s.nombre}</div>
                  <div className="threat-bar" style={{ flex: 1 }}>
                    <div className="threat-fill" style={{
                      width: `${s.score}%`,
                      background: s.score >= 90 ? 'var(--green-neon)' : s.score >= 75 ? 'var(--yellow-warn)' : 'var(--red-alert)',
                    }} />
                  </div>
                  <div style={{
                    width: '36px', fontSize: '12px', fontWeight: 700, textAlign: 'right',
                    color: s.score >= 90 ? 'var(--green-neon)' : s.score >= 75 ? 'var(--yellow-warn)' : 'var(--red-alert)',
                  }}>{s.score}</div>
                  <span className={`status-dot ${s.estado === 'live' ? 'status-live' : 'status-warning'}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-base" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: 12 }}>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8' }}>
              TIMELINE OPERACIONAL
            </h2>
            <DataProvenanceBadge state={dataState} />
          </div>
          <OperationalNotice state={dataState} subject="operational timeline" />
          {verified && timeline.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin eventos recientes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timeline.map((t: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  padding: '8px', borderRadius: '6px',
                  background: t.tipo === 'block' ? 'rgba(255,51,51,0.04)' : 'rgba(0,255,136,0.03)',
                }}>
                  <span style={{ fontSize: '10px', fontFamily: 'Courier New', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '1px' }}>
                    {t.tiempo}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: t.tipo === 'block' ? '#FF6666' : 'var(--text-primary)' }}>{t.evento}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.sistema}</div>
                  </div>
                  {t.tipo === 'block' && <span style={{ fontSize: '10px', color: 'var(--red-alert)' }}>BLOQ</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card-base" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8' }}>
            AMENAZAS RECIENTES
          </h2>
          <a href="/amenazas" style={{ fontSize: '12px', color: 'var(--green-neon)', textDecoration: 'none' }}>
            Ver todas
          </a>
        </div>
        {!verified ? (
          <OperationalNotice state={dataState} subject="recent threats" />
        ) : amenazasRecientes.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin amenazas recientes.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>ID</th>
                <th>TIPO</th>
                <th>SISTEMA</th>
                <th>SEVERIDAD</th>
                <th>TIEMPO</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {amenazasRecientes.map((a: any) => (
                <tr key={a.id}>
                  <td className="terminal-text">{a.id}</td>
                  <td style={{ fontSize: '13px' }}>{a.tipo}</td>
                  <td><span className="badge badge-gray">{a.sistema}</span></td>
                  <td>
                    <span className={`badge ${
                      a.severidad === 'CRITICAL' ? 'badge-red' :
                        a.severidad === 'HIGH' ? 'badge-yellow' : 'badge-blue'
                    }`}>{a.severidad}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{a.tiempo}</td>
                  <td>
                    <span className={`badge ${a.bloqueado ? 'badge-green' : 'badge-red'}`}>
                      {a.bloqueado ? 'BLOQUEADO' : 'ACTIVO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card-base" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8' }}>
            RESUMEN HISTORICO REAL
          </h2>
          <DataProvenanceBadge state={dataState} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Prompts analizados', valor: protectedValue(dataState, totalEvents), color: 'var(--green-neon)' },
            { label: 'Amenazas bloqueadas', valor: protectedValue(dataState, blockedEvents), color: 'var(--red-alert)' },
            { label: 'Eventos con amenaza', valor: protectedValue(dataState, threatEvents), color: 'var(--yellow-warn)' },
            { label: 'Incidentes abiertos', valor: protectedValue(dataState, totalIncidents), color: 'var(--red-alert)' },
            { label: 'Agentes monitoreados', valor: protectedValue(dataState, agentesActivos), color: 'var(--blue-info)' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(0,255,136,0.05)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.label}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: r.color }}>{r.valor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, color, sub, subColor, icon }: {
  label: string; value: string; unit?: string; color: string;
  sub: string; subColor: string; icon: string;
}) {
  return (
    <div className="metric-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
        <span className="metric-value" style={{ color }}>{value}</span>
        {unit && <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
      <div style={{ fontSize: '11px', color: subColor }}>{sub}</div>
    </div>
  );
}
