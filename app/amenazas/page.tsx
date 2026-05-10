'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const FALLBACK_THREATS: any[] = [];

const typeColor: Record<string, string> = { JAILBREAK: '#FF3333', DATA_EXFIL: '#FF8800', TOOL_ABUSE: '#FFD700', ROLE_MANIPULATION: '#A855F7', BUSINESS_LOGIC: '#00AAFF' };
const severityColor: Record<string, string> = { CRITICAL: '#FF3333', HIGH: '#FF8800', MEDIUM: '#FFD700', LOW: '#00FF88' };
const statusColor: Record<string, string> = { ACTIVE: '#FF3333', MITIGATED: '#00FF88', INVESTIGATING: '#FFD700' };

export default function ThreatIntelligence() {
  const [selected, setSelected] = useState<string | null>(null);
  const [threats, setThreats] = useState<any[]>(FALLBACK_THREATS);
  const [dbSize, setDbSize] = useState(1247);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.getIncidents();
        if (Array.isArray(data) && data.length) {
          const mapped = data.map((inc: any) => ({
            id: inc.id,
            name: (inc.threat_types?.[0] || 'UNKNOWN').replace(/_/g, ' '),
            type: inc.threat_types?.[0] || 'UNKNOWN',
            severity: inc.severity?.toUpperCase() || 'MEDIUM',
            origin: 'GLOBAL',
            confidence: Math.round((inc.risk_score || 0)),
            detected: 1,
            blocked: inc.policy_action === 'BLOCK' ? 1 : 0,
            lastSeen: inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : '--',
            status: inc.status === 'OPEN' ? 'ACTIVE' : 'MITIGATED',
            description: `Incidente detectado en agente ${inc.agent}. Acción: ${inc.policy_action}.`,
            payload: '',
            targets: [inc.agent || 'unknown'],
          }));
          setThreats(mapped);
          setIsLive(true);
          setDbSize(data.length);
        }
      } catch(e) {}
    }
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, []);

  const selectedThreat = threats.find((t: any) => t.id === selected);

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px' }}>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF3333', boxShadow: '0 0 12px #FF3333' }} />
          <span style={{ fontSize: '11px', color: '#FF3333', letterSpacing: '3px', fontWeight: 700 }}>
            THREAT INTELLIGENCE — DB: {dbSize.toLocaleString()} AMENAZAS {isLive && '· BACKEND LIVE'}
          </span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #FF3333, #FF8800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Threat Intelligence
        </h1>
        <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '4px' }}>Base de amenazas viva · Dataset propietario CENTINELA · Memoria histórica</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Amenazas activas', value: threats.filter((t: any) => t.status === 'ACTIVE').length, color: '#FF3333' },
          { label: 'Total detectadas', value: threats.reduce((s: number, t: any) => s + (t.detected || 0), 0), color: '#FF8800' },
          { label: 'Total bloqueadas', value: threats.reduce((s: number, t: any) => s + (t.blocked || 0), 0), color: '#00FF88' },
          { label: 'Origen LATAM', value: threats.filter((t: any) => t.origin === 'LATAM').length, color: '#A855F7' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>🧬</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#A855F7' }}>Dataset Propietario CENTINELA</div>
          <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '2px' }}>Cada detección alimenta automáticamente la base de conocimiento. Este dataset es el moat tecnológico de CENTINELA.</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#A855F7', fontFamily: 'monospace' }}>{dbSize.toLocaleString()}</div>
          <div style={{ fontSize: '10px', color: '#4A5568' }}>amenazas registradas</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {threats.map((threat: any) => (
            <div key={threat.id} onClick={() => setSelected(selected === threat.id ? null : threat.id)} style={{ background: selected === threat.id ? 'rgba(255,51,51,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected === threat.id ? 'rgba(255,51,51,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor[threat.status] || '#FFD700', boxShadow: `0 0 6px ${statusColor[threat.status] || '#FFD700'}` }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{threat.name}</span>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, background: `${typeColor[threat.type] || '#4A5568'}15`, color: typeColor[threat.type] || '#4A5568' }}>{threat.type}</span>
                      {threat.origin === 'LATAM' && <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, background: 'rgba(168,85,247,0.15)', color: '#A855F7' }}>LATAM</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#4A5568' }}>Detectada {threat.detected}x · Bloqueada {threat.blocked}x · Confianza: {threat.confidence}%</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${severityColor[threat.severity]}15`, color: severityColor[threat.severity] }}>{threat.severity}</span>
                  <span style={{ fontSize: '11px', color: '#4A5568', fontFamily: 'monospace' }}>{threat.lastSeen}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedThreat && (
          <div style={{ background: 'rgba(255,51,51,0.02)', border: '1px solid rgba(255,51,51,0.15)', borderRadius: '16px', padding: '24px', height: 'fit-content' }}>
            <div style={{ fontSize: '11px', color: '#FF3333', letterSpacing: '2px', marginBottom: '20px' }}>THREAT DETAIL — {selectedThreat.id}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{selectedThreat.name}</div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>{selectedThreat.description}</div>
              {[
                { label: 'Tipo', value: selectedThreat.type },
                { label: 'Severidad', value: selectedThreat.severity },
                { label: 'Origen', value: selectedThreat.origin },
                { label: 'Confianza', value: `${selectedThreat.confidence}%` },
                { label: 'Detectada', value: `${selectedThreat.detected}x` },
                { label: 'Bloqueada', value: `${selectedThreat.blocked}x` },
                { label: 'Último avistamiento', value: selectedThreat.lastSeen },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#4A5568' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
              <div>
                <div style={{ fontSize: '12px', color: '#4A5568', marginBottom: '8px' }}>Payload detectado</div>
                <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#FF8800', fontFamily: 'monospace', lineHeight: 1.6, wordBreak: 'break-word' }}>{selectedThreat.payload}</div>
              </div>
              {selectedThreat.targets?.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: '#4A5568', marginBottom: '8px' }}>Agentes objetivo</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedThreat.targets.map((target: string, i: number) => (
                      <span key={i} style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', background: 'rgba(255,51,51,0.1)', color: '#FF3333' }}>{target}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(255,51,51,0.1)', color: '#FF3333', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Bloquear globalmente</button>
                <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(0,255,136,0.1)', color: '#00FF88', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Agregar al dataset</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}