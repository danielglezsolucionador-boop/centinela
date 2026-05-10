'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const levelColor: Record<string, string> = {
  READ: '#00AAFF', WRITE: '#FFD700', EXECUTE: '#FF8800', API: '#A855F7', ADMIN: '#FF3333',
};
const statusColor: Record<string, string> = {
  ACTIVE: '#00FF88', MONITORED: '#FFD700', ISOLATED: '#FF8800', BLOCKED: '#FF3333',
};
const actionColor: Record<string, string> = {
  GRANTED: '#00FF88', REVOKED: '#FF3333', RESTRICTED: '#FFD700', 'BLOCKED ALL': '#FF3333', BLOCK: '#FF3333', ALLOW: '#00FF88', MONITOR: '#FFD700',
};

export default function Permissions() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'audit'>('matrix');
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [agentMap, setAgentMap] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('centinela_token');
        if (!token) {
          const res = await fetch('https://centinela-backend-kzwk.onrender.com/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'daniel', password: 'centinela24' }),
          });
          const data = await res.json();
          if (data.access_token) localStorage.setItem('centinela_token', data.access_token);
        }
        const incidents = await api.getIncidents();
        if (incidents && incidents.length > 0) {
          const log = incidents.map((inc: any) => ({
            time: new Date(inc.created_at).toTimeString().slice(0, 8),
            agent: inc.agent || 'unknown',
            action: inc.policy_action || 'MONITOR',
            permission: (inc.threat_types || []).join(', ') || 'N/A',
            reason: `Riesgo: ${inc.risk_score ?? 0} — ${inc.severity || 'MEDIUM'}`,
            by: 'CENTINELA AUTO',
          }));
          setAuditLog(log);

          const map: Record<string, any> = {};
          incidents.forEach((inc: any) => {
            const name = inc.agent || 'unknown';
            if (!map[name]) {
              map[name] = {
                name,
                status: inc.policy_action === 'BLOCK' ? 'BLOCKED' : inc.severity === 'CRITICAL' ? 'ISOLATED' : 'MONITORED',
                events: [],
              };
            }
            map[name].events.push(inc);
          });
          setAgentMap(map);
          const first = Object.keys(map)[0];
          if (first) setSelected(first);
        }
      } catch (e) {
        setAuditLog([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const agents = Object.values(agentMap);
  const agent = agentMap[selected];

  const stats = {
    active: auditLog.filter(l => l.action === 'ALLOW').length,
    revoked: auditLog.filter(l => l.action === 'BLOCK').length,
    changes: auditLog.length,
    restricted: agents.filter((a: any) => a.status !== 'ACTIVE').length,
  };

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 12px #00FF88' }} />
          <span style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '3px', fontWeight: 700 }}>PERMISSION SYSTEM — CONTROL TOTAL</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #00FF88, #00AAFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Agent Permissions
        </h1>
        <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '4px' }}>Control granular basado en incidentes reales de PostgreSQL</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Acciones ALLOW', value: stats.active, color: '#00FF88' },
          { label: 'Acciones BLOCK', value: stats.revoked, color: '#FF3333' },
          { label: 'Eventos totales', value: stats.changes, color: '#FFD700' },
          { label: 'Agentes restringidos', value: stats.restricted, color: '#FF8800' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['matrix', 'audit'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: activeTab === tab ? '#00FF88' : 'rgba(255,255,255,0.05)', color: activeTab === tab ? '#050A05' : '#4A5568' }}>
            {tab === 'matrix' ? 'Agentes' : 'Audit Log'}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#666', textAlign: 'center', padding: 32 }}>Cargando datos reales...</div>}

      {!loading && activeTab === 'matrix' && (
        <div>
          {agents.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: 32, border: '1px solid #222', borderRadius: 8 }}>
              Sin agentes registrados. Envia prompts via SDK PLUMA para generar datos reales.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {agents.map((a: any) => (
                  <div key={a.name} onClick={() => setSelected(a.name)} style={{ background: selected === a.name ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected === a.name ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{a.name}</span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: `${statusColor[a.status] || '#666'}15`, color: statusColor[a.status] || '#666' }}>{a.status}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '4px' }}>{a.events.length} eventos registrados</div>
                  </div>
                ))}
              </div>
              {agent && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '20px' }}>EVENTOS — {agent.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {agent.events.slice(0, 10).map((ev: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: ev.policy_action === 'BLOCK' ? 'rgba(255,51,51,0.03)' : 'rgba(0,255,136,0.03)', border: `1px solid ${ev.policy_action === 'BLOCK' ? 'rgba(255,51,51,0.1)' : 'rgba(0,255,136,0.1)'}`, borderRadius: '10px', padding: '12px 16px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{ev.id}</div>
                          <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '2px' }}>{(ev.threat_types || []).join(', ') || 'Sin amenaza'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#4A5568' }}>Score: {ev.risk_score ?? 0}</span>
                          <span style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '6px', fontWeight: 600, background: ev.policy_action === 'BLOCK' ? 'rgba(255,51,51,0.1)' : 'rgba(0,255,136,0.1)', color: ev.policy_action === 'BLOCK' ? '#FF3333' : '#00FF88' }}>{ev.policy_action || 'MONITOR'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'audit' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '20px' }}>AUDIT LOG — HISTORIAL REAL</div>
          {auditLog.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: 32 }}>Sin eventos registrados.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {auditLog.map((log, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', color: '#4A5568', fontFamily: 'monospace', flexShrink: 0 }}>{log.time}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>{log.agent}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${actionColor[log.action] || '#666'}15`, color: actionColor[log.action] || '#666', flexShrink: 0 }}>{log.action}</span>
                  <span style={{ fontSize: '12px', color: '#A855F7', fontFamily: 'monospace', flexShrink: 0 }}>{log.permission}</span>
                  <span style={{ fontSize: '11px', color: '#4A5568', flex: 1 }}>{log.reason}</span>
                  <span style={{ fontSize: '11px', color: '#4A5568', flexShrink: 0 }}>by {log.by}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
