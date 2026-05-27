'use client';
import { useState, useEffect } from 'react';
import { api, ensureToken } from '@/lib/api';
import { classifyDataState, DataProvenanceBadge, DataState, isVerifiedData, OperationalNotice, protectedValue } from '@/components/OperationalState';

const PLAYBOOKS: any[] = [];

const severityColor: Record<string, string> = { CRITICAL: '#FF3333', HIGH: '#FF8800', MEDIUM: '#FFD700', LOW: '#00FF88' };
const statusColor: Record<string, string> = { EXECUTED: '#00FF88', ACTIVE: '#00AAFF', PENDING: '#FFD700', FAILED: '#FF3333' };
const typeIcon: Record<string, string> = { AUTO_BLOCK: 'X', ISOLATE: 'ISO', RATE_LIMIT: 'RL', ALERT: '!', PERMISSION_REVOKE: 'REV' };

function mapIncidentToAction(inc: any, idx: number) {
  const types = inc.threat_types || [];
  let type = 'ALERT';
  if (types.includes('JAILBREAK') || types.includes('PROMPT_INJECTION')) type = 'AUTO_BLOCK';
  else if (types.includes('DATA_EXFIL') || types.includes('PROMPT_LEAK')) type = 'ISOLATE';
  else if (types.includes('ROLE_MANIPULATION')) type = 'PERMISSION_REVOKE';

  const d = new Date(inc.created_at);
  const time = d.toTimeString().slice(0, 8);

  return {
    id: inc.id || `R${String(idx + 1).padStart(3, '0')}`,
    agent: inc.agent || 'unknown',
    type,
    severity: inc.severity || 'MEDIUM',
    trigger: types.length > 0 ? types.join(', ') : 'Amenaza detectada',
    status: inc.policy_action === 'BLOCK' ? 'EXECUTED' : inc.status === 'OPEN' ? 'PENDING' : 'ACTIVE',
    time,
    duration: inc.policy_action === 'BLOCK' ? '0.3s' : 'ongoing',
    details: `Agente: ${inc.agent || 'unknown'}. Riesgo: ${inc.risk_score ?? 0}. Accion: ${inc.policy_action || 'MONITOR'}.`,
  };
}

export default function ResponsePage() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<'actions' | 'playbooks'>('actions');
  const [dataState, setDataState] = useState<DataState>('loading');

  useEffect(() => {
    async function load() {
      try {
        await ensureToken();
        const incidents = await api.getIncidents();
        if (incidents && incidents.length > 0) {
          setActions(incidents.map(mapIncidentToAction));
        } else {
          setActions([]);
        }
        setDataState('verified');
      } catch (error) {
        setActions([]);
        setDataState(classifyDataState(error));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = {
    total: actions.length,
    executed: actions.filter(a => a.status === 'EXECUTED').length,
    pending: actions.filter(a => a.status === 'PENDING').length,
    critical: actions.filter(a => a.severity === 'CRITICAL').length,
  };
  const verified = isVerifiedData(dataState);

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'monospace', padding: '32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#00FF88', fontSize: 28, margin: 0 }}>RESPONSE CENTER</h1>
        <div style={{ marginTop: 8 }}><DataProvenanceBadge state={dataState} /></div>
        <p style={{ color: '#666', margin: '4px 0 0' }}>Acciones automaticas e incidentes reales</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL ACCIONES', value: protectedValue(dataState, stats.total), color: '#00AAFF' },
          { label: 'EJECUTADAS', value: protectedValue(dataState, stats.executed), color: '#00FF88' },
          { label: 'PENDIENTES', value: protectedValue(dataState, stats.pending), color: '#FFD700' },
          { label: 'CRITICAS', value: protectedValue(dataState, stats.critical), color: '#FF3333' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 16 }}>
            <div style={{ color: '#666', fontSize: 11, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: 28, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('actions')} style={{ background: tab === 'actions' ? '#00FF88' : '#111', color: tab === 'actions' ? '#000' : '#fff', border: '1px solid #333', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace' }}>
          ACCIONES ({actions.length})
        </button>
        <button onClick={() => setTab('playbooks')} style={{ background: tab === 'playbooks' ? '#00FF88' : '#111', color: tab === 'playbooks' ? '#000' : '#fff', border: '1px solid #333', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace' }}>
          PLAYBOOKS ({PLAYBOOKS.length})
        </button>
      </div>

      {tab === 'actions' && (
        <div>
          {loading && <div style={{ color: '#666', padding: 32, textAlign: 'center' }}>Cargando acciones...</div>}
          {!loading && !verified && <OperationalNotice state={dataState} subject="response actions" />}
          {!loading && verified && actions.length === 0 && (
            <div style={{ color: '#666', padding: 32, textAlign: 'center', border: '1px solid #222', borderRadius: 8 }}>
              Sin acciones registradas. Envia prompts via SDK PLUMA para generar incidentes.
            </div>
          )}
          {!loading && verified && actions.map(action => (
            <div key={action.id} onClick={() => setSelected(selected?.id === action.id ? null : action)}
              style={{ background: '#111', border: `1px solid ${selected?.id === action.id ? '#00FF88' : '#222'}`, borderRadius: 8, padding: 16, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: '#666', fontSize: 12 }}>{action.id}</span>
                  <span style={{ color: severityColor[action.severity] || '#fff', fontWeight: 700 }}>{action.severity}</span>
                  <span style={{ color: '#00AAFF' }}>{action.agent}</span>
                  <span style={{ color: '#fff' }}>{action.type}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: statusColor[action.status] || '#fff', fontSize: 12 }}>{action.status}</span>
                  <span style={{ color: '#666', fontSize: 12 }}>{action.time}</span>
                </div>
              </div>
              {selected?.id === action.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #222' }}>
                  <div style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>Trigger: {action.trigger}</div>
                  <div style={{ color: '#ccc', fontSize: 13 }}>{action.details}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'playbooks' && (
        <div>
          {PLAYBOOKS.map(pb => (
            <div key={pb.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 16, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{ color: '#00FF88', fontWeight: 700, marginRight: 12 }}>{pb.name}</span>
                  <span style={{ color: '#666', fontSize: 12 }}>Trigger: {pb.trigger}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: '#00FF88', fontSize: 12 }}>{pb.status}</span>
                  <span style={{ color: '#666', fontSize: 12 }}>x{pb.executions}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {pb.actions.map((a: string) => (
                  <span key={a} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#aaa' }}>{a}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && tab === 'actions' && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#111', border: '1px solid #00FF88', borderRadius: 8, padding: 16, minWidth: 280 }}>
          <div style={{ color: '#00FF88', fontWeight: 700, marginBottom: 8 }}>ACCION SELECCIONADA</div>
          <div style={{ color: '#aaa', fontSize: 13 }}>{selected.id} — {selected.agent}</div>
          <div style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>{selected.details}</div>
          <button onClick={() => setSelected(null)} style={{ marginTop: 12, background: 'transparent', border: '1px solid #666', color: '#666', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace' }}>CERRAR</button>
        </div>
      )}
    </div>
  );
}
