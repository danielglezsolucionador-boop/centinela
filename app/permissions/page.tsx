'use client';
import { useState } from 'react';

const agentPermissions = [
  {
    id: 'AGT001', name: 'PLUMA', model: 'claude-sonnet-4', status: 'MONITORED',
    permissions: [
      { name: 'write:content', level: 'WRITE', resource: 'Content DB', granted: true, lastUsed: '21:44:09', uses: 342 },
      { name: 'read:trends', level: 'READ', resource: 'Buscador API', granted: true, lastUsed: '21:43:55', uses: 128 },
      { name: 'publish:web', level: 'EXECUTE', resource: 'Web Publisher', granted: false, lastUsed: '21:44:09', uses: 14 },
      { name: 'access:anthropic', level: 'API', resource: 'Anthropic API', granted: true, lastUsed: '21:44:01', uses: 892 },
    ]
  },
  {
    id: 'AGT002', name: 'Laboratorio', model: 'claude-sonnet-4', status: 'ISOLATED',
    permissions: [
      { name: 'read:analytics', level: 'READ', resource: 'Analytics DB', granted: true, lastUsed: '21:41:02', uses: 67 },
      { name: 'post:social', level: 'EXECUTE', resource: 'Social APIs', granted: false, lastUsed: '21:41:02', uses: 23 },
      { name: 'read:contacts', level: 'READ', resource: 'CRM', granted: false, lastUsed: '21:38:44', uses: 8 },
    ]
  },
  {
    id: 'AGT003', name: 'Buscador', model: 'claude-haiku-4', status: 'ACTIVE',
    permissions: [
      { name: 'search:web', level: 'READ', resource: 'ScrapeCreators API', granted: true, lastUsed: '21:48:33', uses: 892 },
      { name: 'read:rss', level: 'READ', resource: 'RSS Feeds', granted: true, lastUsed: '21:47:11', uses: 445 },
      { name: 'write:cache', level: 'WRITE', resource: 'Cache DB', granted: true, lastUsed: '21:48:33', uses: 892 },
    ]
  },
  {
    id: 'AGT004', name: 'MCF', model: 'claude-sonnet-4', status: 'MONITORED',
    permissions: [
      { name: 'read:financial', level: 'READ', resource: 'Financial DB', granted: true, lastUsed: '21:35:21', uses: 34 },
      { name: 'write:reports', level: 'WRITE', resource: 'Reports DB', granted: true, lastUsed: '21:30:09', uses: 12 },
      { name: 'access:sunat', level: 'API', resource: 'SUNAT API', granted: true, lastUsed: '21:35:21', uses: 7 },
      { name: 'transfer:funds', level: 'EXECUTE', resource: 'Banking API', granted: false, lastUsed: 'never', uses: 0 },
    ]
  },
  {
    id: 'AGT005', name: 'Cerebro', model: 'claude-sonnet-4', status: 'ACTIVE',
    permissions: [
      { name: 'orchestrate:all', level: 'ADMIN', resource: 'All Agents', granted: true, lastUsed: '21:49:01', uses: 1247 },
      { name: 'read:all', level: 'READ', resource: 'All Systems', granted: true, lastUsed: '21:49:01', uses: 3421 },
      { name: 'write:logs', level: 'WRITE', resource: 'Log DB', granted: true, lastUsed: '21:49:01', uses: 2891 },
    ]
  },
];

const auditLog = [
  { time: '21:44:09', agent: 'PLUMA', action: 'REVOKED', permission: 'publish:web', by: 'CENTINELA AUTO', reason: 'Prompt injection detectado' },
  { time: '21:41:02', agent: 'Laboratorio', action: 'REVOKED', permission: 'post:social', by: 'CENTINELA AUTO', reason: 'Tool call anómalo' },
  { time: '21:35:21', agent: 'MCF', action: 'RESTRICTED', permission: 'access:sunat', by: 'Daniel González', reason: 'Acceso fuera de horario' },
  { time: '21:00:00', agent: 'Sniff Amazon', action: 'BLOCKED ALL', permission: 'ALL', by: 'CENTINELA AUTO', reason: 'Comportamiento malicioso' },
  { time: '20:30:00', agent: 'Buscador', action: 'GRANTED', permission: 'write:cache', by: 'Daniel González', reason: 'Actualización de permisos' },
];

const levelColor: Record<string, string> = {
  READ: '#00AAFF',
  WRITE: '#FFD700',
  EXECUTE: '#FF8800',
  API: '#A855F7',
  ADMIN: '#FF3333',
};

const statusColor: Record<string, string> = {
  ACTIVE: '#00FF88',
  MONITORED: '#FFD700',
  ISOLATED: '#FF8800',
  BLOCKED: '#FF3333',
};

const actionColor: Record<string, string> = {
  GRANTED: '#00FF88',
  REVOKED: '#FF3333',
  RESTRICTED: '#FFD700',
  'BLOCKED ALL': '#FF3333',
};

export default function Permissions() {
  const [selected, setSelected] = useState<string>('AGT001');
  const [activeTab, setActiveTab] = useState<'matrix' | 'audit'>('matrix');

  const agent = agentPermissions.find(a => a.id === selected);

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 12px #00FF88' }} />
          <span style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '3px', fontWeight: 700 }}>PERMISSION SYSTEM — CONTROL TOTAL</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #00FF88, #00AAFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Agent Permissions
        </h1>
        <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '4px' }}>Control granular de permisos por agente, recurso y acción</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Permisos activos', value: agentPermissions.flatMap(a => a.permissions).filter(p => p.granted).length, color: '#00FF88' },
          { label: 'Permisos revocados', value: agentPermissions.flatMap(a => a.permissions).filter(p => !p.granted).length, color: '#FF3333' },
          { label: 'Cambios hoy', value: auditLog.length, color: '#FFD700' },
          { label: 'Agentes restringidos', value: agentPermissions.filter(a => a.status !== 'ACTIVE').length, color: '#FF8800' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['matrix', 'audit'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: activeTab === tab ? '#00FF88' : 'rgba(255,255,255,0.05)', color: activeTab === tab ? '#050A05' : '#4A5568' }}>
            {tab === 'matrix' ? '🔐 Matriz de Permisos' : '📋 Audit Log'}
          </button>
        ))}
      </div>

      {activeTab === 'matrix' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          {/* Agent list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {agentPermissions.map(a => (
              <div key={a.id} onClick={() => setSelected(a.id)} style={{ background: selected === a.id ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected === a.id ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{a.name}</div>
                    <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '2px' }}>{a.permissions.length} permisos</div>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: `${statusColor[a.status]}15`, color: statusColor[a.status] }}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Permission detail */}
          {agent && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{agent.name}</div>
                  <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '2px' }}>{agent.model}</div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: `${statusColor[agent.status]}15`, color: statusColor[agent.status] }}>{agent.status}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {agent.permissions.map((perm, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: perm.granted ? '#00FF88' : '#FF3333', boxShadow: `0 0 6px ${perm.granted ? '#00FF88' : '#FF3333'}` }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: '#E2E8F0' }}>{perm.name}</div>
                        <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '2px' }}>{perm.resource} · Usado {perm.uses}x · Último: {perm.lastUsed}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${levelColor[perm.level]}15`, color: levelColor[perm.level] }}>{perm.level}</span>
                      <button style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: perm.granted ? 'rgba(255,51,51,0.1)' : 'rgba(0,255,136,0.1)', color: perm.granted ? '#FF3333' : '#00FF88', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                        {perm.granted ? 'Revocar' : 'Conceder'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,51,51,0.2)', background: 'rgba(255,51,51,0.05)', color: '#FF3333', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Revocar todos los permisos
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Hora', 'Agente', 'Acción', 'Permiso', 'Por', 'Razón'].map((h, i) => (
                  <th key={i} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', color: '#4A5568', fontWeight: 600, letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLog.map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#4A5568', fontSize: '11px' }}>{log.time}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{log.agent}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${actionColor[log.action]}15`, color: actionColor[log.action] }}>{log.action}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#00AAFF', fontSize: '12px' }}>{log.permission}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94A3B8' }}>{log.by}</td>
                  <td style={{ padding: '12px 16px', fontSize: '11px', color: '#4A5568' }}>{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}