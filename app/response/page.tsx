'use client';
import { useState, useEffect } from 'react';
import { api, ensureToken } from '@/lib/api';

const severityColor: Record<string, string> = { CRITICAL:'#FF3333', HIGH:'#FF8800', MEDIUM:'#FFD700', LOW:'#00FF88', MINIMAL:'#00FF88' };
const statusColor: Record<string, string> = { OPEN:'#FF3333', RESOLVED:'#00FF88', INVESTIGATING:'#FFD700' };

export default function Response() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<'incidents'|'anomalies'>('incidents');
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      await ensureToken();
      const timeout = setTimeout(() => setWaking(true), 5000);
      try {
        const [inc, ano] = await Promise.all([api.getIncidents(), api.getAgentAnomalies()]);
        setIncidents(Array.isArray(inc) ? inc : []);
        setAnomalies(Array.isArray(ano) ? ano : []);
        setWaking(false);
      } catch { setWaking(true); }
      finally { clearTimeout(timeout); setLoading(false); }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:'16px'}}>
      <div style={{fontSize:'13px',color:'var(--text-muted)'}}>{waking?'Runtime waking up...':'Loading...'}</div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'6px'}}>
          <h1 className="font-syne" style={{fontSize:'22px',fontWeight:800,color:'#E8F5E8'}}>RESPONSE ENGINE</h1>
          <span className="badge badge-green">ACTIVO</span>
        </div>
        <p style={{fontSize:'13px',color:'var(--text-secondary)'}}>Acciones automaticas y anomalias detectadas en tiempo real</p>
      </div>

      <div className="grid-metrics" style={{marginBottom:'24px'}}>
        {[
          {label:'INCIDENTES ABIERTOS', value: incidents.filter(i=>i.status==='OPEN').length, color:'var(--red-alert)'},
          {label:'TOTAL INCIDENTES',    value: incidents.length,                               color:'var(--yellow-warn)'},
          {label:'ANOMALIAS',           value: anomalies.length,                               color:'var(--red-alert)'},
          {label:'CRITICOS',            value: incidents.filter(i=>i.severity==='CRITICAL').length, color:'var(--red-alert)'},
        ].map((m,i) => (
          <div key={i} className="metric-card">
            <div style={{fontSize:'10px',fontWeight:700,color:'var(--text-muted)',letterSpacing:'1px',marginBottom:'10px'}}>{m.label}</div>
            <div className="metric-value" style={{color:m.color,marginBottom:'6px'}}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
        {(['incidents','anomalies'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{padding:'6px 16px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'11px',fontWeight:700,background:tab===t?'var(--green-neon)':'rgba(0,255,136,0.08)',color:tab===t?'#050A05':'var(--text-secondary)',textTransform:'uppercase'}}>
            {t === 'incidents' ? Incidentes () : Anomalias ()}
          </button>
        ))}
      </div>

      {tab === 'incidents' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'16px'}}>
          <div className="card-base" style={{padding:'20px'}}>
            <h2 className="font-syne" style={{fontSize:'13px',fontWeight:700,letterSpacing:'1px',color:'#E8F5E8',marginBottom:'16px'}}>INCIDENT LOG</h2>
            {incidents.length === 0 ? (
              <div style={{textAlign:'center',padding:'40px',color:'var(--text-muted)',fontSize:'13px'}}>No hay incidentes</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {incidents.slice(0,30).map(inc => (
                  <div key={inc.id} onClick={() => setSelected(inc)} style={{padding:'12px 14px',borderRadius:'8px',border:1px solid ,background:selected?.id===inc.id?'rgba(0,255,136,0.05)':'rgba(0,255,136,0.02)',cursor:'pointer',transition:'all 0.15s'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span className="terminal-text" style={{fontSize:'11px'}}>{inc.id}</span>
                        <span className="badge badge-gray" style={{fontSize:'10px'}}>{inc.agent?.toUpperCase()}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{fontSize:'11px',fontWeight:700,color:severityColor[inc.severity]??'#00FF88'}}>{inc.severity}</span>
                        <span className="badge badge-gray" style={{fontSize:'9px',color:statusColor[inc.status]??'#00FF88'}}>{inc.status}</span>
                      </div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <span style={{fontSize:'10px',color:'var(--text-muted)'}}>Risk: {Math.round(inc.risk_score)}</span>
                      <span style={{fontSize:'10px',color:'var(--text-muted)',fontFamily:'Courier New'}}>{new Date(inc.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-base" style={{padding:'20px'}}>
            <h2 className="font-syne" style={{fontSize:'13px',fontWeight:700,letterSpacing:'1px',color:'#E8F5E8',marginBottom:'16px'}}>DETALLE</h2>
            {selected ? (
              <div>
                {[
                  {label:'ID',       valor:selected.id},
                  {label:'Agente',   valor:selected.agent},
                  {label:'Usuario',  valor:selected.user},
                  {label:'Severidad',valor:selected.severity},
                  {label:'Accion',   valor:selected.policy_action},
                  {label:'Estado',   valor:selected.status},
                  {label:'Risk',     valor:Math.round(selected.risk_score)},
                ].map(item => (
                  <div key={item.label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(0,255,136,0.05)'}}>
                    <span style={{fontSize:'11px',color:'var(--text-muted)'}}>{item.label}</span>
                    <span style={{fontSize:'12px',color:'var(--text-primary)',fontWeight:600}}>{item.valor}</span>
                  </div>
                ))}
                {selected.threat_types?.length > 0 && (
                  <div style={{marginTop:'12px'}}>
                    <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'6px'}}>AMENAZAS</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                      {selected.threat_types.map((t:string) => <span key={t} className="badge badge-red" style={{fontSize:'9px'}}>{t}</span>)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'40px',color:'var(--text-muted)',fontSize:'13px'}}>Selecciona un incidente</div>
            )}
          </div>
        </div>
      )}

      {tab === 'anomalies' && (
        <div className="card-base" style={{padding:'20px'}}>
          <h2 className="font-syne" style={{fontSize:'13px',fontWeight:700,letterSpacing:'1px',color:'#E8F5E8',marginBottom:'16px'}}>ANOMALIAS DETECTADAS</h2>
          {anomalies.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px',color:'var(--text-muted)',fontSize:'13px'}}>No hay anomalias</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {anomalies.map((a,i) => (
                <div key={i} style={{padding:'14px 16px',borderRadius:'8px',border:1px solid 30,background:'rgba(0,255,136,0.02)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,color:severityColor[a.severity]??'#FFD700'}}>{a.severity}</span>
                      <span className="badge badge-gray" style={{fontSize:'10px'}}>{a.agent}</span>
                    </div>
                    <span style={{fontSize:'10px',color:'var(--text-muted)',fontFamily:'Courier New'}}>{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{fontSize:'12px',color:'var(--text-secondary)'}}>{a.type.replace(/_/g,' ')}</div>
                  <div style={{fontSize:'11px',color:'var(--text-muted)',marginTop:'4px'}}>{a.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
