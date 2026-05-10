'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Runtime() {
  const [prompts, setPrompts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('TODOS');
  const [stats, setStats] = useState(null);
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
        const [dbStats, incidents] = await Promise.all([api.getDbStats(), api.getIncidents()]);
        setStats(dbStats);
        if (Array.isArray(incidents) && incidents.length > 0) {
          const mapped = incidents.slice(0, 50).map((inc) => ({
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
          }));
          setPrompts(mapped);
        }
      } catch(e) { setPrompts([]); } finally { setLoading(false); }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtrados = filter === 'TODOS' ? prompts : prompts.filter(p =>
    filter === 'BLOQUEADOS' ? p.decision === 'BLOQUEADO' : p.decision === 'PERMITIDO'
  );
  const totalEvents = stats ? (stats.total_events ?? 0) : 0;
  const blockedEvents = stats ? (stats.blocked_events ?? 0) : 0;
  const threatTypes = [...new Set(prompts.map(p => p.tipo).filter(t => t !== 'NORMAL'))];

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 className="font-syne" style={{ fontSize: '22px', fontWeight: 800, color: '#E8F5E8' }}>RUNTIME AI PROTECTION</h1>
          <span className="badge badge-green">ACTIVO</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Inspeccion runtime - Analisis contextual - Bloqueo automatico</p>
      </div>

      <div className="grid-metrics" style={{ marginBottom: '24px' }}>
        {[
          { label: 'EVENTOS TOTALES', value: totalEvents > 0 ? String(totalEvents) : '-', color: 'var(--green-neon)', sub: 'Historico real PostgreSQL' },
          { label: 'BLOQUEADOS', value: blockedEvents > 0 ? String(blockedEvents) : '-', color: 'var(--red-alert)', sub: totalEvents > 0 ? Math.round((blockedEvents/totalEvents)*100)+'% del total' : 'Sin datos' },
          { label: 'INCIDENTES', value: prompts.length > 0 ? String(prompts.length) : '-', color: 'var(--blue-info)', sub: 'Ultimos incidentes reales' },
          { label: 'AMENAZAS UNICAS', value: threatTypes.length > 0 ? String(threatTypes.length) : '-', color: 'var(--yellow-warn)', sub: threatTypes.slice(0,2).join(', ') || 'Sin datos' },
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
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, color: '#E8F5E8' }}>INCIDENT FEED - DATOS REALES</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['TODOS','BLOQUEADOS','PERMITIDOS'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', border: 'none', background: filter===f ? 'var(--green-neon)' : 'rgba(0,255,136,0.08)', color: filter===f ? '#050A05' : 'var(--text-secondary)' }}>{f}</button>
              ))}
            </div>
          </div>
          {loading && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Cargando datos reales...</div>}
          {!loading && filtrados.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Sin incidentes. Envia prompts via SDK PLUMA para generar datos reales.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filtrados.map(p => (
              <div key={p.id} onClick={() => setSelected(p)} style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid ' + (selected && selected.id===p.id ? 'var(--green-neon)' : 'rgba(0,255,136,0.08)'), background: selected && selected.id===p.id ? 'rgba(0,255,136,0.05)' : p.decision==='BLOQUEADO' ? 'rgba(255,51,51,0.04)' : 'rgba(0,255,136,0.02)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="terminal-text" style={{ fontSize: '11px' }}>{p.id}</span>
                    <span className="badge badge-gray" style={{ fontSize: '10px' }}>{p.sistema}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: p.score>=70 ? 'var(--red-alert)' : p.score>=40 ? 'var(--yellow-warn)' : 'var(--green-neon)' }}>RISK: {p.score}</span>
                    <span className={'badge '+(p.decision==='BLOQUEADO' ? 'badge-red' : 'badge-green')} style={{ fontSize: '10px' }}>{p.decision}</span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Courier New' }}>{p.prompt}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span className={'badge '+(p.tipo==='JAILBREAK'||p.tipo==='PROMPT_INJECTION' ? 'badge-red' : p.tipo==='DATA_EXFIL'||p.tipo==='PROMPT_LEAK' ? 'badge-yellow' : p.tipo==='NORMAL' ? 'badge-green' : 'badge-blue')} style={{ fontSize: '9px' }}>{p.tipo}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Courier New' }}>{p.tiempo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base" style={{ padding: '20px' }}>
          <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, color: '#E8F5E8', marginBottom: '16px' }}>DETALLE INCIDENTE</h2>
          {selected ? (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: selected.decision==='BLOQUEADO' ? 'rgba(255,51,51,0.08)' : 'rgba(0,255,136,0.08)', border: '1px solid '+(selected.decision==='BLOQUEADO' ? 'rgba(255,51,51,0.3)' : 'rgba(0,255,136,0.3)') }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>DECISION RUNTIME</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: selected.decision==='BLOQUEADO' ? 'var(--red-alert)' : 'var(--green-neon)' }}>{selected.decision}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {[{label:'ID',valor:selected.id},{label:'Sistema',valor:selected.sistema},{label:'Tipo',valor:selected.tipo},{label:'Severidad',valor:selected.severity},{label:'Timestamp',valor:selected.tiempo}].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,255,136,0.05)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{item.valor}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RISK SCORE</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: selected.score>=70 ? 'var(--red-alert)' : 'var(--yellow-warn)' }}>{selected.score}/100</span>
                </div>
                <div className="threat-bar"><div className="threat-fill" style={{ width: selected.score+'%', background: selected.score>=70 ? 'var(--red-alert)' : selected.score>=40 ? 'var(--yellow-warn)' : 'var(--green-neon)' }} /></div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>DESCRIPCION</div>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,255,136,0.08)', fontSize: '12px', fontFamily: 'Courier New', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.prompt}</div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '13px' }}>Selecciona un incidente para ver el detalle</div>
            </div>
          )}
        </div>
      </div>

      <div className="card-base" style={{ padding: '20px' }}>
        <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, color: '#E8F5E8', marginBottom: '16px' }}>RESUMEN DE AMENAZAS</h2>
        {threatTypes.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sin amenazas registradas aun.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {threatTypes.map(tipo => {
              const count = prompts.filter(p => p.tipo===tipo).length;
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
