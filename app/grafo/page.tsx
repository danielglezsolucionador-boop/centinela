'use client';
import { useState, useEffect, useRef } from 'react';

const nodes = [
  { id: 'cerebro', label: 'Cerebro', type: 'AGENT', risk: 9.2, x: 400, y: 280, connections: 7, status: 'ALERT' },
  { id: 'laboratorio', label: 'Laboratorio', type: 'AGENT', risk: 6.4, x: 220, y: 160, connections: 4, status: 'NORMAL' },
  { id: 'mcf', label: 'MCF', type: 'AGENT', risk: 8.1, x: 580, y: 160, connections: 5, status: 'ALERT' },
  { id: 'buscador', label: 'Buscador', type: 'AGENT', risk: 5.2, x: 160, y: 340, connections: 3, status: 'NORMAL' },
  { id: 'sniff', label: 'Sniff Amazon', type: 'AGENT', risk: 4.8, x: 640, y: 340, connections: 3, status: 'NORMAL' },
  { id: 'pluma', label: 'PLUMA', type: 'AGENT', risk: 7.8, x: 300, y: 430, connections: 4, status: 'INVESTIGATING' },
  { id: 'anthropic', label: 'Anthropic API', type: 'API', risk: 2.1, x: 400, y: 100, connections: 5, status: 'NORMAL' },
  { id: 'supabase', label: 'Supabase', type: 'DATABASE', risk: 3.4, x: 180, y: 480, connections: 4, status: 'NORMAL' },
  { id: 'scraper', label: 'ScrapeCreators', type: 'API', risk: 5.9, x: 80, y: 240, connections: 2, status: 'NORMAL' },
  { id: 'sunat', label: 'SUNAT API', type: 'API', risk: 8.8, x: 700, y: 220, connections: 2, status: 'ALERT' },
  { id: 'usr_atk', label: 'usr_8x9k2', type: 'THREAT', risk: 9.7, x: 520, y: 420, connections: 2, status: 'BLOCKED' },
  { id: 'usr_atk2', label: 'usr_7k9p', type: 'THREAT', risk: 9.1, x: 680, y: 130, connections: 1, status: 'BLOCKED' },
];

const edges = [
  { from: 'cerebro', to: 'anthropic', type: 'API_CALL', risk: 'LOW' },
  { from: 'cerebro', to: 'laboratorio', type: 'WORKFLOW', risk: 'MEDIUM' },
  { from: 'cerebro', to: 'mcf', type: 'WORKFLOW', risk: 'HIGH' },
  { from: 'cerebro', to: 'buscador', type: 'WORKFLOW', risk: 'LOW' },
  { from: 'cerebro', to: 'sniff', type: 'WORKFLOW', risk: 'LOW' },
  { from: 'cerebro', to: 'pluma', type: 'WORKFLOW', risk: 'HIGH' },
  { from: 'laboratorio', to: 'anthropic', type: 'API_CALL', risk: 'LOW' },
  { from: 'laboratorio', to: 'supabase', type: 'DATABASE', risk: 'LOW' },
  { from: 'mcf', to: 'sunat', type: 'API_CALL', risk: 'CRITICAL' },
  { from: 'mcf', to: 'anthropic', type: 'API_CALL', risk: 'LOW' },
  { from: 'mcf', to: 'supabase', type: 'DATABASE', risk: 'LOW' },
  { from: 'buscador', to: 'scraper', type: 'API_CALL', risk: 'LOW' },
  { from: 'pluma', to: 'supabase', type: 'DATABASE', risk: 'MEDIUM' },
  { from: 'pluma', to: 'anthropic', type: 'API_CALL', risk: 'LOW' },
  { from: 'usr_atk', to: 'cerebro', type: 'ATTACK', risk: 'CRITICAL' },
  { from: 'usr_atk2', to: 'mcf', type: 'ATTACK', risk: 'CRITICAL' },
  { from: 'usr_atk2', to: 'sunat', type: 'ATTACK', risk: 'CRITICAL' },
];

const nodeColor: Record<string, { fill: string; border: string; text: string }> = {
  AGENT:    { fill: 'rgba(0,56,32,0.6)',    border: '#00FF88', text: '#00FF88' },
  API:      { fill: 'rgba(0,26,64,0.6)',    border: '#00AAFF', text: '#00AAFF' },
  DATABASE: { fill: 'rgba(26,18,0,0.6)',    border: '#FF8800', text: '#FF8800' },
  THREAT:   { fill: 'rgba(26,5,5,0.9)',     border: '#FF3333', text: '#FF3333' },
};

const statusGlow: Record<string, string> = {
  ALERT: '#FF3333', BLOCKED: '#FF3333', INVESTIGATING: '#FFD700', NORMAL: 'transparent',
};

const edgeColor: Record<string, string> = {
  CRITICAL: '#FF3333', HIGH: '#FF8800', MEDIUM: '#FFD700', LOW: '#1A4A2A',
};

const edgeStyle: Record<string, string> = {
  ATTACK: '6,3', WORKFLOW: '0', API_CALL: '3,3', DATABASE: '8,2',
};

const riskColor = (r: number) => r >= 8 ? '#FF3333' : r >= 6 ? '#FF8800' : r >= 4 ? '#FFD700' : '#00FF88';

export default function Grafo() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'AGENT' | 'API' | 'DATABASE' | 'THREAT'>('ALL');
  const [showAttacks, setShowAttacks] = useState(true);
  const [tick, setTick] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1500);
    return () => clearInterval(t);
  }, []);

  const sel = nodes.find(n => n.id === selectedNode);
  const visibleNodes = nodes.filter(n => filter === 'ALL' || n.type === filter);
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e =>
    visibleIds.has(e.from) && visibleIds.has(e.to) &&
    (showAttacks || e.type !== 'ATTACK')
  );

  const getNodeEdges = (id: string) => edges.filter(e => e.from === id || e.to === id);

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'grid', gridTemplateRows: '48px 1fr' }}>

      {/* Topbar */}
      <div style={{ background: '#0A110A', borderBottom: '1px solid #1A2A1A', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '16px' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 800, color: '#00FF88', letterSpacing: '2px' }}>CENTINELA</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#3A5A40' }}>
          <span>GRAFO</span><span>/</span>
          <span style={{ color: '#7A9A80' }}>Security Graph Intelligence</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px #00FF88', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', color: '#7A9A80', letterSpacing: '1px' }}>GRAPH LIVE</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden', height: 'calc(100vh - 48px)' }}>

        {/* Graph area */}
        <div style={{ position: 'relative', overflow: 'hidden', background: '#050A05' }}>

          {/* Controls */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '10px 12px' }}>
              <div style={{ fontSize: '9px', fontFamily: 'Syne, sans-serif', color: '#3A5A40', letterSpacing: '2px', marginBottom: '8px' }}>FILTER NODES</div>
              {(['ALL','AGENT','API','DATABASE','THREAT'] as const).map(f => (
                <div key={f} onClick={() => setFilter(f)} style={{ padding: '4px 8px', borderRadius: '2px', fontSize: '11px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', marginBottom: '2px', background: filter === f ? 'rgba(0,255,136,0.1)' : 'transparent', color: filter === f ? '#00FF88' : '#3A5A40', border: filter === f ? '1px solid rgba(0,255,136,0.2)' : '1px solid transparent', transition: 'all .15s' }}>{f}</div>
              ))}
            </div>
            <div style={{ background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '10px 12px' }}>
              <div style={{ fontSize: '9px', fontFamily: 'Syne, sans-serif', color: '#3A5A40', letterSpacing: '2px', marginBottom: '8px' }}>SHOW</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7A9A80', cursor: 'pointer' }}>
                <input type="checkbox" checked={showAttacks} onChange={e => setShowAttacks(e.target.checked)} style={{ accentColor: '#FF3333' }} /> Attack paths
              </label>
            </div>
          </div>

          {/* Legend */}
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '10px 14px' }}>
            <div style={{ fontSize: '9px', fontFamily: 'Syne, sans-serif', color: '#3A5A40', letterSpacing: '2px', marginBottom: '8px' }}>LEGEND</div>
            {[
              { label: 'Agent', color: '#00FF88' },
              { label: 'API', color: '#00AAFF' },
              { label: 'Database', color: '#FF8800' },
              { label: 'Threat actor', color: '#FF3333' },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: `2px solid ${l.color}`, background: `${l.color}20` }} />
                <span style={{ fontSize: '11px', color: '#7A9A80' }}>{l.label}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #1A2A1A', marginTop: '8px', paddingTop: '8px' }}>
              {[
                { label: 'Attack', dash: '8,3', color: '#FF3333' },
                { label: 'Workflow', dash: '0', color: '#00FF88' },
                { label: 'API call', dash: '3,3', color: '#00AAFF' },
                { label: 'Database', dash: '8,2', color: '#FF8800' },
              ].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke={l.color} strokeWidth="1.5" strokeDasharray={l.dash} /></svg>
                  <span style={{ fontSize: '11px', color: '#7A9A80' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Graph */}
          <svg
            ref={svgRef}
            width="100%" height="100%"
            viewBox="0 0 780 560"
            style={{ display: 'block' }}
          >
            <defs>
              <radialGradient id="bg-grad" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#0A1A0A" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#050A05" stopOpacity="0" />
              </radialGradient>
              <filter id="glow-red">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-green">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#FF3333" />
              </marker>
              <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#1A4A2A" />
              </marker>
              <marker id="arrow-amber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#FF8800" />
              </marker>
              <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#00AAFF" />
              </marker>
            </defs>

            <rect width="780" height="560" fill="url(#bg-grad)" />

            {/* Grid lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 80} x2="780" y2={i * 80} stroke="#1A2A1A" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="560" stroke="#1A2A1A" strokeWidth="0.5" />
            ))}

            {/* Edges */}
            {visibleEdges.map((edge, i) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              const color = edgeColor[edge.risk];
              const dash = edgeStyle[edge.type];
              const markerId = edge.risk === 'CRITICAL' || edge.type === 'ATTACK' ? 'arrow-red' : edge.risk === 'HIGH' || edge.risk === 'MEDIUM' ? 'arrow-amber' : edge.type === 'API_CALL' ? 'arrow-blue' : 'arrow-green';
              const isHighlighted = selectedNode && (edge.from === selectedNode || edge.to === selectedNode);
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const ux = dx / len; const uy = dy / len;
              const r = 22;
              const x1 = fromNode.x + ux * r;
              const y1 = fromNode.y + uy * r;
              const x2 = toNode.x - ux * (r + 4);
              const y2 = toNode.y - uy * (r + 4);
              return (
                <line
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color}
                  strokeWidth={isHighlighted ? 2 : edge.type === 'ATTACK' ? 1.5 : 1}
                  strokeDasharray={dash}
                  strokeOpacity={selectedNode ? (isHighlighted ? 1 : 0.15) : 0.6}
                  markerEnd={`url(#${markerId})`}
                  filter={edge.type === 'ATTACK' ? 'url(#glow-red)' : undefined}
                />
              );
            })}

            {/* Nodes */}
            {visibleNodes.map(node => {
              const nc = nodeColor[node.type];
              const isSelected = selectedNode === node.id;
              const isHovered = hoveredNode === node.id;
              const hasAlert = node.status === 'ALERT' || node.status === 'BLOCKED';
              const pulseR = 28 + (tick % 2) * 4;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {hasAlert && (
                    <circle r={pulseR} fill="none" stroke={statusGlow[node.status]} strokeWidth="1" strokeOpacity={0.3} />
                  )}
                  <circle
                    r={isSelected || isHovered ? 24 : 20}
                    fill={nc.fill}
                    stroke={isSelected ? '#00FF88' : nc.border}
                    strokeWidth={isSelected ? 2 : 1}
                    filter={hasAlert ? 'url(#glow-red)' : isSelected ? 'url(#glow-green)' : undefined}
                    style={{ transition: 'r .15s' }}
                  />
                  <text textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill={nc.text} fontFamily="Syne, sans-serif" letterSpacing="0.5">{node.label.length > 8 ? node.label.slice(0, 7) + '…' : node.label}</text>
                  <text y="32" textAnchor="middle" fontSize="8" fill={riskColor(node.risk)} fontFamily="monospace">{node.risk}</text>
                  {node.status !== 'NORMAL' && (
                    <g transform="translate(14,-14)">
                      <circle r="6" fill={statusGlow[node.status]} />
                      <text textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#000" fontWeight="800">!</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right panel */}
        <div style={{ background: '#0A110A', borderLeft: '1px solid #1A2A1A', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Stats */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1A2A1A' }}>
            <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#3A5A40', letterSpacing: '2px', marginBottom: '10px' }}>GRAPH OVERVIEW</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'NODES', val: visibleNodes.length, color: '#00FF88' },
                { label: 'EDGES', val: visibleEdges.length, color: '#00AAFF' },
                { label: 'THREATS', val: nodes.filter(n => n.type === 'THREAT').length, color: '#FF3333' },
                { label: 'ALERTS', val: nodes.filter(n => n.status === 'ALERT' || n.status === 'BLOCKED').length, color: '#FF8800' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#0F180F', border: '1px solid #1A2A1A', borderRadius: '3px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '9px', color: '#3A5A40', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Node detail */}
          {sel ? (
            <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '12px' }}>NODE DETAIL</div>
              <div style={{ background: '#0F180F', border: `1px solid ${nodeColor[sel.type].border}30`, borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: nodeColor[sel.type].text, marginBottom: '4px' }}>{sel.label}</div>
                <div style={{ fontSize: '10px', color: '#3A5A40', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>{sel.type}</div>
              </div>
              {[
                { label: 'Risk Score', val: sel.risk, color: riskColor(sel.risk) },
                { label: 'Status', val: sel.status, color: statusGlow[sel.status] || '#00FF88' },
                { label: 'Connections', val: sel.connections, color: '#00AAFF' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1A2A1A' }}>
                  <span style={{ fontSize: '12px', color: '#3A5A40' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Syne, sans-serif', color: item.color }}>{item.val}</span>
                </div>
              ))}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '8px' }}>CONNECTED EDGES</div>
                {getNodeEdges(sel.id).map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1A2A1A' }}>
                    <div style={{ fontSize: '11px', color: '#7A9A80', fontFamily: 'monospace' }}>
                      {e.from === sel.id ? `→ ${e.to}` : `← ${e.from}`}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '2px', background: `${edgeColor[e.risk]}15`, color: edgeColor[e.risk], fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{e.risk}</span>
                      <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '2px', background: '#0F180F', color: '#3A5A40', fontFamily: 'Syne, sans-serif', border: '1px solid #1A2A1A' }}>{e.type}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button style={{ padding: '8px', borderRadius: '3px', border: '1px solid rgba(255,51,51,0.3)', background: 'rgba(255,51,51,0.08)', color: '#FF3333', fontSize: '11px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer' }}>ISOLATE NODE</button>
                <button style={{ padding: '8px', borderRadius: '3px', border: '1px solid #1A2A1A', background: 'transparent', color: '#7A9A80', fontSize: '11px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer' }}>VIEW FORENSICS</button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#3A5A40', letterSpacing: '2px', marginBottom: '12px' }}>ALL NODES</div>
              {visibleNodes.sort((a, b) => b.risk - a.risk).map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '3px', marginBottom: '4px', cursor: 'pointer', background: '#0F180F', border: `1px solid ${node.status !== 'NORMAL' ? `${statusGlow[node.status]}20` : '#1A2A1A'}`, transition: 'all .15s' }}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: '#E8F5EE', fontWeight: 600 }}>{node.label}</div>
                    <div style={{ fontSize: '10px', color: '#3A5A40', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>{node.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 800, color: riskColor(node.risk) }}>{node.risk}</div>
                    {node.status !== 'NORMAL' && (
                      <div style={{ fontSize: '9px', fontFamily: 'Syne, sans-serif', color: statusGlow[node.status], letterSpacing: '1px' }}>{node.status}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attack paths notice */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1A2A1A', background: 'rgba(26,5,5,0.5)' }}>
            <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#FF3333', letterSpacing: '2px', marginBottom: '4px' }}>ACTIVE ATTACK PATHS</div>
            <div style={{ fontSize: '11px', color: '#7A9A80' }}>2 rutas de ataque detectadas en tiempo real. usr_8x9k2 → Cerebro · usr_7k9p → MCF → SUNAT.</div>
          </div>

        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}