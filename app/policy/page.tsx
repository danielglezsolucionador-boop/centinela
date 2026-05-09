'use client';
import { useState, useEffect } from 'react';
import { api, ensureToken } from '@/lib/api';

const actionColor: Record<string, string> = { BLOCK:'#FF3333', WARN:'#FFD700', ALERT:'#FF8800', RESTRICT:'#FF8800' };
const threatColor = '#FF3333';

export default function PolicyEngine() {
  const [policies, setPolicies] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      await ensureToken();
      const timeout = setTimeout(() => setWaking(true), 5000);
      try {
        const data = await api.getPolicyStats();
        setPolicies(data && typeof data === 'object' ? data : {});
        const keys = Object.keys(data ?? {});
        if (keys.length) setSelected(keys[0]);
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

  const policyList = Object.entries(policies);
  const selectedPolicy = selected ? policies[selected] : null;

  return (
    <div className="animate-fadeIn">
      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'6px'}}>
          <h1 className="font-syne" style={{fontSize:'22px',fontWeight:800,color:'#E8F5E8'}}>AI POLICY ENGINE</h1>
          <span className="badge badge-green">ACTIVO</span>
        </div>
        <p style={{fontSize:'13px',color:'var(--text-secondary)'}}>Governance, compliance y enforcement por agente</p>
      </div>

      <div className="grid-metrics" style={{marginBottom:'24px'}}>
        {[
          {label:'POLITICAS ACTIVAS',  value: policyList.length,                                                          color:'var(--green-neon)'},
          {label:'BLOQUEO TOTAL',      value: policyList.filter(([,p])=>p.action_on_violation==='BLOCK').length,          color:'var(--red-alert)'},
          {label:'WARN',               value: policyList.filter(([,p])=>p.action_on_violation==='WARN').length,           color:'var(--yellow-warn)'},
          {label:'AMENAZAS CUBIERTAS', value: [...new Set(policyList.flatMap(([,p])=>p.blocked_threat_types??[]))].length, color:'var(--green-neon)'},
        ].map((m,i) => (
          <div key={i} className="metric-card">
            <div style={{fontSize:'10px',fontWeight:700,color:'var(--text-muted)',letterSpacing:'1px',marginBottom:'10px'}}>{m.label}</div>
            <div className="metric-value" style={{color:m.color,marginBottom:'6px'}}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:'16px'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {policyList.map(([name, pol]) => (
            <div key={name} onClick={() => setSelected(name)} style={{padding:'12px 14px',borderRadius:'8px',border:1px solid ,background:selected===name?'rgba(0,255,136,0.05)':'rgba(0,255,136,0.02)',cursor:'pointer',transition:'all 0.15s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                <span style={{fontSize:'13px',fontWeight:700,color:'var(--text-primary)'}}>{name}</span>
                <span style={{fontSize:'9px',padding:'2px 6px',borderRadius:'4px',background:${actionColor[pol.action_on_violation]??'#FFD700'}15,color:actionColor[pol.action_on_violation]??'#FFD700'}}>{pol.action_on_violation}</span>
              </div>
              <div style={{fontSize:'10px',color:'var(--text-muted)'}}>Max risk: {pol.max_risk_score} · {pol.blocked_threat_types?.length??0} amenazas</div>
            </div>
          ))}
        </div>

        {selectedPolicy ? (
          <div className="card-base" style={{padding:'24px'}}>
            <div style={{fontSize:'11px',color:'var(--green-neon)',letterSpacing:'2px',marginBottom:'20px',fontFamily:'Syne,sans-serif',fontWeight:700}}>POLICY — {selected}</div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'20px'}}>
              {[
                {label:'Accion',         valor: selectedPolicy.action_on_violation, color: actionColor[selectedPolicy.action_on_violation]??'#FFD700'},
                {label:'Max Risk Score', valor: selectedPolicy.max_risk_score,       color:'var(--red-alert)'},
                {label:'Alert Threshold',valor: selectedPolicy.alert_threshold,      color:'var(--yellow-warn)'},
                {label:'Max Prompt Len', valor: selectedPolicy.max_prompt_length,    color:'var(--text-secondary)'},
              ].map((item,i) => (
                <div key={i} style={{background:'rgba(0,255,136,0.02)',border:'1px solid rgba(0,255,136,0.08)',borderRadius:'8px',padding:'12px'}}>
                  <div style={{fontSize:'10px',color:'var(--text-muted)',marginBottom:'4px'}}>{item.label}</div>
                  <div style={{fontSize:'16px',fontWeight:800,color:item.color,fontFamily:'Syne,sans-serif'}}>{item.valor}</div>
                </div>
              ))}
            </div>

            <div style={{marginBottom:'20px'}}>
              <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'10px',letterSpacing:'1px'}}>MODELOS PERMITIDOS</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                {selectedPolicy.allowed_models?.map((m: string, i: number) => (
                  <span key={i} style={{fontSize:'11px',padding:'4px 10px',borderRadius:'6px',background:'rgba(0,170,255,0.1)',color:'#00AAFF',border:'1px solid rgba(0,170,255,0.2)'}}>{m}</span>
                ))}
              </div>
            </div>

            <div>
              <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'10px',letterSpacing:'1px'}}>AMENAZAS BLOQUEADAS</div>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {selectedPolicy.blocked_threat_types?.map((t: string, i: number) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',borderRadius:'6px',background:'rgba(255,51,51,0.04)',border:'1px solid rgba(255,51,51,0.1)'}}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:threatColor}}/>
                    <span style={{fontSize:'12px',color:'var(--text-secondary)'}}>{t.replace(/_/g,' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card-base" style={{padding:'24px',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:'13px',color:'var(--text-muted)'}}>Selecciona una politica</div>
          </div>
        )}
      </div>
    </div>
  );
}
