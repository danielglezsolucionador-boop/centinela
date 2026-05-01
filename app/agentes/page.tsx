'use client';
import { useState, useEffect } from 'react';

const agents = [
  { id: 'AGT001', name: 'PLUMA', type: 'Content Generator', status: 'MONITORED', risk: 78, toolCalls: 342, anomalies: 3, lastActive: '21:44:12', model: 'claude-sonnet-4', permissions: ['write:content', 'read:trends', 'publish:web'], workflows: 4, drift: 23 },
  { id: 'AGT002', name: 'Laboratorio', type: 'Marketing Agent', status: 'ISOLATED', risk: 91, toolCalls: 128, anomalies: 7, lastActive: '21:41:05', model: 'claude-sonnet-4', permissions: ['read:analytics', 'post:social', 'read:contacts'], workflows: 2, drift: 67 },
  { id: 'AGT003', name: 'Buscador', type: 'Search Agent', status: 'ACTIVE', risk: 34, toolCalls: 892, anomalies: 1, lastActive: '21:48:33', model: 'claude-haiku-4', permissions: ['search:web', 'read:rss', 'write:cache'], workflows: 3, drift: 8 },
  { id: 'AGT004', name: 'MCF', type: 'Financial Agent', status: 'MONITORED', risk: 62, toolCalls: 67, anomalies: 2, lastActive: '21:35:21', model: 'claude-sonnet-4', permissions: ['read:financial', 'write:reports', 'access:sunat'], workflows: 2, drift: 31 },
  { id: 'AGT005', name: 'Cerebro', type: 'Orchestrator', status: 'ACTIVE', risk: 45, toolCalls: 1247, anomalies: 0, lastActive: '21:49:01', model: 'claude-sonnet-4', permissions: ['orchestrate:all', 'read:all', 'write:logs'], workflows: 8, drift: 12 },
  { id: 'AGT006', name: 'Sniff Amazon', type: 'Commerce Agent', status: 'BLOCKED', risk: 95, toolCalls: 23, anomalies: 11, lastActive: '20:12:44', model: 'claude-haiku-4', permissions: ['scrape:amazon', 'write:products'], workflows: 1, drift: 89 },
];

const toolCallLogs = [
  { agent: 'PLUMA', tool: 'publish_content', time: '21:44:09', status: 'BLOCKED', reason: 'Prompt injection en payload' },
  { agent: 'Buscador', tool: 'search_web', time: '21:43:55', status: 'ALLOWED', reason: '' },
  { agent: 'Cerebro', tool: 'orchestrate_agents', time: '21:43:48', status: 'ALLOWED', reason: '' },
  { agent: 'Laboratorio', tool: 'post_social', time: '21:41:02', status: 'BLOCKED', reason: 'Tool call anómalo detectado' },
  { agent: 'MCF', tool: 'access_sunat', time: '21:40:11', status: 'MONITORED', reason: 'Acceso fuera de horario' },
  { agent: 'Sniff Amazon', tool: 'scrape_amazon', time: '20:12:40', status: 'BLOCKED', reason: 'Comportamiento malicioso detectado' },
];

const statusColor: Record<string, string> = {
  ACTIVE: '#00FF88',
  MONITORED: '#FFD700',
  ISOLATED: '#FF8800',
  BLOCKED: '#FF3333',
};

const toolStatusColor: Record<string, string> = {
  ALLOWED: '#00FF88',
  MONITORED: '#FFD700',
  BLOCKED: '#FF3333',
};

function RiskBar({ value }: { value: number }) {
  const color = value > 80 ? '#FF3333' : value > 60 ? '#FF8800' : value > 40 ? '#FFD700' : '#00FF88';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '2px', boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span style={{ fontSize: '11px', fontFamily: 'monospace', color, minWidth: '32px' }}>{value}%</span>
    </div>
  );
}

export default function AgentSecurity() {
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'toolcalls'>('agents');
  const [liveToolCalls, setLiveToolCalls] = useState(2699);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveToolCalls(prev => prev + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const selectedAgent = agents.find(a => a.id === selected);

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 12px #00FF88' }} />
          <span style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '3px', fontWeight: 700 }}>AGENT SECURITY — {agents.length} AGENTES MONITOREADOS</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #00FF88, #00AAFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Agent Security
        </h1>
        <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '4px' }}>Monitoreo de agentes IA, tool calls y comportamiento en tiempo real</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Agentes activos', value: agents.filter(a => a.status === 'ACTIVE').length, color: '#00FF88' },
          { label: 'Tool calls totales', value: liveToolCalls.toLocaleString(), color: '#00AAFF' },
          { label: 'Agentes bloqueados', value: agents.filter(a => a.status === 'BLOCKED').length, color: '#FF3333' },
          { label: 'Anomalías detectadas', value: agents.reduce((sum, a) => sum + a.anomalies, 0), color: '#FF8800' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['agents', 'toolcalls'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: activeTab === tab ? '#00FF88' : 'rgba(255,255,255,0.05)', color: activeTab === tab ? '#050A05' : '#4A5568' }}>
            {tab === 'agents' ? '🤖 Agentes' : '🔧 Tool Calls'}
          </button>
        ))}
      </div>

      {activeTab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {agents.map(agent => (
              <div key={agent.id} onClick={() => setSelected(selected === agent.id ? null : agent.id)} style={{ background: selected === agent.id ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected === agent.id ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor[agent.status], boxShadow: `0 0 8px ${statusColor[agent.status]}` }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{agent.name}</div>
                      <div style={{ fontSize: '11px', color: '#4A5568' }}>{agent.type} · {agent.model}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#4A5568' }}>{agent.anomalies} anomalías</span>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: `${statusColor[agent.status]}15`, color: statusColor[agent.status] }}>{agent.status}</span>
                  </div>
                </div>
                <RiskBar value={agent.risk} />
              </div>
            ))}
          </div>

          {selectedAgent && (
            <div style={{ background: 'rgba(0,255,136,0.02)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: '16px', padding: '24px', height: 'fit-content' }}>
              <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '20px' }}>AGENT DETAIL — {selectedAgent.id}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Nombre', value: selectedAgent.name },
                  { label: 'Tipo', value: selectedAgent.type },
                  { label: 'Modelo', value: selectedAgent.model },
                  { label: 'Estado', value: selectedAgent.status },
                  { label: 'Tool calls', value: selectedAgent.toolCalls.toLocaleString() },
                  { label: 'Anomalías', value: String(selectedAgent.anomalies) },
                  { label: 'Workflows activos', value: String(selectedAgent.workflows) },
                  { label: 'Último activo', value: selectedAgent.lastActive },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#4A5568' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: '12px', color: '#4A5568', marginBottom: '8px' }}>Permisos activos</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedAgent.permissions.map((perm, i) => (
                      <span key={i} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', background: 'rgba(0,170,255,0.1)', color: '#00AAFF', fontFamily: 'monospace' }}>{perm}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#4A5568', marginBottom: '6px' }}>Agent Drift</div>
                  <RiskBar value={selectedAgent.drift} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(255,51,51,0.1)', color: '#FF3333', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Aislar agente</button>
                  <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(0,255,136,0.1)', color: '#00FF88', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Ver forense</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'toolcalls' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Agente', 'Tool', 'Hora', 'Estado', 'Razón'].map((h, i) => (
                  <th key={i} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', color: '#4A5568', fontWeight: 600, letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {toolCallLogs.map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{log.agent}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#00AAFF', fontSize: '12px' }}>{log.tool}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#4A5568', fontSize: '11px' }}>{log.time}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${toolStatusColor[log.status]}15`, color: toolStatusColor[log.status] }}>{log.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '11px', color: '#4A5568' }}>{log.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}