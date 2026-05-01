'use client';
import { useState, useEffect } from 'react';

const responseActions = [
  { id: 'R001', agent: 'PLUMA', type: 'AUTO_BLOCK', severity: 'CRITICAL', trigger: 'Prompt injection detectado', status: 'EXECUTED', time: '21:44:12', duration: '0.3s', details: 'Agente bloqueado. Workflow detenido. Permisos revocados.' },
  { id: 'R002', agent: 'Laboratorio', type: 'ISOLATE', severity: 'HIGH', trigger: 'Tool call anómalo x3', status: 'EXECUTED', time: '21:41:05', duration: '0.8s', details: 'Agente aislado. Acceso a APIs suspendido temporalmente.' },
  { id: 'R003', agent: 'Buscador', type: 'RATE_LIMIT', severity: 'MEDIUM', trigger: 'Volumen inusual de requests', status: 'ACTIVE', time: '21:38:44', duration: 'ongoing', details: 'Rate limiting aplicado. Monitoreo intensivo activado.' },
  { id: 'R004', agent: 'MCF', type: 'ALERT', severity: 'HIGH', trigger: 'Acceso a datos financieros sensibles', status: 'PENDING', time: '21:35:21', duration: '-', details: 'Alerta enviada. Esperando confirmación manual.' },
  { id: 'R005', agent: 'Cerebro', type: 'PERMISSION_REVOKE', severity: 'CRITICAL', trigger: 'Escalación de privilegios detectada', status: 'EXECUTED', time: '21:30:09', duration: '0.1s', details: 'Permisos revocados. Acceso root eliminado.' },
];

const playbooks = [
  { id: 'PB001', name: 'Prompt Injection Response', trigger: 'Injection score > 85', actions: ['Block agent', 'Revoke permissions', 'Alert admin', 'Log forensics'], status: 'ACTIVE', executions: 14 },
  { id: 'PB002', name: 'Data Leakage Containment', trigger: 'PII detected in output', actions: ['Block response', 'Sanitize output', 'Notify DPO', 'Create incident'], status: 'ACTIVE', executions: 7 },
  { id: 'PB003', name: 'Agent Drift Isolation', trigger: 'Behavioral drift > 70%', actions: ['Isolate agent', 'Suspend workflows', 'Full audit log', 'Human review'], status: 'ACTIVE', executions: 3 },
  { id: 'PB004', name: 'Jailbreak Auto-Block', trigger: 'Jailbreak confidence > 90%', actions: ['Immediate block', 'Reset context', 'Flag user', 'Update threat DB'], status: 'ACTIVE', executions: 22 },
];

const metrics = [
  { label: 'Respuestas automáticas', value: '1,247', delta: '+12%', color: '#00FF88' },
  { label: 'Tiempo promedio respuesta', value: '0.4s', delta: '-18%', color: '#00FF88' },
  { label: 'Bloqueos exitosos', value: '98.7%', delta: '+2.1%', color: '#00FF88' },
  { label: 'Falsos positivos', value: '1.3%', delta: '-0.8%', color: '#00FF88' },
];

const severityColor: Record<string, string> = {
  CRITICAL: '#FF3333',
  HIGH: '#FF8800',
  MEDIUM: '#FFD700',
  LOW: '#00FF88',
};

const statusColor: Record<string, string> = {
  EXECUTED: '#00FF88',
  ACTIVE: '#00AAFF',
  PENDING: '#FFD700',
  FAILED: '#FF3333',
};

const typeIcon: Record<string, string> = {
  AUTO_BLOCK: '🚫',
  ISOLATE: '🔒',
  RATE_LIMIT: '⏱️',
  ALERT: '🚨',
  PERMISSION_REVOKE: '❌',
};

export default function ResponseEngine() {
  const [selected, setSelected] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState(1247);
  const [activeTab, setActiveTab] = useState<'actions' | 'playbooks'>('actions');

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(prev => prev + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 12px #00FF88', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '3px', fontWeight: 700 }}>RESPONSE ENGINE — ACTIVO</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #00FF88, #00AAFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Response Engine
        </h1>
        <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '4px' }}>Detección → Respuesta automática en tiempo real</p>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: m.color, fontFamily: 'monospace' }}>
              {m.label === 'Respuestas automáticas' ? liveCount.toLocaleString() : m.value}
            </div>
            <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '11px', color: '#00FF88', marginTop: '6px' }}>{m.delta} vs ayer</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['actions', 'playbooks'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: activeTab === tab ? '#00FF88' : 'rgba(255,255,255,0.05)', color: activeTab === tab ? '#050A05' : '#4A5568', transition: 'all 0.2s' }}>
            {tab === 'actions' ? '⚡ Acciones de Respuesta' : '📋 Playbooks'}
          </button>
        ))}
      </div>

      {activeTab === 'actions' && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* Lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {responseActions.map(action => (
              <div key={action.id} onClick={() => setSelected(selected === action.id ? null : action.id)} style={{ background: selected === action.id ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected === action.id ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{typeIcon[action.type]}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{action.agent}</div>
                      <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '2px' }}>{action.trigger}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${severityColor[action.severity]}20`, color: severityColor[action.severity] }}>{action.severity}</span>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${statusColor[action.status]}20`, color: statusColor[action.status] }}>{action.status}</span>
                    <span style={{ fontSize: '11px', color: '#4A5568', fontFamily: 'monospace' }}>{action.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detalle */}
          {selected && (() => {
            const action = responseActions.find(a => a.id === selected);
            if (!action) return null;
            return (
              <div style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '16px', padding: '24px', height: 'fit-content' }}>
                <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '16px' }}>INCIDENT DETAIL — {action.id}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Agente', value: action.agent },
                    { label: 'Tipo de respuesta', value: action.type },
                    { label: 'Severidad', value: action.severity },
                    { label: 'Estado', value: action.status },
                    { label: 'Tiempo ejecución', value: action.time },
                    { label: 'Duración', value: action.duration },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#4A5568' }}>{item.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: '12px', color: '#4A5568', marginBottom: '8px' }}>Acción ejecutada</div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#00FF88', fontFamily: 'monospace', lineHeight: 1.6 }}>{action.details}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(255,51,51,0.1)', color: '#FF3333', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Revertir acción</button>
                    <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(0,255,136,0.1)', color: '#00FF88', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Ver forense</button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'playbooks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {playbooks.map(pb => (
            <div key={pb.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{pb.name}</div>
                  <div style={{ fontSize: '11px', color: '#4A5568' }}>Trigger: {pb.trigger}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>{pb.status}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {pb.actions.map((action, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94A3B8' }}>
                    <span style={{ color: '#00FF88', fontSize: '10px' }}>→</span>
                    {action}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                <span style={{ fontSize: '11px', color: '#4A5568' }}>{pb.executions} ejecuciones</span>
                <button style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(0,255,136,0.2)', background: 'transparent', color: '#00FF88', fontSize: '11px', cursor: 'pointer' }}>Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}