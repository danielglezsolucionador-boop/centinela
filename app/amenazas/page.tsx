'use client';

import { useEffect, useState } from 'react';
import { classifyDataState, DataProvenanceBadge, DataState, isVerifiedData, OperationalNotice, protectedValue } from '@/components/OperationalState';
import { api, ensureToken } from '@/lib/api';

const typeColor: Record<string, string> = { JAILBREAK: '#FF3333', DATA_EXFIL: '#FF8800', TOOL_ABUSE: '#FFD700', ROLE_MANIPULATION: '#A855F7', BUSINESS_LOGIC: '#00AAFF' };
const severityColor: Record<string, string> = { CRITICAL: '#FF3333', HIGH: '#FF8800', MEDIUM: '#FFD700', LOW: '#00FF88' };
const statusColor: Record<string, string> = { ACTIVE: '#FF3333', MITIGATED: '#00FF88', INVESTIGATING: '#FFD700' };

export default function ThreatIntelligence() {
  const [selected, setSelected] = useState<string | null>(null);
  const [threats, setThreats] = useState<any[]>([]);
  const [dbSize, setDbSize] = useState(0);
  const [dataState, setDataState] = useState<DataState>('loading');

  useEffect(() => {
    async function cargar() {
      try {
        await ensureToken();
        const data = await api.getIncidents();
        const mapped = Array.isArray(data) ? data.map((inc: any) => ({
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
          description: `Incidente detectado en agente ${inc.agent}. Accion: ${inc.policy_action}.`,
          payload: '',
          targets: [inc.agent || 'unknown'],
        })) : [];
        setThreats(mapped);
        setDbSize(mapped.length);
        setDataState('verified');
      } catch (error) {
        setThreats([]);
        setDbSize(0);
        setDataState(classifyDataState(error));
      }
    }
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, []);

  const verified = isVerifiedData(dataState);
  const selectedThreat = threats.find((t: any) => t.id === selected);

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF3333', boxShadow: '0 0 12px #FF3333' }} />
          <span style={{ fontSize: '11px', color: '#FF3333', letterSpacing: '3px', fontWeight: 700 }}>
            THREAT INTELLIGENCE - DB: {protectedValue(dataState, dbSize)} AMENAZAS
          </span>
          <DataProvenanceBadge state={dataState} />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #FF3333, #FF8800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Threat Intelligence
        </h1>
        <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '4px' }}>Base de amenazas viva - memoria historica protegida por autenticacion.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Amenazas activas', value: protectedValue(dataState, threats.filter((t: any) => t.status === 'ACTIVE').length), color: '#FF3333' },
          { label: 'Total detectadas', value: protectedValue(dataState, threats.reduce((s: number, t: any) => s + (t.detected || 0), 0)), color: '#FF8800' },
          { label: 'Total bloqueadas', value: protectedValue(dataState, threats.reduce((s: number, t: any) => s + (t.blocked || 0), 0)), color: '#00FF88' },
          { label: 'Origen LATAM', value: protectedValue(dataState, threats.filter((t: any) => t.origin === 'LATAM').length), color: '#A855F7' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {!verified ? (
        <OperationalNotice state={dataState} subject="threat intelligence" />
      ) : threats.length === 0 ? (
        <div style={{ color: '#666', textAlign: 'center', padding: 32, border: '1px solid #222', borderRadius: 8 }}>Sin amenazas verificadas en backend.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {threats.map((threat: any) => (
              <div key={threat.id} onClick={() => setSelected(selected === threat.id ? null : threat.id)} style={{ background: selected === threat.id ? 'rgba(255,51,51,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected === threat.id ? 'rgba(255,51,51,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor[threat.status] || '#FFD700', boxShadow: `0 0 6px ${statusColor[threat.status] || '#FFD700'}` }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{threat.name}</span>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, background: `${typeColor[threat.type] || '#4A5568'}15`, color: typeColor[threat.type] || '#4A5568' }}>{threat.type}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#4A5568' }}>Detectada {threat.detected}x - Bloqueada {threat.blocked}x - Confianza: {threat.confidence}%</div>
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
              <div style={{ fontSize: '11px', color: '#FF3333', letterSpacing: '2px', marginBottom: '20px' }}>THREAT DETAIL - {selectedThreat.id}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: 12 }}>{selectedThreat.name}</div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>{selectedThreat.description}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
