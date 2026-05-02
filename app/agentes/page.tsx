'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const FALLBACK_AGENTS = [
  { id: 'AGT001', name: 'PLUMA', type: 'Content Generator', status: 'MONITORED', risk: 78, toolCalls: 342, anomalies: 3, lastActive: '21:44:12', model: 'claude-sonnet-4', permissions: ['write:content', 'read:trends', 'publish:web'], workflows: 4, drift: 23 },
  { id: 'AGT002', name: 'LABORATORIO', type: 'Marketing Agent', status: 'ISOLATED', risk: 91, toolCalls: 128, anomalies: 7, lastActive: '21:41:05', model: 'claude-sonnet-4', permissions: ['read:analytics', 'post:social'], workflows: 2, drift: 67 },
  { id: 'AGT003', name: 'BUSCADOR', type: 'Search Agent', status: 'ACTIVE', risk: 34, toolCalls: 892, anomalies: 1, lastActive: '21:48:33', model: 'claude-haiku-4', permissions: ['search:web', 'read:rss'], workflows: 3, drift: 8 },
  { id: 'AGT004', name: 'MCF', type: 'Financial Agent', status: 'MONITORED', risk: 62, toolCalls: 67, anomalies: 2, lastActive: '21:35:21', model: 'claude-sonnet-4', permissions: ['read:financial', 'access:sunat'], workflows: 2, drift: 31 },
  { id: 'AGT005', name: 'CEREBRO', type: 'Orchestrator', status: 'ACTIVE', risk: 45, toolCalls: 1247, anomalies: 0, lastActive: '21:49:01', model: 'claude-sonnet-4', permissions: ['orchestrate:all', 'read:all'], workflows: 8, drift: 12 },
  { id: 'AGT006', name: 'SNIFF AMAZON', type: 'Commerce Agent', status: 'BLOCKED', risk: 95, toolCalls: 23, anomalies: 11, lastActive: '20:12:44', model: 'claude-haiku-4', permissions: ['scrape:amazon'], workflows: 1, drift: 89 },
];

const FALLBACK_TOOLCALLS = [
  { agent: 'PLUMA', tool: 'publish_content', time: '21:44:09', status: 'BLOCKED', reason: 'Prompt injection en payload' },
  { agent: 'BUSCADOR', tool: 'search_web', time: '21:43:55', status: 'ALLOWED', reason: '' },
  { agent: 'CEREBRO', tool: 'orchestrate_agents', time: '21:43:48', status: 'ALLOWED', reason: '' },
  { agent: 'LABORATORIO', tool: 'post_social', time: '21:41:02', status: 'BLOCKED', reason: 'Tool call anómalo detectado' },
  { agent: 'MCF', tool: 'access_sunat', time: '21:40:11', status: 'MONITORED', reason: 'Acceso fuera de horario' },
  { agent: 'SNIFF AMAZON', tool: 'scrape_amazon', time: '20:12:40', status: 'BLOCKED', reason: 'Comportamiento malicioso detectado' },
];

const statusColor: Record<string, string> = {
  ACTIVE: '#00FF88', MONITORED: '#FFB800', ISOLATED: '#FF6B00', BLOCKED: '#FF3333',
};
const toolStatusColor: Record<string, string> = {
  ALLOWED: '#00FF88', MONITORED: '#FFB800', BLOCKED: '#FF3333',
};

function RiskBar({ value }: { value: number }) {
  const color = value > 80 ? '#FF3333' : value > 60 ? '#FF6B00' : value > 40 ? '#FFB800' : '#00FF88';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className="threat-bar" style={{ flex: 1 }}>
        <div className="threat-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="terminal-text" style={{ fontSize: '11px', color, minWidth: '32px' }}>{value}%</span>
    </div>
  );
}

export default function AgentSecurity() {
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'toolcalls'>('agents');
  const [agentsData, setAgentsData] = useState<any[]>(FALLBACK_AGENTS);
  const [toolCallsData, setToolCallsData] = useState<any[]>(FALLBACK_TOOLCALLS);
  const [liveToolCalls, setLiveToolCalls] = useState(2699);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.getAgentsMap();
        if (data?.agents?.length) { setAgentsData(data.agents); setIsLive(true); }
        if (data?.tool_calls?.length) setToolCallsData(data.tool_calls);
      } catch(e) {}
    }
    cargar();
    const interval = setInterval(() => {
      setLiveToolCalls(prev => prev + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const selectedAgent = agentsData.find((a: any) => a.id === selected);

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 className="font-syne" style={{ fontSize: '22px', fontWeight: 800, color: '#E8F5E8' }}>
            AGENT SECURITY
          </h1>
          <span className="badge badge-green">ACTIVO</span>
          {isLive && <span className="badge badge-blue">BACKEND LIVE</span>}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {agentsData.length} agentes monitoreados · Tool calls · Comportamiento en tiempo real
        </p>
      </div>

      <div className="grid-metrics" style={{ marginBottom: '24px' }}>
        {[
          { label: 'AGENTES ACTIVOS', value: String(agentsData.filter((a: any) => a.status === 'ACTIVE').length), color: 'var(--green-neon)', sub: 'Sin anomalías' },
          { label: 'TOOL CALLS TOTALES', value: liveToolCalls.toLocaleString(), color: 'var(--blue-info)', sub: 'Live' },
          { label: 'AGENTES BLOQUEADOS', value: String(agentsData.filter((a: any) => a.status === 'BLOCKED').length), color: 'var(--red-alert)', sub: 'Requieren revisión' },
          { label: 'ANOMALÍAS TOTALES', value: String(agentsData.reduce((sum: number, a: any) => sum + (a.anomalies || 0), 0)), color: 'var(--yellow-warn)', sub: 'Detectadas hoy' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>{m.label}</div>
            <div className="metric-value" style={{ color: m.color, marginBottom: '6px' }}>{m.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['agents', 'toolcalls'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: activeTab === tab ? 'var(--green-neon)' : 'rgba(0,255,136,0.08)',
            color: activeTab === tab ? '#050A05' : 'var(--text-secondary)',
          }}>
            {tab === 'agents' ? '🤖 AGENTES' : '🔧 TOOL CALLS'}
          </button>
        ))}
      </div>

      {activeTab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {agentsData.map((agent: any) => (
              <div key={agent.id} onClick={() => setSelected(selected === agent.id ? null : agent.id)}
                style={{
                  padding: '16px 20px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                  background: selected === agent.id ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selected === agent.id ? 'rgba(0,255,136,0.2)' : 'rgba(0,255,136,0.06)'}`,
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`status-dot ${agent.status === 'ACTIVE' ? 'status-live' : agent.status === 'BLOCKED' ? 'status-critical' : 'status-warning'}`} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{agent.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{agent.type} · {agent.model}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{agent.anomalies} anomalías</span>
                    <span className={`badge ${agent.status === 'ACTIVE' ? 'badge-green' : agent.status === 'BLOCKED' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: '10px' }}>
                      {agent.status}
                    </span>
                  </div>
                </div>
                <RiskBar value={agent.risk} />
              </div>
            ))}
          </div>

          {selectedAgent && (
            <div className="card-base" style={{ padding: '24px', height: 'fit-content' }}>
              <div style={{ fontSize: '11px', color: 'var(--green-neon)', letterSpacing: '2px', marginBottom: '18px' }}>
                AGENT DETAIL — {selectedAgent.id}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Nombre', value: selectedAgent.name },
                  { label: 'Tipo', value: selectedAgent.type },
                  { label: 'Modelo', value: selectedAgent.model },
                  { label: 'Estado', value: selectedAgent.status },
                  { label: 'Tool calls', value: (selectedAgent.toolCalls || 0).toLocaleString() },
                  { label: 'Anomalías', value: String(selectedAgent.anomalies || 0) },
                  { label: 'Workflows', value: String(selectedAgent.workflows || 0) },
                  { label: 'Último activo', value: selectedAgent.lastActive || '-' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(0,255,136,0.05)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}

                {selectedAgent.permissions?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Permisos activos</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedAgent.permissions.map((perm: string, i: number) => (
                        <span key={i} className="terminal-text" style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', background: 'rgba(0,210,255,0.1)', color: 'var(--blue-info)' }}>{perm}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Agent Drift</div>
                  <RiskBar value={selectedAgent.drift || 0} />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn-danger" style={{ flex: 1, padding: '10px', fontSize: '12px' }}>Aislar agente</button>
                  <button className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: '12px' }}>Ver forense</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'toolcalls' && (
        <div className="card-base" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="table-base">
            <thead>
              <tr>
                {['AGENTE', 'TOOL', 'HORA', 'ESTADO', 'RAZÓN'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {toolCallsData.map((log: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{log.agent}</td>
                  <td className="terminal-text" style={{ color: 'var(--blue-info)', fontSize: '12px' }}>{log.tool}</td>
                  <td className="terminal-text" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.time}</td>
                  <td>
                    <span className={`badge ${log.status === 'ALLOWED' ? 'badge-green' : log.status === 'BLOCKED' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: '10px' }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}