'use client';

import { useEffect, useState } from 'react';
import { DataProvenanceBadge, DataState, OperationalNotice, classifyDataState, isVerifiedData, protectedValue } from '@/components/OperationalState';
import { api, ensureToken } from '@/lib/api';

type PromptRow = {
  id: string;
  tiempo: string;
  sistema: string;
  prompt: string;
  score: number;
  decision: string;
  tipo: string;
  severity: string;
};

export default function Runtime() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [selected, setSelected] = useState<PromptRow | null>(null);
  const [filter, setFilter] = useState('TODOS');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataState, setDataState] = useState<DataState>('loading');

  useEffect(() => {
    async function load() {
      try {
        await ensureToken();
        const [dbStats, incidents] = await Promise.all([api.getDbStats(), api.getIncidents()]);
        setStats(dbStats);
        setPrompts(Array.isArray(incidents) ? incidents.slice(0, 50).map((inc: any) => ({
          id: inc.id ?? 'N/A',
          tiempo: inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : '--',
          sistema: inc.agent ? inc.agent.toUpperCase() : 'UNKNOWN',
          prompt: inc.threat_types && inc.threat_types.length > 0
            ? 'Amenaza: ' + inc.threat_types.join(', ') + ' - agente ' + (inc.agent ?? 'unknown')
            : 'Evento en agente ' + (inc.agent ?? 'unknown'),
          score: Math.round(inc.risk_score ?? 0),
          decision: inc.policy_action === 'BLOCK' ? 'BLOQUEADO' : 'PERMITIDO',
          tipo: (inc.threat_types && inc.threat_types[0]) ? inc.threat_types[0] : 'NORMAL',
          severity: inc.severity ?? 'LOW',
        })) : []);
        setDataState('verified');
      } catch (error) {
        setPrompts([]);
        setStats(null);
        setDataState(classifyDataState(error));
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const verified = isVerifiedData(dataState);
  const filtrados = verified
    ? (filter === 'TODOS' ? prompts : prompts.filter(p => filter === 'BLOQUEADOS' ? p.decision === 'BLOQUEADO' : p.decision === 'PERMITIDO'))
    : [];
  const totalEvents = verified ? stats?.total_events ?? 0 : 0;
  const blockedEvents = verified ? stats?.blocked_events ?? 0 : 0;
  const threatTypes = verified ? [...new Set(prompts.map(p => p.tipo).filter(t => t !== 'NORMAL'))] : [];

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <h1 className="font-syne" style={{ fontSize: '22px', fontWeight: 800, color: '#E8F5E8' }}>RUNTIME AI PROTECTION</h1>
          <DataProvenanceBadge state="live_runtime" />
          <DataProvenanceBadge state={dataState} />
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Inspeccion runtime - analisis contextual - {verified ? 'data autenticada' : 'data protegida no verificada'}
        </p>
      </div>

      <div className="grid-metrics" style={{ marginBottom: '24px' }}>
        {[
          { label: 'EVENTOS TOTALES', value: protectedValue(dataState, totalEvents), color: 'var(--green-neon)', sub: verified ? 'Historico real PostgreSQL' : 'Protected metric' },
          { label: 'BLOQUEADOS', value: protectedValue(dataState, blockedEvents), color: 'var(--red-alert)', sub: verified && totalEvents > 0 ? Math.round((blockedEvents / totalEvents) * 100) + '% del total' : dataState === 'auth_required' ? 'AUTH REQUIRED' : 'DATA UNAVAILABLE' },
          { label: 'INCIDENTES', value: protectedValue(dataState, prompts.length), color: 'var(--blue-info)', sub: verified ? 'Ultimos incidentes reales' : 'Protected metric' },
          { label: 'AMENAZAS UNICAS', value: protectedValue(dataState, threatTypes.length), color: 'var(--yellow-warn)', sub: verified ? (threatTypes.slice(0, 2).join(', ') || 'Sin datos') : 'Protected metric' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>{m.label}</div>
            <div className="metric-value" style={{ color: m.color, marginBottom: '6px' }}>{m.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 340px)', gap: '16px', marginBottom: '24px' }}>
        <div className="card-base" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: 12, flexWrap: 'wrap' }}>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, color: '#E8F5E8' }}>INCIDENT FEED - DATOS REALES</h2>
            <DataProvenanceBadge state={dataState} />
            <div style={{ display: 'flex', gap: '6px' }}>
              {['TODOS', 'BLOQUEADOS', 'PERMITIDOS'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', border: 'none', background: filter === f ? 'var(--green-neon)' : 'rgba(0,255,136,0.08)', color: filter === f ? '#050A05' : 'var(--text-secondary)' }}>{f}</button>
              ))}
            </div>
          </div>
          {loading && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Cargando datos reales...</div>}
          {!loading && !verified && <OperationalNotice state={dataState} subject="runtime incidents feed" />}
          {!loading && verified && filtrados.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Sin incidentes. Envia prompts via SDK PLUMA para generar datos reales.</div>}
          {verified && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtrados.map(p => (
                <div key={p.id} onClick={() => setSelected(p)} style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid ' + (selected && selected.id === p.id ? 'var(--green-neon)' : 'rgba(0,255,136,0.08)'), background: selected && selected.id === p.id ? 'rgba(0,255,136,0.05)' : p.decision === 'BLOQUEADO' ? 'rgba(255,51,51,0.04)' : 'rgba(0,255,136,0.02)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="terminal-text" style={{ fontSize: '11px' }}>{p.id}</span>
                      <span className="badge badge-gray" style={{ fontSize: '10px' }}>{p.sistema}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: p.score >= 70 ? 'var(--red-alert)' : p.score >= 40 ? 'var(--yellow-warn)' : 'var(--green-neon)' }}>RISK: {p.score}</span>
                      <span className={'badge ' + (p.decision === 'BLOQUEADO' ? 'badge-red' : 'badge-green')} style={{ fontSize: '10px' }}>{p.decision}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Courier New' }}>{p.prompt}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-base" style={{ padding: '20px' }}>
          <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, color: '#E8F5E8', marginBottom: '16px' }}>DETALLE INCIDENTE</h2>
          {!verified ? (
            <OperationalNotice state={dataState} subject="incident detail" />
          ) : selected ? (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: selected.decision === 'BLOQUEADO' ? 'rgba(255,51,51,0.08)' : 'rgba(0,255,136,0.08)', border: '1px solid ' + (selected.decision === 'BLOQUEADO' ? 'rgba(255,51,51,0.3)' : 'rgba(0,255,136,0.3)') }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>DECISION RUNTIME</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: selected.decision === 'BLOQUEADO' ? 'var(--red-alert)' : 'var(--green-neon)' }}>{selected.decision}</div>
              </div>
              {[{ label: 'ID', valor: selected.id }, { label: 'Sistema', valor: selected.sistema }, { label: 'Tipo', valor: selected.tipo }, { label: 'Severidad', valor: selected.severity }, { label: 'Timestamp', valor: selected.tiempo }].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,255,136,0.05)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{item.valor}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '13px' }}>Selecciona un incidente para ver el detalle</div>
            </div>
          )}
        </div>
      </div>

      <div className="card-base" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, color: '#E8F5E8' }}>RESUMEN DE AMENAZAS</h2>
          <DataProvenanceBadge state={dataState} />
        </div>
        {!verified ? (
          <OperationalNotice state={dataState} subject="threat summary" />
        ) : threatTypes.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sin amenazas registradas aun.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {threatTypes.map(tipo => {
              const count = prompts.filter(p => p.tipo === tipo).length;
              return (
                <div key={tipo} style={{ padding: '14px', borderRadius: '8px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{tipo}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}><span style={{ color: 'var(--red-alert)', fontWeight: 700 }}>{count}</span> incidentes</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
