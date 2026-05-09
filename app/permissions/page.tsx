'use client';
import { useState, useEffect } from 'react';
import { api, ensureToken } from '@/lib/api';

const levelColor: Record<string, string> = { READ:'#00AAFF', WRITE:'#FFD700', EXECUTE:'#FF8800', API:'#A855F7', ADMIN:'#FF3333' };
const statusColor: Record<string, string> = { ACTIVE:'#00FF88', MONITORED:'#FFD700', ISOLATED:'#FF8800', BLOCKED:'#FF3333', SUSPICIOUS:'#FF8800', NORMAL:'#00FF88' };

export default function Permissions() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      await ensureToken();
      const timeout = setTimeout(() => setWaking(true), 5000);
      try {
        const ag = await api.getAgentMap();
        setAgents(Array.isArray(ag) ? ag : []);
        if (ag?.length) setSelected(ag[0].name);
        setWaking(false);
      } catch { setWaking(true); }
      finally { clearTimeout(timeout); setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:'16px'}}>
      <div style={{fontSize:'13px',color:'var(--text-muted)'}}>{waking?'Runtime waking up...':'Loading...'}</div>
    </div>
  );

  const agent = agents.find(a => a.name === selected);

  return (
    <div className="animate-fadeIn">
      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'6px'}}>
          <h1 className="font-syne" style={{fontSize:'22px',fontWeight:800,color:'#E8F5E8'}}>AGENT PERMISSIONS</h1>
          <span className="badge badge-green">ACTIVO</span>
        </div>
        <p style={{fontSize:'13px',color:'var(--text-secondary)'}}>Control de permisos y herramientas por agente</p>
      </div>

      <div className="grid-metrics" style={{marginBottom:'24px'}}>
        {[
          {label:'AGENTES TOTALES',    value: agents.length,                                                    color:'var(--green-neon)'},
          {label:'ACTIVOS',            value: agents.filter(a=>a.status==='NORMAL').length,                     color:'var(--green-neon)'},
          {label:'SUSPICIOUS',         value: agents.filter(a=>a.status==='SUSPICIOUS').length,                 color:'var(--yellow-warn)'},
          {label:'BLOQUEADOS',         value: agents.filter(a=>a.status==='BLOCKED').length,                    color:'var(--red-alert)'},
        ].map((m,i) => (
          <div key={i} className="metric-card">
            <div style={{fontSize:'10px',fontWeight:700,color:'var(--text-muted)',letterSpacing:'1px',marginBottom:'10px'}}>{m.label}</div>
            <div className="metric-value" style={{color:m.color,marginBottom:'6px'}}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:'24px'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {agents.map(a => (
            <div key={a.name} onClick={() => setSelected(a.name)} style={{background:selected===a.name?'rgba(0,255,136,0.05)':'rgba(0,255,136,0.02)',border:1px solid ,borderRadius:'10px',padding:'14px 16px',cursor:'pointer',transition:'all 0.15s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'13px',fontWeight:700,color:'var(--text-primary)'}}>{a.name}</span>
                <span style={{fontSize:'9px',padding:'2px 6px',borderRadius:'4px',background:${statusColor[a.status]??'#00FF88'}15,color:statusColor[a.status]??'#00FF88'}}>{a.status}</span>
              </div>
              <div style={{fontSize:'11px',color:'var(--text-muted)',marginTop:'4px'}}>{a.total_events} eventos · {a.anomalies} anomalias</div>
            </div>
          ))}
        </div>

        {agent ? (
          <div className="card-base" style={{padding:'24px'}}>
            <div style={{fontSize:'11px',color:'var(--green-neon)',letterSpacing:'2px',marginBottom:'20px',fontFamily:'Syne,sans-serif',fontWeight:700}}>HERRAMIENTAS PERMITIDAS — {agent.name}</div>
            {agent.allowed_tools?.length > 0 ? (
              <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'24px'}}>
                {agent.allowed_tools.map((tool: string, i: number) => (
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(0,255,136,0.03)',border:'1px solid rgba(0,255,136,0.1)',borderRadius:'8px',padding:'12px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#00FF88'}}/>
                      <span style={{fontSize:'13px',fontWeight:600,color:'var(--text-primary)'}}>{tool.replace(/_/g,' ')}</span>
                    </div>
                    <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'4px',background:'rgba(0,255,136,0.1)',color:'#00FF88'}}>GRANTED</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'20px',color:'var(--text-muted)',fontSize:'13px'}}>No hay herramientas configuradas</div>
            )}

            <div style={{fontSize:'11px',color:'var(--green-neon)',letterSpacing:'2px',marginBottom:'12px',fontFamily:'Syne,sans-serif',fontWeight:700}}>CAPACIDADES</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'24px'}}>
              {agent.capabilities?.map((cap: string, i: number) => (
                <span key={i} style={{fontSize:'11px',padding:'4px 10px',borderRadius:'6px',background:'rgba(0,170,255,0.1)',color:'#00AAFF',border:'1px solid rgba(0,170,255,0.2)'}}>{cap}</span>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              {[
                {label:'Status',       valor: agent.status,        color: statusColor[agent.status]??'#00FF88'},
                {label:'Total Events', valor: agent.total_events,  color:'#00AAFF'},
                {label:'Anomalias',    valor: agent.anomalies,     color: agent.anomalies>0?'#FF8800':'#00FF88'},
                {label:'Avg Risk',     valor: Math.round(agent.avg_risk), color: agent.avg_risk>=70?'#FF3333':agent.avg_risk>=40?'#FF8800':'#00FF88'},
              ].map((item,i) => (
                <div key={i} style={{background:'rgba(0,255,136,0.02)',border:'1px solid rgba(0,255,136,0.08)',borderRadius:'8px',padding:'12px'}}>
                  <div style={{fontSize:'10px',color:'var(--text-muted)',marginBottom:'4px'}}>{item.label}</div>
                  <div style={{fontSize:'16px',fontWeight:800,color:item.color,fontFamily:'Syne,sans-serif'}}>{item.valor}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card-base" style={{padding:'24px',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:'13px',color:'var(--text-muted)'}}>Selecciona un agente</div>
          </div>
        )}
      </div>
    </div>
  );
}
