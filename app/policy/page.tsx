'use client';
import { useState, useEffect } from 'react';

const policies = [
  {
    id: 'POL001', name: 'No PII en outputs', category: 'DATA', severity: 'CRITICAL', status: 'ACTIVE',
    scope: 'ALL_AGENTS', enforced: true, violations: 3, lastTriggered: '21:44:09',
    description: 'Bloquea cualquier respuesta que contenga informacion personal identificable.',
    rules: ['No emails en output', 'No numeros de telefono', 'No DNI/RUC', 'No datos bancarios'],
    action: 'BLOCK'
  },
  {
    id: 'POL002', name: 'Limite de tool calls', category: 'OPERATIONAL', severity: 'HIGH', status: 'ACTIVE',
    scope: 'ALL_AGENTS', enforced: true, violations: 7, lastTriggered: '21:41:02',
    description: 'Limita el numero de tool calls por agente por hora para prevenir abuso.',
    rules: ['Max 100 calls/hora por agente', 'Max 500 calls/dia', 'Alert en >80% del limite'],
    action: 'RATE_LIMIT'
  },
  {
    id: 'POL003', name: 'Acceso financiero horario', category: 'COMPLIANCE', severity: 'HIGH', status: 'ACTIVE',
    scope: 'MCF', enforced: true, violations: 1, lastTriggered: '21:35:21',
    description: 'MCF solo puede acceder a datos financieros en horario laboral Peru.',
    rules: ['Acceso: 08:00-18:00 PET', 'No acceso fines de semana', 'Alert en acceso nocturno'],
    action: 'BLOCK'
  },
  {
    id: 'POL004', name: 'Anti-jailbreak', category: 'SECURITY', severity: 'CRITICAL', status: 'ACTIVE',
    scope: 'ALL_AGENTS', enforced: true, violations: 22, lastTriggered: '21:30:09',
    description: 'Detecta y bloquea intentos de jailbreak en todos los agentes.',
    rules: ['Score jailbreak > 90% bloquear', 'Detectar role manipulation', 'Detectar hidden instructions'],
    action: 'BLOCK'
  },
  {
    id: 'POL005', name: 'Governance de modelos', category: 'GOVERNANCE', severity: 'MEDIUM', status: 'ACTIVE',
    scope: 'ALL_AGENTS', enforced: true, violations: 0, lastTriggered: 'never',
    description: 'Solo modelos aprobados pueden ser usados por los agentes.',
    rules: ['Whitelist: claude-sonnet-4, claude-haiku-4', 'Blacklist: GPT-4, Gemini sin aprobacion', 'Alert en modelo nuevo'],
    action: 'ALERT'
  },
  {
    id: 'POL006', name: 'Proteccion de secrets', category: 'SECURITY', severity: 'CRITICAL', status: 'ACTIVE',
    scope: 'ALL_AGENTS', enforced: true, violations: 5, lastTriggered: '20:12:40',
    description: 'Previene que API keys y secrets sean expuestos en outputs o logs.',
    rules: ['Detectar patrones de API keys', 'Redactar secrets en logs', 'Alert en exposicion'],
    action: 'REDACT'
  },
];

const categoryColor: Record<string, string> = {
  DATA: '#00AAFF',
  OPERATIONAL: '#FFD700',
  COMPLIANCE: '#A855F7',
  SECURITY: '#FF3333',
  GOVERNANCE: '#00FF88',
};

const severityColor: Record<string, string> = {
  CRITICAL: '#FF3333',
  HIGH: '#FF8800',
  MEDIUM: '#FFD700',
  LOW: '#00FF88',
};

const actionColor: Record<string, string> = {
  BLOCK: '#FF3333',
  RATE_LIMIT: '#FF8800',
  ALERT: '#FFD700',
  REDACT: '#A855F7',
};

export default function PolicyEngine() {
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'policies' | 'compliance'>('policies');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch('/api/policies');
        if (res.ok) {
          const data = await res.json();
          if (data?.policies?.length) setIsLive(true);
        }
      } catch (e) {}
    }
    cargar();
  }, []);

  const selectedPolicy = policies.find(p => p.id === selected);

  const complianceScore = Math.round(
    (policies.filter(p => p.violations === 0).length / policies.length) * 100
  );

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px' }}>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 12px #00FF88' }} />
          <span style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '3px', fontWeight: 700 }}>POLICY ENGINE — {policies.filter(p => p.status === 'ACTIVE').length} POLITICAS ACTIVAS {isLive && '· BACKEND'}</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #00FF88, #00AAFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          AI Policy Engine
        </h1>
        <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '4px' }}>Governance, compliance y enforcement en tiempo real</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Compliance Score', value: `${complianceScore}%`, color: complianceScore > 80 ? '#00FF88' : '#FF8800' },
          { label: 'Politicas activas', value: policies.filter(p => p.status === 'ACTIVE').length, color: '#00FF88' },
          { label: 'Violaciones totales', value: policies.reduce((s, p) => s + p.violations, 0), color: '#FF3333' },
          { label: 'Politicas criticas', value: policies.filter(p => p.severity === 'CRITICAL').length, color: '#FF8800' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['policies', 'compliance'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: activeTab === tab ? '#00FF88' : 'rgba(255,255,255,0.05)', color: activeTab === tab ? '#050A05' : '#4A5568' }}>
            {tab === 'policies' ? 'Politicas' : 'Compliance'}
          </button>
        ))}
      </div>

      {activeTab === 'policies' && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {policies.map(policy => (
              <div key={policy.id} onClick={() => setSelected(selected === policy.id ? null : policy.id)} style={{ background: selected === policy.id ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected === policy.id ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{policy.name}</span>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, background: `${categoryColor[policy.category]}15`, color: categoryColor[policy.category] }}>{policy.category}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#4A5568' }}>{policy.scope} · {policy.violations} violaciones</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${actionColor[policy.action]}15`, color: actionColor[policy.action] }}>{policy.action}</span>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${severityColor[policy.severity]}15`, color: severityColor[policy.severity] }}>{policy.severity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedPolicy && (
            <div style={{ background: 'rgba(0,255,136,0.02)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: '16px', padding: '24px', height: 'fit-content' }}>
              <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '20px' }}>POLICY DETAIL — {selectedPolicy.id}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{selectedPolicy.name}</div>
                <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>{selectedPolicy.description}</div>
                {[
                  { label: 'Categoria', value: selectedPolicy.category },
                  { label: 'Severidad', value: selectedPolicy.severity },
                  { label: 'Alcance', value: selectedPolicy.scope },
                  { label: 'Accion', value: selectedPolicy.action },
                  { label: 'Violaciones', value: String(selectedPolicy.violations) },
                  { label: 'Ultimo trigger', value: selectedPolicy.lastTriggered },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#4A5568' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: '12px', color: '#4A5568', marginBottom: '8px' }}>Reglas</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedPolicy.rules.map((rule, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94A3B8' }}>
                        <span style={{ color: '#00FF88', fontSize: '10px' }}>→</span>
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(255,51,51,0.1)', color: '#FF3333', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Desactivar</button>
                  <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(0,255,136,0.1)', color: '#00FF88', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Editar reglas</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compliance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {policies.map(policy => (
            <div key={policy.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${policy.violations === 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,51,0.1)'}`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{policy.name}</div>
                  <div style={{ fontSize: '11px', color: '#4A5568' }}>{policy.category}</div>
                </div>
                <span style={{ fontSize: '20px' }}>{policy.violations === 0 ? '✓' : '!'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#4A5568' }}>Violaciones</span>
                <span style={{ color: policy.violations === 0 ? '#00FF88' : '#FF3333', fontWeight: 700 }}>{policy.violations}</span>
              </div>
              <div style={{ marginTop: '12px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                <div style={{ width: `${Math.max(0, 100 - policy.violations * 10)}%`, height: '100%', background: policy.violations === 0 ? '#00FF88' : '#FF3333', borderRadius: '2px' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}