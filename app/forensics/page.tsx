'use client';
import { useState, useEffect } from 'react';
import { api, ensureToken } from '@/lib/api';

export default function Forensics() {
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await ensureToken();
        const incidents = await api.getIncidents();
        if (Array.isArray(incidents) && incidents.length > 0) {
          const mapped = incidents.map((inc) => ({
            id: inc.id,
            title: inc.threat_types && inc.threat_types.length > 0
              ? inc.threat_types.join(' + ') + ' detectado'
              : 'Evento registrado',
            severity: inc.severity ?? 'LOW',
            agent: inc.agent ?? 'unknown',
            user: inc.user ?? 'unknown',
            time: inc.created_at ? new Date(inc.created_at).toLocaleString() : '--',
            status: inc.policy_action === 'BLOCK' ? 'BLOCKED' : 'MONITORED',
            riskScore: inc.risk_score ?? 0,
            threat_types: inc.threat_types ?? [],
            policy_action: inc.policy_action ?? 'ALLOW',
            event_id: inc.event_id ?? null,
          }));
          setCases(mapped);
          setSelected(mapped[0] ?? null);
        }
      } catch(e) { setCases([]); } finally { setLoading(false); }
    }
    load();
  }, []);

  const severityColor = { CRITICAL: '#FF3333', HIGH: '#FF8800', MEDIUM: '#FFD700', LOW: '#00FF88' };
  const statusColor = { BLOCKED: '#FF3333', MONITORED: '#00AAFF', INVESTIGATING: '#FFD700' };

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 className="font-syne" style={{ fontSize: '22px', fontWeight: 800, color: '#E8F5E8' }}>FORENSICS</h1>
          <span className="badge badge-green">DATOS REALES</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Analisis forense de incidentes reales desde PostgreSQL</p>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 48 }}>Cargando incidentes...</div>}

      {!loading && cases.length === 0 && (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 48, border: '1px solid #222', borderRadius: 8 }}>
          Sin incidentes forenses. Envia prompts via SDK PLUMA para generar datos reales.
        </div>
      )}

      {!loading && cases.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cases.map(c => (
              <div key={c.id} onClick={() => setSelected(c)} style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid ' + (selected && selected.id===c.id ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.06)'), background: selected && selected.id===c.id ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#4A5568', fontFamily: 'monospace' }}>{c.id}</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: (severityColor[c.severity]||'#666')+'22', color: severityColor[c.severity]||'#666' }}>{c.severity}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0', marginBottom: '4px', lineHeight: 1.3 }}>{c.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#4A5568' }}>{c.agent}</span>
                  <span style={{ fontSize: '10px', color: statusColor[c.status]||'#666' }}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '6px' }}>CASO FORENSE</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#E2E8F0' }}>{selected.title}</div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '6px', background: (severityColor[selected.severity]||'#666')+'22', color: severityColor[selected.severity]||'#666', fontWeight: 700 }}>{selected.severity}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'RISK SCORE', value: String(Math.round(selected.riskScore)), color: selected.riskScore >= 70 ? '#FF3333' : selected.riskScore >= 40 ? '#FF8800' : '#00FF88' },
                    { label: 'AGENTE', value: selected.agent, color: '#00AAFF' },
                    { label: 'ESTADO', value: selected.status, color: statusColor[selected.status]||'#666' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '10px', color: '#4A5568', marginBottom: '4px' }}>{s.label}</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#4A5568', marginBottom: '8px' }}>TIPOS DE AMENAZA</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selected.threat_types.length > 0 ? selected.threat_types.map(t => (
                      <span key={t} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(255,51,51,0.1)', color: '#FF6666', border: '1px solid rgba(255,51,51,0.2)' }}>{t}</span>
                    )) : <span style={{ fontSize: '12px', color: '#4A5568' }}>Sin amenazas detectadas</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4A5568', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span>Usuario: {selected.user}</span>
                  <span>Timestamp: {selected.time}</span>
                  <span>Accion: {selected.policy_action}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '16px' }}>RISK SCORE VISUAL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(selected.riskScore, 100)+'%', background: selected.riskScore >= 70 ? '#FF3333' : selected.riskScore >= 40 ? '#FF8800' : '#00FF88', borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: selected.riskScore >= 70 ? '#FF3333' : selected.riskScore >= 40 ? '#FF8800' : '#00FF88', minWidth: '48px', textAlign: 'right' }}>{Math.round(selected.riskScore)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
