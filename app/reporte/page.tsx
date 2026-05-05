'use client';
import { useState, useEffect } from 'react';

const PERIODS = ['Last 7 days', 'Last 30 days', 'Last Quarter', 'Last Year'] as const;
type Period = typeof PERIODS[number];

const DATA: Record<Period, {
  secScore: number; compScore: number; threats: number; mitigated: number;
  critical: number; high: number; prompts: number; leaks: number; avgRisk: number;
  trend: 'improving' | 'stable' | 'degrading';
}> = {
  'Last 7 days':   { secScore: 74, compScore: 81, threats: 48,   mitigated: 43,  critical: 3,   high: 11,  prompts: 12840,  leaks: 2,  avgRisk: 6.4, trend: 'improving' },
  'Last 30 days':  { secScore: 68, compScore: 76, threats: 193,  mitigated: 171, critical: 11,  high: 44,  prompts: 54120,  leaks: 9,  avgRisk: 7.1, trend: 'stable'    },
  'Last Quarter':  { secScore: 62, compScore: 70, threats: 584,  mitigated: 497, critical: 32,  high: 128, prompts: 162840, leaks: 24, avgRisk: 7.8, trend: 'degrading' },
  'Last Year':     { secScore: 71, compScore: 79, threats: 2341, mitigated: 2198,critical: 118, high: 512, prompts: 654000, leaks: 89, avgRisk: 6.9, trend: 'improving' },
};

const TIMELINE = [
  { w: 'W1', risk: 8.2, detected: 14, blocked: 12 },
  { w: 'W2', risk: 7.8, detected: 11, blocked: 10 },
  { w: 'W3', risk: 9.1, detected: 18, blocked: 15 },
  { w: 'W4', risk: 6.4, detected: 5,  blocked: 5  },
];

const TOP_RISKS = [
  { agent: 'SUNAT API',    risk: 8.8, cat: 'Unauthorized Access', status: 'CRITICAL', delta: '+2.1' },
  { agent: 'MCF',          risk: 8.1, cat: 'API Abuse',           status: 'CRITICAL', delta: '+1.2' },
  { agent: 'Cerebro',      risk: 7.9, cat: 'Prompt Injection',    status: 'HIGH',     delta: '-0.3' },
  { agent: 'PLUMA',        risk: 7.4, cat: 'Data Leakage',        status: 'HIGH',     delta: '+0.8' },
  { agent: 'Laboratorio',  risk: 6.4, cat: 'Tool Abuse',          status: 'MEDIUM',   delta: '-0.5' },
  { agent: 'Sniff Amazon', risk: 4.8, cat: 'Rate Limit',          status: 'LOW',      delta: '+0.1' },
];

const COMPLIANCE = [
  { label: 'AI Governance Policy',    score: 91, status: 'PASS' },
  { label: 'Data Residency Controls', score: 78, status: 'PASS' },
  { label: 'Prompt Audit Trail',      score: 85, status: 'PASS' },
  { label: 'Agent Permission Audit',  score: 67, status: 'WARN' },
  { label: 'PII Leak Prevention',     score: 54, status: 'FAIL' },
  { label: 'Incident Response SLA',   score: 82, status: 'PASS' },
  { label: 'Model Usage Governance',  score: 73, status: 'PASS' },
  { label: 'Tool-Call Whitelisting',  score: 61, status: 'WARN' },
];

const RECS = [
  { p: 'P1', title: 'Patch SUNAT API exposure vector',          detail: 'MCF agent tiene llamadas salientes sin restricción a SUNAT. Implementar allowlist estricto y rate limits inmediatamente.', impact: 'CRITICAL', effort: 'LOW'    },
  { p: 'P1', title: 'Deploy PII scanner en outputs de Cerebro', detail: 'PII prevention score en 54%. Desplegar scanner inline antes de que respuestas lleguen a agentes downstream.',             impact: 'HIGH',     effort: 'MEDIUM' },
  { p: 'P2', title: 'Revisar scope de permisos de agentes',     detail: 'PLUMA y Cerebro tienen permisos de tool-call solapados. Auditar y restringir a modelo least-privilege.',                    impact: 'HIGH',     effort: 'LOW'    },
  { p: 'P2', title: 'Habilitar correlación cross-agent',        detail: 'Sin reglas de correlación entre Laboratorio y Cerebro. Riesgo de prompt injection encadenado no detectado.',               impact: 'MEDIUM',   effort: 'MEDIUM' },
  { p: 'P3', title: 'Implementar tool-call whitelisting',       detail: 'Buscador y Sniff tienen invocación abierta. Whitelistear firmas de herramientas aprobadas por agente.',                    impact: 'MEDIUM',   effort: 'LOW'    },
];

const ATTACK_TYPES = [
  { type: 'Prompt Injection',  count: 18, pct: 37 },
  { type: 'Jailbreak Attempt', count: 11, pct: 23 },
  { type: 'Tool Abuse',        count: 9,  pct: 19 },
  { type: 'Data Exfiltration', count: 6,  pct: 12 },
  { type: 'Role Manipulation', count: 4,  pct: 9  },
];

const rc = (r: number) => r >= 8 ? '#FF3333' : r >= 6 ? '#FF8800' : r >= 4 ? '#FFD700' : '#00FF88';
const sc = (s: number) => s >= 80 ? '#00FF88' : s >= 65 ? '#FFD700' : s >= 50 ? '#FF8800' : '#FF3333';
const stc: Record<string, string> = { CRITICAL:'#FF3333', HIGH:'#FF8800', MEDIUM:'#FFD700', LOW:'#00FF88', PASS:'#00FF88', WARN:'#FFD700', FAIL:'#FF3333' };
const trendC: Record<string, string> = { improving:'#00FF88', stable:'#FFD700', degrading:'#FF3333' };
const trendI: Record<string, string> = { improving:'▲ IMPROVING', stable:'→ STABLE', degrading:'▼ DEGRADING' };

function Gauge({ value, label }: { value: number; label: string }) {
  const r = 38; const cx = 55; const cy = 55;
  const circ = 2 * Math.PI * r;
  const arc = (value / 100) * circ * 0.75;
  const off = circ * 0.125;
  const c = sc(value);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A2A1A" strokeWidth="6"
          strokeDasharray={`${circ*0.75} ${circ*0.25}`} strokeDashoffset={-off} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth="6"
          strokeDasharray={`${arc} ${circ-arc}`} strokeDashoffset={-off} strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 6px ${c})` }}/>
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize="18" fontWeight="800" fill={c} fontFamily="Syne,sans-serif">{value}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fontSize="9" fill="#3A5A40" fontFamily="Syne,sans-serif">/100</text>
      </svg>
      <span style={{ fontSize:'9px', fontFamily:'Syne,sans-serif', color:'#7A9A80', letterSpacing:'1px', textAlign:'center' }}>{label}</span>
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ height:'4px', background:'#1A2A1A', borderRadius:'2px', width:'100%' }}>
      <div style={{ height:'100%', width:`${Math.min(100,(value/max)*100)}%`, background:color, borderRadius:'2px', boxShadow:`0 0 4px ${color}80` }}/>
    </div>
  );
}

type Section = 'overview' | 'risks' | 'compliance' | 'recommendations';

export default function Reporte() {
  const [period, setPeriod] = useState<Period>('Last 7 days');
  const [section, setSection] = useState<Section>('overview');
  const [exporting, setExporting] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const d = DATA[period];
  const maxDet = Math.max(...TIMELINE.map(t => t.detected));

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch('/api/incidents');
        if (res.ok) {
          const data = await res.json();
          if (data?.length) setIsLive(true);
        }
      } catch (e) {}
    }
    cargar();
  }, []);

  function handleExport() {
    setExporting(true);
    setTimeout(() => setExporting(false), 2200);
  }

  return (
    <div style={{ background:'#050A05', minHeight:'100vh', color:'white', fontFamily:'Plus Jakarta Sans,sans-serif', display:'grid', gridTemplateRows:'48px auto 1fr' }}>

      {/* Topbar */}
      <div style={{ background:'#0A110A', borderBottom:'1px solid #1A2A1A', display:'flex', alignItems:'center', padding:'0 20px', gap:'16px' }}>
        <span style={{ fontFamily:'Syne,sans-serif', fontSize:'15px', fontWeight:800, color:'#00FF88', letterSpacing:'2px' }}>CENTINELA</span>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#3A5A40' }}>
          <span>REPORTE</span><span>/</span>
          <span style={{ color:'#7A9A80' }}>Executive Security Layer</span>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: isLive ? '#00FF88' : '#3A5A40', boxShadow: isLive ? '0 0 8px #00FF88' : 'none', animation: isLive ? 'pulse 2s infinite' : 'none' }}/>
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:'11px', color:'#7A9A80', letterSpacing:'1px' }}>{isLive ? 'BACKEND LIVE' : 'LIVE REPORT'}</span>
        </div>
      </div>

      {/* Subheader */}
      <div style={{ background:'#0A110A', borderBottom:'1px solid #1A2A1A', display:'flex', alignItems:'center', padding:'8px 20px', gap:'8px', flexWrap:'wrap' }}>
        <span style={{ fontSize:'10px', fontFamily:'Syne,sans-serif', color:'#3A5A40', letterSpacing:'1px' }}>PERIOD:</span>
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding:'4px 12px', borderRadius:'2px', fontSize:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'1px', cursor:'pointer', border: period===p ? '1px solid rgba(0,255,136,0.4)' : '1px solid #1A2A1A', background: period===p ? 'rgba(0,255,136,0.08)' : 'transparent', color: period===p ? '#00FF88' : '#3A5A40', transition:'all .15s' }}>{p}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:'6px' }}>
          {(['overview','risks','compliance','recommendations'] as Section[]).map(s => (
            <button key={s} onClick={() => setSection(s)} style={{ padding:'4px 12px', borderRadius:'2px', fontSize:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'1px', cursor:'pointer', border: section===s ? '1px solid rgba(0,255,136,0.3)' : '1px solid transparent', background: section===s ? 'rgba(0,255,136,0.06)' : 'transparent', color: section===s ? '#00CC6A' : '#3A5A40', transition:'all .15s', textTransform:'uppercase' }}>{s}</button>
          ))}
          <button onClick={handleExport} style={{ padding:'4px 14px', borderRadius:'2px', fontSize:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'1px', cursor:'pointer', border:'1px solid rgba(0,255,136,0.3)', background: exporting ? 'rgba(0,255,136,0.15)' : 'rgba(0,255,136,0.06)', color:'#00FF88', marginLeft:'8px', transition:'all .2s' }}>
            {exporting ? '⟳ GENERATING...' : '↓ EXPORT PDF'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ overflow:'auto', padding:'20px' }}>

        {/* OVERVIEW */}
        {section === 'overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            <div style={{ background:'#0A110A', border:'1px solid #1A2A1A', borderRadius:'4px', padding:'18px 22px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:'18px', fontWeight:800, color:'#E8F5EE', letterSpacing:'2px', marginBottom:'6px' }}>CENTINELA EXECUTIVE SECURITY REPORT</div>
                <div style={{ fontSize:'12px', color:'#3A5A40' }}>
                  Period: <span style={{ color:'#7A9A80' }}>{period}</span>
                  &nbsp;·&nbsp; Generated: <span style={{ color:'#7A9A80' }}>{new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</span>
                  &nbsp;·&nbsp; Platform: <span style={{ color:'#7A9A80' }}>Daniel González AI Ecosystem</span>
                </div>
              </div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:'11px', fontWeight:700, letterSpacing:'2px', padding:'5px 12px', borderRadius:'2px', color:trendC[d.trend], border:`1px solid ${trendC[d.trend]}30`, background:`${trendC[d.trend]}10` }}>
                {trendI[d.trend]}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'10px' }}>
              {[
                { value: d.secScore,   label: 'SECURITY SCORE'   },
                { value: d.compScore,  label: 'COMPLIANCE SCORE' },
                { value: Math.round((d.mitigated/d.threats)*100), label: 'MITIGATION RATE' },
                { value: Math.round(100-(d.leaks/8)*10),          label: 'DATA INTEGRITY'  },
              ].map((g, i) => (
                <div key={i} style={{ background:'#0A110A', border:'1px solid #1A2A1A', borderRadius:'4px', padding:'16px', display:'flex', justifyContent:'center' }}>
                  <Gauge value={g.value} label={g.label}/>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:'8px' }}>
              {[
                { label:'THREATS DETECTED',  val: d.threats,   color:'#FF3333', sub:'Total flagged'         },
                { label:'THREATS MITIGATED', val: d.mitigated, color:'#00FF88', sub:'Auto-contained'        },
                { label:'CRITICAL INCIDENTS',val: d.critical,  color:'#FF3333', sub:'Immediate action'      },
                { label:'HIGH INCIDENTS',    val: d.high,      color:'#FF8800', sub:'Priority review'       },
                { label:'PROMPTS ANALYZED',  val: d.prompts,   color:'#00AAFF', sub:'Runtime inspection'    },
                { label:'ATTACKS BLOCKED',   val: d.mitigated, color:'#00FF88', sub:'Response engine'       },
                { label:'DATA LEAKS',        val: d.leaks,     color:'#FF8800', sub:'PII / secrets exposed' },
                { label:'AVG RISK SCORE',    val: d.avgRisk.toFixed(1), color: rc(d.avgRisk), sub:'Ecosystem-wide' },
              ].map((k, i) => (
                <div key={i} style={{ background:'#0A110A', border:'1px solid #1A2A1A', borderRadius:'4px', padding:'14px 16px' }}>
                  <div style={{ fontSize:'9px', fontFamily:'Syne,sans-serif', color:'#3A5A40', letterSpacing:'2px', marginBottom:'8px' }}>{k.label}</div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:'26px', fontWeight:800, color:k.color, lineHeight:1, marginBottom:'4px' }}>{k.val}</div>
                  <div style={{ fontSize:'10px', color:'#3A5A40' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background:'#0A110A', border:'1px solid #1A2A1A', borderRadius:'4px', padding:'18px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                <div style={{ fontSize:'10px', fontFamily:'Syne,sans-serif', color:'#3A5A40', letterSpacing:'2px' }}>RISK TIMELINE — LAST 4 WEEKS</div>
                <div style={{ display:'flex', gap:'12px' }}>
                  {[{l:'Detected',color:'#FF3333'},{l:'Blocked',color:'#00FF88'},{l:'Risk',color:'#FF8800'}].map((x,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#7A9A80' }}>
                      <div style={{ width:'10px', height:'2px', background:x.color }}/>{x.l}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:'12px', height:'110px' }}>
                {TIMELINE.map((w,i) => (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', gap:'6px' }}>
                    <div style={{ flex:1, display:'flex', alignItems:'flex-end', gap:'3px' }}>
                      <div style={{ flex:1, background:'#FF3333', opacity:0.7, borderRadius:'2px 2px 0 0', height:`${(w.detected/maxDet)*90}px` }}/>
                      <div style={{ flex:1, background:'#00FF88', opacity:0.8, borderRadius:'2px 2px 0 0', height:`${(w.blocked/maxDet)*90}px` }}/>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'9px', fontFamily:'Syne,sans-serif', color:'#3A5A40' }}>{w.w}</span>
                      <span style={{ fontSize:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, color:rc(w.risk) }}>{w.risk}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:'#0A110A', border:'1px solid #1A2A1A', borderRadius:'4px', padding:'18px 20px' }}>
              <div style={{ fontSize:'10px', fontFamily:'Syne,sans-serif', color:'#00CC6A', letterSpacing:'2px', marginBottom:'12px' }}>EXECUTIVE SUMMARY</div>
              <p style={{ fontSize:'13px', color:'#B0C8B8', lineHeight:1.7, margin:0, maxWidth:'860px' }}>
                Durante <strong style={{ color:'#E8F5EE' }}>{period.toLowerCase()}</strong>, Centinela monitoreó <strong style={{ color:'#00FF88' }}>8 agentes IA autónomos</strong> analizando{' '}
                <strong style={{ color:'#00AAFF' }}>{d.prompts} prompts</strong> en runtime. Se detectaron{' '}
                <strong style={{ color:'#FF3333' }}>{d.threats} amenazas</strong>, de las cuales{' '}
                <strong style={{ color:'#00FF88' }}>{d.mitigated} ({Math.round((d.mitigated/d.threats)*100)}%)</strong> fueron mitigadas automáticamente por el Response Engine.{' '}
                <strong style={{ color:'#FF3333' }}>{d.critical} incidentes críticos</strong> requieren remediación inmediata. La postura de seguridad está{' '}
                <strong style={{ color:trendC[d.trend] }}>{d.trend === 'improving' ? 'mejorando — continuar controles actuales' : d.trend === 'stable' ? 'estable — monitorear regresión' : 'degradándose — escalar remediación con urgencia'}</strong>.
                PII leak prevention se mantiene por debajo del umbral en <strong style={{ color:'#FF8800' }}>54%</strong> — requiere scanner inline inmediato.
              </p>
            </div>
          </div>
        )}

        {/* RISKS */}
        {section === 'risks' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ background:'#0A110A', border:'1px solid #1A2A1A', borderRadius:'4px', padding:'18px 20px' }}>
              <div style={{ fontSize:'10px', fontFamily:'Syne,sans-serif', color:'#00CC6A', letterSpacing:'2px', marginBottom:'14px' }}>TOP RISK VECTORS — AGENTES Y APIs</div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #1A2A1A' }}>
                    {['AGENT / RECURSO','RISK SCORE','CATEGORÍA','STATUS','Δ CAMBIO','RISK BAR'].map((h,i)=>(
                      <th key={i} style={{ textAlign: i > 1 ? 'center' : 'left', padding:'6px 10px', fontSize:'9px', fontFamily:'Syne,sans-serif', color:'#3A5A40', letterSpacing:'2px', fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TOP_RISKS.map((r,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #0F180F' }}>
                      <td style={{ padding:'12px 10px', fontSize:'13px', fontWeight:600, color:'#E8F5EE' }}>{r.agent}</td>
                      <td style={{ padding:'12px 10px' }}><span style={{ fontFamily:'Syne,sans-serif', fontSize:'18px', fontWeight:800, color:rc(r.risk) }}>{r.risk}</span></td>
                      <td style={{ padding:'12px 10px', textAlign:'center', fontSize:'11px', color:'#7A9A80' }}>{r.cat}</td>
                      <td style={{ padding:'12px 10px', textAlign:'center' }}>
                        <span style={{ fontSize:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'1px', padding:'2px 8px', borderRadius:'2px', color:stc[r.status], background:`${stc[r.status]}15`, border:`1px solid ${stc[r.status]}30` }}>{r.status}</span>
                      </td>
                      <td style={{ padding:'12px 10px', textAlign:'center', fontSize:'12px', fontFamily:'Syne,sans-serif', fontWeight:700, color: r.delta.startsWith('+') ? '#FF8800' : '#00FF88' }}>{r.delta}</td>
                      <td style={{ padding:'12px 10px', minWidth:'120px' }}><Bar value={r.risk} max={10} color={rc(r.risk)}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div style={{ background:'#0A110A', border:'1px solid #1A2A1A', borderRadius:'4px', padding:'18px 20px' }}>
                <div style={{ fontSize:'10px', fontFamily:'Syne,sans-serif', color:'#00CC6A', letterSpacing:'2px', marginBottom:'14px' }}>ATTACK TYPE BREAKDOWN</div>
                {ATTACK_TYPES.map((a,i)=>(
                  <div key={i} style={{ marginBottom:'12px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                      <span style={{ fontSize:'12px', color:'#B0C8B8' }}>{a.type}</span>
                      <div style={{ display:'flex', gap:'8px' }}>
                        <span style={{ fontSize:'12px', fontFamily:'Syne,sans-serif', fontWeight:700, color:'#FF3333' }}>{a.count}</span>
                        <span style={{ fontSize:'10px', color:'#3A5A40', fontFamily:'Syne,sans-serif' }}>{a.pct}%</span>
                      </div>
                    </div>
                    <Bar value={a.pct} max={100} color="#FF3333"/>
                  </div>
                ))}
              </div>

              <div style={{ background:'#0A110A', border:'1px solid #1A2A1A', borderRadius:'4px', padding:'18px 20px' }}>
                <div style={{ fontSize:'10px', fontFamily:'Syne,sans-serif', color:'#00CC6A', letterSpacing:'2px', marginBottom:'14px' }}>THREAT ORIGIN ANALYSIS</div>
                {[
                  { origin:'External API calls', risk:'HIGH',   count:22 },
                  { origin:'Prompt inputs',       risk:'HIGH',   count:18 },
                  { origin:'Tool callbacks',      risk:'MEDIUM', count:9  },
                  { origin:'Workflow triggers',   risk:'MEDIUM', count:6  },
                  { origin:'Agent-to-agent',      risk:'LOW',    count:3  },
                ].map((o,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #1A2A1A' }}>
                    <div>
                      <div style={{ fontSize:'12px', color:'#B0C8B8', marginBottom:'2px' }}>{o.origin}</div>
                      <span style={{ fontSize:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'1px', padding:'1px 6px', borderRadius:'2px', color:stc[o.risk], background:`${stc[o.risk]}15` }}>{o.risk}</span>
                    </div>
                    <span style={{ fontFamily:'Syne,sans-serif', fontSize:'18px', fontWeight:800, color:stc[o.risk] }}>{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COMPLIANCE */}
        {section === 'compliance' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ background:'#0A110A', border:'1px solid #1A2A1A', borderRadius:'4px', padding:'18px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                <div style={{ fontSize:'10px', fontFamily:'Syne,sans-serif', color:'#00CC6A', letterSpacing:'2px' }}>AI GOVERNANCE COMPLIANCE MATRIX</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:'11px', color:'#3A5A40' }}>{COMPLIANCE.filter(c=>c.status==='PASS').length}/{COMPLIANCE.length} CONTROLS PASSING</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {COMPLIANCE.map((c,i)=>(
                  <div key={i} style={{ background:'#0F180F', border:`1px solid ${stc[c.status]}20`, borderRadius:'3px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'14px' }}>
                    <div style={{ width:'48px', height:'48px', borderRadius:'50%', border:`2px solid ${stc[c.status]}`, display:'flex', alignItems:'center', justifyContent:'center', background:`${stc[c.status]}10`, flexShrink:0 }}>
                      <span style={{ fontFamily:'Syne,sans-serif', fontSize:'13px', fontWeight:800, color:stc[c.status] }}>{c.score}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', color:'#E8F5EE', fontWeight:600, marginBottom:'6px' }}>{c.label}</div>
                      <Bar value={c.score} max={100} color={stc[c.status]}/>
                    </div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:'10px', fontWeight:700, letterSpacing:'2px', padding:'4px 10px', borderRadius:'2px', color:stc[c.status], background:`${stc[c.status]}15`, border:`1px solid ${stc[c.status]}30` }}>{c.status}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
              {[
                { label:'PASSING', count: COMPLIANCE.filter(c=>c.status==='PASS').length, color:'#00FF88' },
                { label:'WARNING', count: COMPLIANCE.filter(c=>c.status==='WARN').length, color:'#FFD700' },
                { label:'FAILING', count: COMPLIANCE.filter(c=>c.status==='FAIL').length, color:'#FF3333' },
              ].map((s,i)=>(
                <div key={i} style={{ background:'#0A110A', border:`1px solid ${s.color}20`, borderRadius:'4px', padding:'16px', textAlign:'center' }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:'36px', fontWeight:800, color:s.color, marginBottom:'4px' }}>{s.count}</div>
                  <div style={{ fontSize:'10px', fontFamily:'Syne,sans-serif', color:'#3A5A40', letterSpacing:'2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {section === 'recommendations' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ fontSize:'10px', fontFamily:'Syne,sans-serif', color:'#3A5A40', letterSpacing:'2px', marginBottom:'4px' }}>PRIORITIZED SECURITY RECOMMENDATIONS — {RECS.length} ACTION ITEMS</div>
            {RECS.map((r,i)=>(
              <div key={i} style={{ background:'#0A110A', border:`1px solid ${r.p==='P1'?'rgba(255,51,51,0.2)':r.p==='P2'?'rgba(255,136,0,0.2)':'#1A2A1A'}`, borderRadius:'4px', padding:'18px 20px', borderLeft:`3px solid ${r.p==='P1'?'#FF3333':r.p==='P2'?'#FF8800':'#FFD700'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontFamily:'Syne,sans-serif', fontSize:'11px', fontWeight:800, letterSpacing:'1px', padding:'3px 8px', borderRadius:'2px', color:r.p==='P1'?'#FF3333':r.p==='P2'?'#FF8800':'#FFD700', background:r.p==='P1'?'rgba(255,51,51,0.1)':r.p==='P2'?'rgba(255,136,0,0.1)':'rgba(255,215,0,0.1)' }}>{r.p}</span>
                    <span style={{ fontSize:'14px', fontWeight:700, color:'#E8F5EE' }}>{r.title}</span>
                  </div>
                  <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                    <span style={{ fontSize:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'1px', padding:'2px 8px', borderRadius:'2px', color:stc[r.impact], background:`${stc[r.impact]}15`, border:`1px solid ${stc[r.impact]}30` }}>IMPACT: {r.impact}</span>
                    <span style={{ fontSize:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'1px', padding:'2px 8px', borderRadius:'2px', color: r.effort==='LOW'?'#00FF88':r.effort==='MEDIUM'?'#FFD700':'#FF8800', background: r.effort==='LOW'?'rgba(0,255,136,0.1)':r.effort==='MEDIUM'?'rgba(255,215,0,0.1)':'rgba(255,136,0,0.1)', border:`1px solid ${r.effort==='LOW'?'rgba(0,255,136,0.3)':r.effort==='MEDIUM'?'rgba(255,215,0,0.3)':'rgba(255,136,0,0.3)'}` }}>EFFORT: {r.effort}</span>
                  </div>
                </div>
                <div style={{ fontSize:'13px', color:'#7A9A80', lineHeight:1.6, maxWidth:'800px' }}>{r.detail}</div>
                <div style={{ marginTop:'12px', display:'flex', gap:'8px' }}>
                  <button style={{ padding:'6px 14px', borderRadius:'2px', fontSize:'11px', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'1px', cursor:'pointer', border:'1px solid rgba(0,255,136,0.3)', background:'rgba(0,255,136,0.06)', color:'#00FF88' }}>OPEN INCIDENT</button>
                  <button style={{ padding:'6px 14px', borderRadius:'2px', fontSize:'11px', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'1px', cursor:'pointer', border:'1px solid #1A2A1A', background:'transparent', color:'#3A5A40' }}>ASSIGN TASK</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0A110A} ::-webkit-scrollbar-thumb{background:#1A3A1A;border-radius:2px}`}</style>
    </div>
  );
}