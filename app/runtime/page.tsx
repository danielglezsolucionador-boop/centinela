'use client';

import { useState, useEffect } from 'react';
import { api, ensureToken } from '@/lib/api';

export default function Runtime() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [detectionStats, setDetectionStats] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      await ensureToken();
      setLoading(true);
      const timeout = setTimeout(() => setWaking(true), 5000);
      try {
        const [inc, det, db] = await Promise.all([
          api.getIncidents(),
          api.getDetectionStats(),
          api.getDbStats(),
        ]);
        setIncidents(Array.isArray(inc) ? inc : []);
        setDetectionStats(det);
        setDbStats(db);
        setWaking(false);
      } catch (e) {
        setWaking(true);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (s: string) => s === 'CRITICAL' ? 'var(--red-alert)' : s === 'HIGH' ? 'var(--red-alert)' : s === 'MEDIUM' ? 'var(--yellow-warn)' : 'var(--green-neon)';
  const getActionBadge = (a: string) => a === 'BLOCK' ? 'badge-red' : a === 'RESTRICT' ? 'badge-yellow' : a === 'WARN' ? 'badge-yellow' : 'badge-green';

  const filtrados = filter === 'TODOS' ? incidents : incidents.filter(i =>
    filter === 'BLOQUEADOS' ? i.policy_action === 'BLOCK' :
    filter === 'RESTRINGIDOS' ? i.policy_action === 'RESTRICT' :
    i.severity === filter
  );

  const GUARDRAILS = [
    { nombre: 'Prompt Injection', key: 'PROMPT_INJECTION' },
    { nombre: 'Jailbreak Detector', key: 'JAILBREAK' },
    { nombre: 'Data Exfiltration', key: 'DATA_EXFILTRATION' },
    { nombre: 'System Extraction', key: 'SYSTEM_EXTRACTION' },
    { nombre: 'Role Manipulation', key: 'ROLE_MANIPULATION' },
    { nombre: 'PII Leakage', key: 'PII_LEAKAGE' },
    { nombre: 'Tool Abuse', key: 'TOOL_ABUSE' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{waking ? 'Runtime waking up...' : 'Loading...'}</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 className="font-syne" style={{ fontSize: '22px', fontWeight: 800, color: '#E8F5E8' }}>RUNTIME AI PROTECTION</h1>
          <span className="badge badge-green">ACTIVO</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Inspeccion runtime de prompts - Analisis contextual - Bloqueo automatico en tiempo real</p>
      </div>

      <div className="grid-metrics" style={{ marginBottom: '24px' }}>
        {[
          { label: 'TOTAL EVENTOS', value: dbStats?.total_events ?? '—', color: 'var(--green-neon)', sub: 'Procesados en total' },
          { label: 'BLOQUEADOS', value: dbStats?.blocked_events ?? '—', color: 'var(--red-alert)', sub: 'Amenazas detenidas' },
          { label: 'AMENAZAS', value: dbStats?.threat_events ?? '—', color: 'var(--yellow-warn)', sub: 'Detectadas en total' },
          { label: 'INCIDENTES', value: dbStats?.total_incidents ?? '—', color: 'var(--red-alert)', sub: 'Incidentes activos' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>{m.label}</div>
            <div className="metric-value" style={{ color: m.color, marginBottom: '6px' }}>{m.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', marginBottom: '24px' }}>
        <div className="card-base" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8' }}>INCIDENT FEED</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['TODOS', 'BLOQUEADOS', 'RESTRINGIDOS'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', border: 'none', background: filter === f ? 'var(--green-neon)' : 'rgba(0,255,136,0.08)', color: filter === f ? '#050A05' : 'var(--text-secondary)' }}>{f}</button>
              ))}
            </div>
          </div>
          {filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>No hay incidentes</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtrados.slice(0, 20).map(inc => (
                <div key={inc.id} onClick={() => setSelected(inc)} style={{ padding: '12px 14px', borderRadius: '8px', border: 1px solid , background: selected?.id === inc.id ? 'rgba(0,255,136,0.05)' : inc.policy_action === 'BLOCK' ? 'rgba(255,51,51,0.04)' : 'rgba(0,255,136,0.02)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="terminal-text" style={{ fontSize: '11px' }}>{inc.id}</span>
                      <span className="badge badge-gray" style={{ fontSize: '10px' }}>{inc.agent?.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: getSeverityColor(inc.severity) }}>RISK: {Math.round(inc.risk_score)}</span>
                      <span className={adge } style={{ fontSize: '10px' }}>{inc.policy_action}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span className="badge badge-gray" style={{ fontSize: '9px' }}>{inc.severity}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Courier New' }}>{new Date(inc.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-base" style={{ padding: '20px' }}>
          <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8', marginBottom: '16px' }}>DETALLE INCIDENTE</h2>
          {selected ? (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: selected.policy_action === 'BLOCK' ? 'rgba(255,51,51,0.08)' : 'rgba(0,255,136,0.08)', border: 1px solid  }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>DECISION</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: selected.policy_action === 'BLOCK' ? 'var(--red-alert)' : 'var(--green-neon)' }}>{selected.policy_action}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'ID', valor: selected.id },
                  { label: 'Agente', valor: selected.agent },
                  { label: 'Usuario', valor: selected.user },
                  { label: 'Severidad', valor: selected.severity },
                  { label: 'Estado', valor: selected.status },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,255,136,0.05)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{item.valor}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RISK SCORE</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: getSeverityColor(selected.severity) }}>{Math.round(selected.risk_score)}/100</span>
                </div>
                <div className="threat-bar">
                  <div className="threat-fill" style={{ width: ${Math.min(selected.risk_score, 100)}%, background: getSeverityColor(selected.severity) }} />
                </div>
              </div>
              {selected.threat_types?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>TIPOS DE AMENAZA</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selected.threat_types.map((t: string) => <span key={t} className="badge badge-red" style={{ fontSize: '9px' }}>{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
              <div style={{ fontSize: '13px' }}>Selecciona un incidente para ver el detalle</div>
            </div>
          )}
        </div>
      </div>

      <div className="card-base" style={{ padding: '20px' }}>
        <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8', marginBottom: '16px' }}>RUNTIME GUARDRAILS — ESTADO</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {GUARDRAILS.map(g => {
            const count = detectionStats?.by_type?.[g.key] ?? 0;
            return (
              <div key={g.key} style={{ padding: '14px', borderRadius: '8px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="status-dot status-live" />
                  <span className={adge } style={{ fontSize: '9px' }}>{count > 0 ? 'ACTIVO' : 'LIMPIO'}</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>{g.nombre}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ color: count > 0 ? 'var(--red-alert)' : 'var(--green-neon)', fontWeight: 700 }}>{count}</span> detectados
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
