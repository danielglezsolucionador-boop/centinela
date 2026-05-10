'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const rc = (r) => r >= 8 ? '#FF3333' : r >= 6 ? '#FF8800' : r >= 4 ? '#FFD700' : '#00FF88';
const sc = (s) => s >= 80 ? '#00FF88' : s >= 65 ? '#FFD700' : s >= 50 ? '#FF8800' : '#FF3333';
const stc = { CRITICAL:'#FF3333', HIGH:'#FF8800', MEDIUM:'#FFD700', LOW:'#00FF88', PASS:'#00FF88', WARN:'#FFD700', FAIL:'#FF3333' };

export default function Reporte() {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('overview');

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
        const [dbStats, incData, riskData] = await Promise.all([
          api.getDbStats(),
          api.getIncidents(),
          api.getEcosystemRisk(),
        ]);
        setStats(dbStats);
        setIncidents(Array.isArray(incData) ? incData : []);
        setRisk(riskData);
      } catch(e) {} finally { setLoading(false); }
    }
    load();
  }, []);

  const totalEvents = stats?.total_events ?? 0;
  const threatEvents = stats?.threat_events ?? 0;
  const blockedEvents = stats?.blocked_events ?? 0;
  const totalIncidents = stats?.total_incidents ?? 0;
  const secScore = totalEvents > 0 ? Math.max(0, Math.round(100 - (threatEvents/totalEvents)*100)) : null;
  const agentCount = risk?.agents ? Object.keys(risk.agents).length : 0;

  const criticalInc = incidents.filter(i => i.severity === 'CRITICAL').length;
  const highInc = incidents.filter(i => i.severity === 'HIGH').length;
  const avgRisk = incidents.length > 0 ? (incidents.reduce((a,i) => a + (i.risk_score ?? 0), 0) / incidents.length).toFixed(1) : null;

  const threatTypeCounts = {};
  incidents.forEach(i => (i.threat_types || []).forEach(t => { threatTypeCounts[t] = (threatTypeCounts[t] || 0) + 1; }));
  const topThreats = Object.entries(threatTypeCounts).sort((a,b) => b[1]-a[1]).slice(0,5);

  const agentRisks = risk?.agents
    ? Object.entries(risk.agents).map(([name, data]) => ({ agent: name.toUpperCase(), risk: data.score ?? 0, status: data.score >= 70 ? 'CRITICAL' : data.score >= 40 ? 'HIGH' : 'LOW' })).sort((a,b) => b.risk-a.risk)
    : [];

  const sections = ['overview','risks','threats'];

  return (
    <div style={{ background:'#050A05', minHeight:'100vh', color:'white', fontFamily:'Plus Jakarta Sans,sans-serif', padding:'32px' }}>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'#E8F5E8', margin:0 }}>SECURITY REPORT</h1>
          <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:'rgba(0,255,136,0.1)', color:'#00FF88', fontWeight:700 }}>DATOS REALES</span>
        </div>
        <p style={{ fontSize:'13px', color:'#4A5568', margin:0 }}>Reporte generado desde PostgreSQL en tiempo real</p>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'24px' }}>
        {sections.map(s => (
          <button key={s} onClick={() => setSection(s)} style={{ padding:'8px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:600, background:section===s ? '#00FF88' : 'rgba(255,255,255,0.05)', color:section===s ? '#050A05' : '#4A5568' }}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <div style={{ color:'#4A5568', textAlign:'center', padding:48 }}>Cargando datos reales...</div>}

      {!loading && section === 'overview' && (
        <div>
          {totalEvents === 0 ? (
            <div style={{ color:'#4A5568', textAlign:'center', padding:48, border:'1px solid #1a1a1a', borderRadius:8 }}>
              Sin datos disponibles. Envia prompts via SDK PLUMA para generar datos reales.
            </div>
          ) : (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'24px' }}>
                {[
                  { label:'SECURITY SCORE', value: secScore !== null ? secScore+'/100' : '—', color: secScore !== null ? sc(secScore) : '#666' },
                  { label:'TOTAL EVENTOS', value: String(totalEvents), color:'#00AAFF' },
                  { label:'BLOQUEADOS', value: String(blockedEvents), color:'#FF3333' },
                  { label:'INCIDENTES', value: String(totalIncidents), color:'#FF8800' },
                ].map((s,i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'20px' }}>
                    <div style={{ fontSize:'10px', color:'#4A5568', marginBottom:'8px', letterSpacing:'1px' }}>{s.label}</div>
                    <div style={{ fontSize:'28px', fontWeight:800, color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'24px' }}>
                {[
                  { label:'CRITICOS', value: String(criticalInc), color:'#FF3333' },
                  { label:'HIGH', value: String(highInc), color:'#FF8800' },
                  { label:'RIESGO PROMEDIO', value: avgRisk !== null ? avgRisk : '—', color:'#FFD700' },
                ].map((s,i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'16px' }}>
                    <div style={{ fontSize:'10px', color:'#4A5568', marginBottom:'6px', letterSpacing:'1px' }}>{s.label}</div>
                    <div style={{ fontSize:'22px', fontWeight:800, color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'20px' }}>
                <div style={{ fontSize:'11px', color:'#00FF88', letterSpacing:'2px', marginBottom:'16px' }}>ULTIMOS INCIDENTES</div>
                {incidents.slice(0,5).map((inc,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize:'12px', color:'#E2E8F0' }}>{inc.id}</span>
                    <span style={{ fontSize:'12px', color:'#4A5568' }}>{inc.agent ?? '—'}</span>
                    <span style={{ fontSize:'11px', color:stc[inc.severity]||'#666' }}>{inc.severity ?? '—'}</span>
                    <span style={{ fontSize:'11px', color:inc.policy_action==='BLOCK'?'#FF3333':'#00FF88' }}>{inc.policy_action ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && section === 'risks' && (
        <div>
          {agentRisks.length === 0 ? (
            <div style={{ color:'#4A5568', textAlign:'center', padding:48, border:'1px solid #1a1a1a', borderRadius:8 }}>Sin datos de riesgo por agente disponibles.</div>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'20px' }}>
              <div style={{ fontSize:'11px', color:'#00FF88', letterSpacing:'2px', marginBottom:'16px' }}>RIESGO POR AGENTE — DATOS REALES</div>
              {agentRisks.map((a,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:'13px', fontWeight:600, width:'120px' }}>{a.agent}</span>
                  <div style={{ flex:1, height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'3px' }}>
                    <div style={{ height:'100%', width:Math.min(a.risk,100)+'%', background:rc(a.risk/10), borderRadius:'3px' }} />
                  </div>
                  <span style={{ fontSize:'12px', fontWeight:700, color:rc(a.risk/10), width:'40px', textAlign:'right' }}>{Math.round(a.risk)}</span>
                  <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:stc[a.status]+'22', color:stc[a.status] }}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && section === 'threats' && (
        <div>
          {topThreats.length === 0 ? (
            <div style={{ color:'#4A5568', textAlign:'center', padding:48, border:'1px solid #1a1a1a', borderRadius:8 }}>Sin amenazas registradas aun.</div>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'20px' }}>
              <div style={{ fontSize:'11px', color:'#00FF88', letterSpacing:'2px', marginBottom:'16px' }}>TIPOS DE AMENAZA — DATOS REALES</div>
              {topThreats.map(([tipo, count],i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:'13px', fontWeight:600, width:'180px' }}>{tipo}</span>
                  <div style={{ flex:1, height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'3px' }}>
                    <div style={{ height:'100%', width:Math.min((count/incidents.length)*100,100)+'%', background:'#FF3333', borderRadius:'3px' }} />
                  </div>
                  <span style={{ fontSize:'12px', fontWeight:700, color:'#FF3333', width:'40px', textAlign:'right' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
