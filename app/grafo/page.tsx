'use client';
import { useState, useEffect, useRef } from 'react';
import { api, ensureToken } from '@/lib/api';

const NODE_POSITIONS: Record<string, {x:number,y:number}> = {
  PLUMA:        {x:300,y:430},
  CEREBRO:      {x:400,y:280},
  MCF:          {x:580,y:160},
  BUSCADOR:     {x:160,y:340},
  SNIFF_AMAZON: {x:640,y:340},
  LABORATORIO:  {x:220,y:160},
  LENTE:        {x:500,y:430},
  CREADOR_APIS: {x:700,y:280},
};

const DEFAULT_POS = (i:number) => ({x: 100 + (i%4)*160, y: 100 + Math.floor(i/4)*160});

const riskColor = (r:number) => r>=70?'#FF3333':r>=40?'#FF8800':r>=20?'#FFD700':'#00FF88';
const statusGlow: Record<string,string> = {SUSPICIOUS:'#FF8800',BLOCKED:'#FF3333',ALERT:'#FF3333',NORMAL:'transparent',INVESTIGATING:'#FFD700'};

export default function Grafo() {
  const [agents, setAgents] = useState<any[]>([]);
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<string|null>(null);
  const [hoveredNode, setHoveredNode] = useState<string|null>(null);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick(p=>p+1), 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      await ensureToken();
      const timeout = setTimeout(() => setWaking(true), 5000);
      try {
        const [ag, co] = await Promise.all([api.getAgentMap(), api.getCorrelations()]);
        setAgents(Array.isArray(ag) ? ag : []);
        setCorrelations(Array.isArray(co) ? co : []);
        setWaking(false);
      } catch { setWaking(true); }
      finally { clearTimeout(timeout); setLoading(false); }
    };
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

  const nodes = agents.map((a,i) => ({
    id: a.name,
    label: a.name,
    risk: Math.round(a.avg_risk),
    status: a.status,
    total_events: a.total_events,
    anomalies: a.anomalies,
    ...(NODE_POSITIONS[a.name] ?? DEFAULT_POS(i)),
  }));

  const sel = nodes.find(n => n.id === selectedNode);

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:'16px',background:'#050A05'}}>
      <div style={{fontSize:'13px',color:'#3A5A40'}}>{waking?'Runtime waking up...':'Loading graph...'}</div>
    </div>
  );

  return (
    <div style={{background:'#050A05',minHeight:'100vh',color:'white',fontFamily:'Plus Jakarta Sans, sans-serif',display:'grid',gridTemplateRows:'48px 1fr'}}>
      <div style={{background:'#0A110A',borderBottom:'1px solid #1A2A1A',display:'flex',alignItems:'center',padding:'0 20px',gap:'16px'}}>
        <span style={{fontFamily:'Syne, sans-serif',fontSize:'15px',fontWeight:800,color:'#00FF88',letterSpacing:'2px'}}>CENTINELA</span>
        <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'#3A5A40'}}>
          <span>GRAFO</span><span>/</span>
          <span style={{color:'#7A9A80'}}>Security Graph Intelligence</span>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#00FF88',boxShadow:'0 0 8px #00FF88'}}/>
          <span style={{fontFamily:'Syne, sans-serif',fontSize:'11px',color:'#7A9A80',letterSpacing:'1px'}}>BACKEND LIVE</span>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',overflow:'hidden',height:'calc(100vh - 48px)'}}>
        <div style={{position:'relative',overflow:'hidden',background:'#050A05'}}>
          <svg width="100%" height="100%" viewBox="0 0 780 560" style={{display:'block'}}>
            <defs>
              <filter id="glow-red"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glow-green"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#1A4A2A"/></marker>
            </defs>
            {Array.from({length:8}).map((_,i)=><line key={"h"+i} x1="0" y1={i*80} x2="780" y2={i*80} stroke="#1A2A1A" strokeWidth="0.5"/>)}
            {Array.from({length:11}).map((_,i)=><line key={"v"+i} x1={i*80} y1="0" x2={i*80} y2="560" stroke="#1A2A1A" strokeWidth="0.5"/>)}
            {nodes.map(node => {
              const isSelected = selectedNode===node.id;
              const isHovered = hoveredNode===node.id;
              const hasAlert = node.status==='SUSPICIOUS'||node.status==='BLOCKED'||node.status==='ALERT';
              const pulseR = 28+(tick%2)*4;
              const rc = riskColor(node.risk);
              return (
                <g key={node.id} transform={"translate("+node.x+","+node.y+")"} style={{cursor:'pointer'}}
                  onClick={()=>setSelectedNode(selectedNode===node.id?null:node.id)}
                  onMouseEnter={()=>setHoveredNode(node.id)}
                  onMouseLeave={()=>setHoveredNode(null)}>
                  {hasAlert&&<circle r={pulseR} fill="none" stroke={statusGlow[node.status]} strokeWidth="1" strokeOpacity="0.3"/>}
                  <circle r={isSelected||isHovered?24:20} fill="rgba(0,56,32,0.6)" stroke={isSelected?'#00FF88':rc} strokeWidth={isSelected?2:1}
                    filter={hasAlert?'url(#glow-red)':isSelected?'url(#glow-green)':undefined} style={{transition:'r .15s'}}/>
                  <text textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="#00FF88" fontFamily="Syne, sans-serif" letterSpacing="0.5">
                    {node.label.length>8?node.label.slice(0,7)+'…':node.label}
                  </text>
                  <text y="32" textAnchor="middle" fontSize="8" fill={rc} fontFamily="monospace">{node.risk}</text>
                  {node.status!=='NORMAL'&&(
                    <g transform="translate(14,-14)">
                      <circle r="6" fill={statusGlow[node.status]??'#FF8800'}/>
                      <text textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#000" fontWeight="800">!</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{background:'#0A110A',borderLeft:'1px solid #1A2A1A',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #1A2A1A'}}>
            <div style={{fontSize:'10px',fontFamily:'Syne, sans-serif',color:'#3A5A40',letterSpacing:'2px',marginBottom:'10px'}}>GRAPH OVERVIEW</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {[
                {label:'AGENTS',val:nodes.length,color:'#00FF88'},
                {label:'SUSPICIOUS',val:nodes.filter(n=>n.status==='SUSPICIOUS'||n.status==='ALERT').length,color:'#FF8800'},
                {label:'BLOCKED',val:nodes.filter(n=>n.status==='BLOCKED').length,color:'#FF3333'},
                {label:'CORRELATIONS',val:correlations.length,color:'#00AAFF'},
              ].map((s,i)=>(
                <div key={i} style={{background:'#0F180F',border:'1px solid #1A2A1A',borderRadius:'3px',padding:'8px',textAlign:'center'}}>
                  <div style={{fontFamily:'Syne, sans-serif',fontSize:'18px',fontWeight:800,color:s.color}}>{s.val}</div>
                  <div style={{fontSize:'9px',color:'#3A5A40',fontFamily:'Syne, sans-serif',letterSpacing:'1px'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {sel?(
            <div style={{flex:1,overflow:'auto',padding:'14px 16px'}}>
              <div style={{fontSize:'10px',fontFamily:'Syne, sans-serif',color:'#00CC6A',letterSpacing:'2px',marginBottom:'12px'}}>NODE DETAIL</div>
              <div style={{background:'#0F180F',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'4px',padding:'12px',marginBottom:'12px'}}>
                <div style={{fontFamily:'Syne, sans-serif',fontSize:'14px',fontWeight:700,color:'#00FF88',marginBottom:'4px'}}>{sel.label}</div>
                <div style={{fontSize:'10px',color:'#3A5A40',fontFamily:'Syne, sans-serif',letterSpacing:'1px'}}>AGENT</div>
              </div>
              {[
                {label:'Risk Score',val:sel.risk,color:riskColor(sel.risk)},
                {label:'Status',val:sel.status,color:statusGlow[sel.status]||'#00FF88'},
                {label:'Total Events',val:sel.total_events,color:'#00AAFF'},
                {label:'Anomalies',val:sel.anomalies,color:sel.anomalies>0?'#FF8800':'#00FF88'},
              ].map((item,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #1A2A1A'}}>
                  <span style={{fontSize:'12px',color:'#3A5A40'}}>{item.label}</span>
                  <span style={{fontSize:'12px',fontWeight:700,fontFamily:'Syne, sans-serif',color:item.color}}>{item.val}</span>
                </div>
              ))}
            </div>
          ):(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'8px',padding:'20px'}}>
              <div style={{fontSize:'11px',color:'#3A5A40',textAlign:'center'}}>Selecciona un agente para ver el detalle</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
