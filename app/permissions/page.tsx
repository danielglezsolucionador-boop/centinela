'use client';
import { useState, useEffect } from 'react';

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
  { time: '21:41:02', agent: 'Laboratorio', action: 'REVOKED', permission: 'post:social', by: 'CENTINELA AUTO', reason: 'Tool call anomalo' },
  { time: '21:35:21', agent: 'MCF', action: 'RESTRICTED', permission: 'access:sunat', by: 'Daniel Gonzalez', reason: 'Acceso fuera de horario' },
  { time: '21:00:00', agent: 'Sniff Amazon', action: 'BLOCKED ALL', permission: 'ALL', by: 'CENTINELA AUTO', reason: 'Comportamiento malicioso' },
  { time: '20:30:00', agent: 'Buscador', action: 'GRANTED', permission: 'write:cache', by: 'Daniel Gonzalez', reason: 'Actualizacion de permisos' },
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
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch('/api/permissions');
        if (res.ok) {
          const data = await res.json();
          if (data?.agents?.length) setIsLive(true);
        }
      } catch (e) {}
    }
    cargar();
  }, []);

  const agent = agentPermissions.find(a => a.id === selected);

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px' }}>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 12px #00FF88' }} />
          <span style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '3px', fontWeight: 700 }}>PERMISSION SYSTEM — CONTROL TOTAL {isLive && '· BACKEND'}</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #00FF88, #00AAFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Agent Permissions
        </h1>
        <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '4px' }}>Control granular de permisos por agente, recurso y accion</p>
      </div>

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

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['matrix', 'audit'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: activeTab === tab ? '#00FF88' : 'rgba(255,255,255,0.05)', color: activeTab === tab ? '#050A05' : '#4A5568' }}>
            {tab === 'matrix' ? 'Permission Matrix' : 'Audit Log'}
          </button>
        ))}
      </div>

      {activeTab === 'matrix' && (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {agentPermissions.map(a => (
              <div key={a.id} onClick={() => setSelected(a.id)} style={{ background: selected === a.id ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected === a.id ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{a.name}</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: `${statusColor[a.status]}15`, color: statusColor[a.status] }}>{a.status}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '4px' }}>{a.model}</div>
                <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '2px' }}>{a.permissions.filter(p => p.granted).length} activos · {a.permissions.filter(p => !p.granted).length} revocados</div>
              </div>
            ))}
          </div>

          {agent && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '20px' }}>PERMISOS — {agent.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {agent.permissions.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: p.granted ? 'rgba(0,255,136,0.03)' : 'rgba(255,51,51,0.03)', border: `1px solid ${p.granted ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,51,0.1)'}`, borderRadius: '10px', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.granted ? '#00FF88' : '#FF3333' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '2px' }}>{p.resource}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: `${levelColor[p.level]}15`, color: levelColor[p.level] }}>{p.level}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#4A5568' }}>{p.lastUsed}</div>
                        <div style={{ fontSize: '11px', color: '#4A5568' }}>{p.uses} usos</div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '6px', fontWeight: 600, background: p.granted ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,51,0.1)', color: p.granted ? '#00FF88' : '#FF3333' }}>{p.granted ? 'GRANTED' : 'REVOKED'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '20px' }}>AUDIT LOG — HISTORIAL DE CAMBIOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {auditLog.map((log, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px 16px' }}>
                <span style={{ fontSize: '12px', color: '#4A5568', fontFamily: 'monospace', flexShrink: 0 }}>{log.time}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0', flexShrink: 0 }}>{log.agent}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${actionColor[log.action]}15`, color: actionColor[log.action], flexShrink: 0 }}>{log.action}</span>
                <span style={{ fontSize: '12px', color: '#A855F7', fontFamily: 'monospace', flexShrink: 0 }}>{log.permission}</span>
                <span style={{ fontSize: '11px', color: '#4A5568', flex: 1 }}>{log.reason}</span>
                <span style={{ fontSize: '11px', color: '#4A5568', flexShrink: 0 }}>by {log.by}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}