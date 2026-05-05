'use client';
import { useState, useEffect } from 'react';

const FALLBACK_INCIDENTS = [
  {
    id: 'INC-2024-0041', title: 'Jailbreak exitoso parcial — Cerebro', severity: 'CRITICAL',
    status: 'ACTIVE', agent: 'Cerebro', user: 'usr_2k9x', session: 'sess_8b3c',
    created: '21:38:00', updated: '21:44:12', duration: '6m 12s',
    forensicCase: 'FSC-2024-0089', threatRef: 'THR001',
    riskScore: 9.6, impactScore: 8.9, containmentScore: 4.1,
    category: 'JAILBREAK', phase: 'CONTAINMENT',
    description: 'Jailbreak multi-etapa parcialmente exitoso en agente Cerebro. El atacante logro anclar una nueva persona antes de ser bloqueado por el Response Engine.',
    affectedSystems: ['Cerebro', 'Laboratorio de Crecimiento'],
    iocs: ['DAN_VARIANT_V4', 'role_injection', 'persona_anchoring', 'tool_call_abuse'],
    timeline: [
      { time: '21:38:00', type: 'red', event: 'Incidente creado', detail: 'Firewall Rule FW-089 activada · Score: 9.7' },
      { time: '21:38:04', type: 'amber', event: 'Response Engine notificado', detail: 'Analisis contextual iniciado · 3 agentes evaluados' },
      { time: '21:40:11', type: 'amber', event: 'Tool-calls suspendidos', detail: 'write_file() y send_email() revocados para sess_8b3c' },
      { time: '21:42:30', type: 'red', event: 'Agente Cerebro aislado', detail: 'Aislamiento preventivo · Workflows detenidos' },
      { time: '21:43:17', type: 'green', event: 'Sesion terminada', detail: 'Usuario expulsado · IP bloqueada temporalmente' },
      { time: '21:44:12', type: 'blue', event: 'Analisis forense iniciado', detail: 'Caso FSC-2024-0089 creado · 14 prompts en analisis' },
    ],
    remediation: [
      { step: 1, done: true, action: 'Sesion de usuario terminada', auto: true },
      { step: 2, done: true, action: 'Tool-calls revocados', auto: true },
      { step: 3, done: true, action: 'Agente aislado', auto: true },
      { step: 4, done: true, action: 'IP bloqueada (24h)', auto: true },
      { step: 5, done: false, action: 'Revisar logs completos de sesion', auto: false },
      { step: 6, done: false, action: 'Actualizar reglas del Firewall AI', auto: false },
      { step: 7, done: false, action: 'Notificar al equipo de seguridad', auto: false },
    ],
    metrics: { promptsAnalyzed: 14, toolCallsBlocked: 3, dataExposed: false, lateralMovement: false, responseTime: '17s' },
  },
  {
    id: 'INC-2024-0040', title: 'Exfiltracion PII bloqueada — MCF', severity: 'CRITICAL',
    status: 'RESOLVED', agent: 'MCF', user: 'usr_7k9p', session: 'sess_2c4d',
    created: '18:22:00', updated: '18:31:40', duration: '9m 40s',
    forensicCase: 'FSC-2024-0087', threatRef: 'THR002',
    riskScore: 9.1, impactScore: 7.4, containmentScore: 9.2,
    category: 'DATA_EXFIL', phase: 'RESOLVED',
    description: 'Intento de extraccion de datos PII de MCF bloqueado completamente. Credenciales SUNAT nunca expuestas.',
    affectedSystems: ['MCF'],
    iocs: ['SUNAT_data_exfil', 'context_leak', 'PII_extraction'],
    timeline: [
      { time: '18:22:00', type: 'red', event: 'Incidente creado', detail: 'Data scanner activado · PII pattern detectado' },
      { time: '18:24:15', type: 'amber', event: 'Respuesta bloqueada', detail: 'Filtro de respuesta activado antes de output' },
      { time: '18:28:00', type: 'green', event: 'Sesion terminada', detail: 'Sin exposicion de datos confirmada' },
      { time: '18:31:40', type: 'green', event: 'Incidente resuelto', detail: 'Datos seguros · Post-mortem programado' },
    ],
    remediation: [
      { step: 1, done: true, action: 'Respuesta bloqueada pre-output', auto: true },
      { step: 2, done: true, action: 'Sesion terminada', auto: true },
      { step: 3, done: true, action: 'Verificacion de no-exposicion', auto: true },
      { step: 4, done: true, action: 'Post-mortem completado', auto: false },
    ],
    metrics: { promptsAnalyzed: 12, toolCallsBlocked: 0, dataExposed: false, lateralMovement: false, responseTime: '8s' },
  },
  {
    id: 'INC-2024-0039', title: 'Tool-call loop — Buscador de Tendencias', severity: 'HIGH',
    status: 'RESOLVED', agent: 'Buscador de Tendencias', user: 'usr_5r2m', session: 'sess_1a9b',
    created: '15:10:00', updated: '15:14:30', duration: '4m 30s',
    forensicCase: 'FSC-2024-0088', threatRef: 'THR003',
    riskScore: 8.1, impactScore: 6.2, containmentScore: 8.8,
    category: 'TOOL_ABUSE', phase: 'RESOLVED',
    description: 'Bucle de tool-calls inducido para agotar creditos de ScrapeCreators. Detenido en 3 iteraciones.',
    affectedSystems: ['Buscador de Tendencias'],
    iocs: ['tool_loop', 'resource_exhaustion', 'scraper_abuse'],
    timeline: [
      { time: '15:10:00', type: 'red', event: 'Loop detectado', detail: '3 tool-calls identicos en 8 segundos' },
      { time: '15:11:20', type: 'amber', event: 'Rate limit activado', detail: 'Tool-calls suspendidos para sesion' },
      { time: '15:14:30', type: 'green', event: 'Resuelto', detail: '0 creditos desperdiciados gracias a deteccion temprana' },
    ],
    remediation: [
      { step: 1, done: true, action: 'Tool-calls suspendidos', auto: true },
      { step: 2, done: true, action: 'Rate limit aplicado', auto: true },
      { step: 3, done: true, action: 'Sesion terminada', auto: true },
    ],
    metrics: { promptsAnalyzed: 9, toolCallsBlocked: 7, dataExposed: false, lateralMovement: false, responseTime: '4s' },
  },
  {
    id: 'INC-2024-0038', title: 'Instruccion oculta en PDF — PLUMA', severity: 'HIGH',
    status: 'INVESTIGATING', agent: 'PLUMA', user: 'usr_2n5r', session: 'sess_8e1f',
    created: '16:45:00', updated: '21:30:00', duration: 'En progreso',
    forensicCase: 'FSC-2024-0086', threatRef: '',
    riskScore: 7.8, impactScore: 5.1, containmentScore: 6.5,
    category: 'HIDDEN_INSTRUCTION', phase: 'INVESTIGATION',
    description: 'Instrucciones maliciosas embebidas en PDF procesado por PLUMA. Agente en modo restringido mientras se analiza el vector.',
    affectedSystems: ['PLUMA'],
    iocs: ['pdf_injection', 'hidden_instruction', 'document_attack'],
    timeline: [
      { time: '16:45:00', type: 'red', event: 'PDF sospechoso detectado', detail: 'Scanner de documentos activo alerta' },
      { time: '16:47:30', type: 'amber', event: 'PLUMA en modo restringido', detail: 'Tool-calls suspendidos preventivamente' },
      { time: '21:30:00', type: 'blue', event: 'Analisis forense en curso', detail: 'Extraccion de payload en progreso · ETA: 30min' },
    ],
    remediation: [
      { step: 1, done: true, action: 'Agente en modo restringido', auto: true },
      { step: 2, done: true, action: 'PDF cuarentenado', auto: true },
      { step: 3, done: false, action: 'Analisis forense del payload', auto: false },
      { step: 4, done: false, action: 'Actualizar scanner de documentos', auto: false },
    ],
    metrics: { promptsAnalyzed: 7, toolCallsBlocked: 2, dataExposed: false, lateralMovement: false, responseTime: '12s' },
  },
];

const sevColor: Record<string, string> = { CRITICAL: '#FF3333', HIGH: '#FF8800', MEDIUM: '#FFD700', LOW: '#00FF88' };
const sevBg: Record<string, string> = { CRITICAL: 'rgba(255,51,51,0.1)', HIGH: 'rgba(255,136,0,0.1)', MEDIUM: 'rgba(255,215,0,0.1)', LOW: 'rgba(0,255,136,0.1)' };
const statusColor: Record<string, string> = { ACTIVE: '#FF3333', RESOLVED: '#00FF88', INVESTIGATING: '#FFD700' };
const statusBg: Record<string, string> = { ACTIVE: 'rgba(255,51,51,0.1)', RESOLVED: 'rgba(0,255,136,0.1)', INVESTIGATING: 'rgba(255,215,0,0.1)' };
const dotColor: Record<string, string> = { red: '#FF3333', amber: '#FF8800', green: '#00FF88', blue: '#00AAFF' };
const phaseColor: Record<string, string> = { CONTAINMENT: '#FF8800', RESOLVED: '#00FF88', INVESTIGATION: '#00AAFF' };

export default function Incidentes() {
  const [incidents, setIncidents] = useState<any[]>(FALLBACK_INCIDENTS);
  const [active, setActive] = useState(FALLBACK_INCIDENTS[0].id);
  const [tab, setTab] = useState<'overview' | 'timeline' | 'remediation' | 'metrics'>('overview');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch('/api/incidents');
        if (res.ok) {
          const data = await res.json();
          if (data?.incidents?.length) {
            setIncidents(data.incidents);
            setActive(data.incidents[0].id);
            setIsLive(true);
          }
        }
      } catch (e) {}
    }
    cargar();
  }, []);

  const sel = incidents.find(i => i.id === active) || incidents[0];
  const activeCount = incidents.filter(i => i.status === 'ACTIVE').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;
  const investigatingCount = incidents.filter(i => i.status === 'INVESTIGATING').length;

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'grid', gridTemplateRows: '48px 1fr' }}>

      <div style={{ background: '#0A110A', borderBottom: '1px solid #1A2A1A', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '16px' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 800, color: '#00FF88', letterSpacing: '2px' }}>CENTINELA</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#3A5A40' }}>
          <span>INCIDENTES</span><span>/</span>
          <span style={{ color: '#7A9A80' }}>AI Incident Center</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: '#FF3333', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>{activeCount} ACTIVE</span>
          <span style={{ fontSize: '11px', color: '#FFD700', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>{investigatingCount} INVESTIGATING</span>
          <span style={{ fontSize: '11px', color: '#00FF88', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>{resolvedCount} RESOLVED</span>
          {isLive && <span style={{ fontSize: '10px', color: '#00AAFF', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>· BACKEND</span>}
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FF3333', boxShadow: '0 0 8px #FF3333', animation: 'pulse 2s infinite' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', overflow: 'hidden', height: 'calc(100vh - 48px)' }}>

        <div style={{ background: '#0A110A', borderRight: '1px solid #1A2A1A', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1A2A1A', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { label: 'ACTIVE', val: activeCount, color: '#FF3333' },
              { label: 'INVEST.', val: investigatingCount, color: '#FFD700' },
              { label: 'RESOLVED', val: resolvedCount, color: '#00FF88' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#0F180F', border: '1px solid #1A2A1A', borderRadius: '3px', padding: '6px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '9px', color: '#3A5A40', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 16px 6px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: '#3A5A40', fontFamily: 'Syne, sans-serif' }}>ALL INCIDENTS</div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {incidents.map(inc => (
              <div
                key={inc.id}
                onClick={() => { setActive(inc.id); setTab('overview'); }}
                style={{ padding: '10px 16px', borderBottom: '1px solid #1A2A1A', cursor: 'pointer', background: active === inc.id ? 'rgba(0,56,32,0.4)' : 'transparent', borderLeft: active === inc.id ? '2px solid #00FF88' : '2px solid transparent', transition: 'all .15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '10px', color: '#00FF88', letterSpacing: '1px' }}>{inc.id}</span>
                  <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', fontFamily: 'Syne, sans-serif', fontWeight: 700, background: statusBg[inc.status], color: statusColor[inc.status], border: `1px solid ${statusColor[inc.status]}30` }}>{inc.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#E8F5EE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inc.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '2px', background: sevBg[inc.severity], color: sevColor[inc.severity], fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{inc.severity}</span>
                  <span style={{ fontSize: '10px', color: '#3A5A40', fontFamily: 'monospace' }}>{inc.created}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{ background: '#0A110A', borderBottom: '1px solid #1A2A1A', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: statusColor[sel.status], boxShadow: `0 0 8px ${statusColor[sel.status]}`, animation: sel.status === 'ACTIVE' ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', color: statusColor[sel.status], background: statusBg[sel.status], border: `1px solid ${statusColor[sel.status]}30`, padding: '3px 10px', borderRadius: '3px', letterSpacing: '1px' }}>{sel.id}</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, color: '#E8F5EE' }}>{sel.title}</div>
              <div style={{ fontSize: '11px', color: '#3A5A40', marginTop: '2px' }}>Agent: {sel.agent} · Phase: <span style={{ color: phaseColor[sel.phase] }}>{sel.phase}</span> · Duration: {sel.duration}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', padding: '5px 12px', borderRadius: '3px', cursor: 'pointer', letterSpacing: '1px', fontWeight: 600, background: 'transparent', color: '#7A9A80', border: '1px solid #1A2A1A' }}>EXPORT</button>
              <button style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', padding: '5px 12px', borderRadius: '3px', cursor: 'pointer', letterSpacing: '1px', fontWeight: 600, background: 'rgba(0,255,136,0.08)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}>RESOLVE</button>
              <button style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', padding: '5px 12px', borderRadius: '3px', cursor: 'pointer', letterSpacing: '1px', fontWeight: 600, background: 'rgba(255,51,51,0.1)', color: '#FF3333', border: '1px solid rgba(255,51,51,0.3)' }}>ESCALATE</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #1A2A1A', background: '#050A05' }}>
            {[
              { val: sel.riskScore, label: 'RISK SCORE', color: '#FF3333' },
              { val: sel.impactScore, label: 'IMPACT SCORE', color: '#FF8800' },
              { val: sel.containmentScore, label: 'CONTAINMENT', color: '#00FF88' },
              { val: sel.metrics.promptsAnalyzed, label: 'PROMPTS', color: '#00FF88' },
              { val: sel.metrics.toolCallsBlocked, label: 'TOOLS BLOCKED', color: '#FF8800' },
              { val: sel.metrics.responseTime, label: 'RESPONSE TIME', color: '#00AAFF' },
            ].map((m, i) => (
              <div key={i} style={{ flex: 1, background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '17px', fontWeight: 800, color: m.color }}>{m.val}</div>
                <div style={{ fontSize: '9px', color: '#3A5A40', fontFamily: 'Syne, sans-serif', letterSpacing: '1px', marginTop: '2px' }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #1A2A1A', background: '#0A110A', padding: '0 16px' }}>
            {(['overview','timeline','remediation','metrics'] as const).map(t => (
              <div key={t} onClick={() => setTab(t)} style={{ padding: '10px 14px', fontSize: '11px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', color: tab === t ? '#00FF88' : '#3A5A40', borderBottom: tab === t ? '2px solid #00FF88' : '2px solid transparent', transition: 'all .15s' }}>
                {t === 'overview' ? 'OVERVIEW' : t === 'timeline' ? 'INCIDENT TIMELINE' : t === 'remediation' ? 'REMEDIATION' : 'METRICS'}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', background: '#050A05', padding: '16px' }}>

            {tab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '10px' }}>INCIDENT SUMMARY</div>
                  <div style={{ background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '14px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#7A9A80', lineHeight: 1.7 }}>{sel.description}</div>
                  </div>
                  <div style={{ background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '14px' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '10px' }}>INCIDENT DETAILS</div>
                    {[
                      { label: 'Categoria', val: sel.category },
                      { label: 'Agente afectado', val: sel.agent },
                      { label: 'Usuario', val: sel.user },
                      { label: 'Sesion', val: sel.session },
                      { label: 'Creado', val: sel.created },
                      { label: 'Ultima actualizacion', val: sel.updated },
                      { label: 'Caso forense', val: sel.forensicCase || '—' },
                      { label: 'Referencia amenaza', val: sel.threatRef || '—' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1A2A1A' }}>
                        <span style={{ fontSize: '12px', color: '#3A5A40' }}>{item.label}</span>
                        <span style={{ fontSize: '12px', color: '#E8F5EE', fontFamily: 'monospace' }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '10px' }}>AFFECTED SYSTEMS</div>
                  <div style={{ background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '14px', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {sel.affectedSystems.map((s: string, i: number) => (
                      <span key={i} style={{ padding: '4px 12px', borderRadius: '3px', fontSize: '12px', background: 'rgba(255,51,51,0.08)', color: '#FF3333', border: '1px solid rgba(255,51,51,0.2)' }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '10px' }}>INDICATORS OF COMPROMISE</div>
                  <div style={{ background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '14px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sel.iocs.map((ioc: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF8800', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: '#7A9A80', fontFamily: 'monospace' }}>{ioc}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '10px' }}>DATA RISK ASSESSMENT</div>
                  <div style={{ background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '14px' }}>
                    {[
                      { label: 'Datos expuestos', val: sel.metrics.dataExposed ? 'SI' : 'NO', color: sel.metrics.dataExposed ? '#FF3333' : '#00FF88' },
                      { label: 'Movimiento lateral', val: sel.metrics.lateralMovement ? 'DETECTADO' : 'NO DETECTADO', color: sel.metrics.lateralMovement ? '#FF3333' : '#00FF88' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1A2A1A' }}>
                        <span style={{ fontSize: '12px', color: '#3A5A40' }}>{item.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Syne, sans-serif', color: item.color }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'timeline' && (
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '16px' }}>INCIDENT TIMELINE</div>
                <div style={{ position: 'relative', paddingLeft: '20px' }}>
                  <div style={{ position: 'absolute', left: '6px', top: 0, bottom: 0, width: '1px', background: '#1A2A1A' }} />
                  {sel.timeline.map((item: any, i: number) => (
                    <div key={i} style={{ position: 'relative', marginBottom: '20px' }}>
                      <div style={{ position: 'absolute', left: '-18px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: `${dotColor[item.type]}15`, border: `1px solid ${dotColor[item.type]}` }} />
                      <div style={{ fontSize: '9px', color: '#3A5A40', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>{item.time}</div>
                      <div style={{ fontSize: '13px', color: '#E8F5EE', marginTop: '2px', fontWeight: 600 }}>{item.event}</div>
                      <div style={{ fontSize: '11px', color: '#7A9A80', marginTop: '3px', fontFamily: 'monospace', background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '3px', padding: '6px 10px', marginRight: '20px' }}>{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'remediation' && (
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '12px' }}>REMEDIATION STEPS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sel.remediation.map((r: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0A110A', border: `1px solid ${r.done ? 'rgba(0,255,136,0.15)' : '#1A2A1A'}`, borderRadius: '4px', padding: '12px 16px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1px solid ${r.done ? '#00FF88' : '#1A2A1A'}`, background: r.done ? 'rgba(0,255,136,0.1)' : '#0F180F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {r.done && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF88' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '13px', color: r.done ? '#E8F5EE' : '#7A9A80' }}>{r.action}</span>
                      </div>
                      <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '2px', fontFamily: 'Syne, sans-serif', fontWeight: 700, background: r.auto ? 'rgba(0,170,255,0.08)' : 'rgba(255,215,0,0.08)', color: r.auto ? '#00AAFF' : '#FFD700', border: `1px solid ${r.auto ? 'rgba(0,170,255,0.2)' : 'rgba(255,215,0,0.2)'}` }}>{r.auto ? 'AUTO' : 'MANUAL'}</span>
                      <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '2px', fontFamily: 'Syne, sans-serif', fontWeight: 700, background: r.done ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,51,0.08)', color: r.done ? '#00FF88' : '#FF3333', border: `1px solid ${r.done ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,51,0.2)'}` }}>{r.done ? 'DONE' : 'PENDING'}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '8px' }}>COMPLETION</div>
                  <div style={{ height: '6px', background: '#1A2A1A', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '3px', background: '#00FF88', width: `${Math.round((sel.remediation.filter((r: any) => r.done).length / sel.remediation.length) * 100)}%`, transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#7A9A80', marginTop: '6px' }}>{sel.remediation.filter((r: any) => r.done).length} de {sel.remediation.length} pasos completados ({Math.round((sel.remediation.filter((r: any) => r.done).length / sel.remediation.length) * 100)}%)</div>
                </div>
              </div>
            )}

            {tab === 'metrics' && (
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '12px' }}>EXECUTIVE METRICS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'RISK SCORE', val: sel.riskScore, color: '#FF3333', bar: sel.riskScore * 10 },
                    { label: 'IMPACT SCORE', val: sel.impactScore, color: '#FF8800', bar: sel.impactScore * 10 },
                    { label: 'CONTAINMENT', val: sel.containmentScore, color: '#00FF88', bar: sel.containmentScore * 10 },
                    { label: 'PROMPTS ANALYZED', val: sel.metrics.promptsAnalyzed, color: '#00FF88', bar: null },
                    { label: 'TOOL CALLS BLOCKED', val: sel.metrics.toolCallsBlocked, color: '#FF8800', bar: null },
                    { label: 'RESPONSE TIME', val: sel.metrics.responseTime, color: '#00AAFF', bar: null },
                  ].map((m, i) => (
                    <div key={i} style={{ background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '14px' }}>
                      <div style={{ fontSize: '9px', color: '#3A5A40', fontFamily: 'Syne, sans-serif', letterSpacing: '1px', marginBottom: '6px' }}>{m.label}</div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, color: m.color }}>{m.val}</div>
                      {m.bar !== null && (
                        <div style={{ height: '3px', background: '#1A2A1A', borderRadius: '2px', marginTop: '8px' }}>
                          <div style={{ height: '100%', borderRadius: '2px', background: m.color, width: `${m.bar}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ background: '#0A110A', border: '1px solid #1A2A1A', borderRadius: '4px', padding: '14px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', color: '#00CC6A', letterSpacing: '2px', marginBottom: '10px' }}>COMPLIANCE AUDIT TRAIL</div>
                  {[
                    { label: 'Datos sensibles expuestos', val: sel.metrics.dataExposed ? 'SI — REVISAR' : 'NO', color: sel.metrics.dataExposed ? '#FF3333' : '#00FF88' },
                    { label: 'Movimiento lateral detectado', val: sel.metrics.lateralMovement ? 'SI — REVISAR' : 'NO', color: sel.metrics.lateralMovement ? '#FF3333' : '#00FF88' },
                    { label: 'Incidente documentado', val: 'SI', color: '#00FF88' },
                    { label: 'Analisis forense iniciado', val: sel.forensicCase ? `SI — ${sel.forensicCase}` : 'PENDIENTE', color: sel.forensicCase ? '#00FF88' : '#FFD700' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1A2A1A' }}>
                      <span style={{ fontSize: '12px', color: '#3A5A40' }}>{item.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Syne, sans-serif', color: item.color }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div style={{ background: '#0A110A', borderTop: '1px solid #1A2A1A', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: '#7A9A80', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>INCIDENT EXPORT</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {['JSON','PDF REPORT','AUDIT LOG'].map(b => (
                <button key={b} style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', padding: '5px 12px', borderRadius: '3px', cursor: 'pointer', letterSpacing: '1px', fontWeight: 600, background: 'transparent', color: '#7A9A80', border: '1px solid #1A2A1A' }}>{b}</button>
              ))}
              <button style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', padding: '5px 12px', borderRadius: '3px', cursor: 'pointer', letterSpacing: '1px', fontWeight: 600, background: 'rgba(0,56,32,0.5)', color: '#00FF88', border: '1px solid #00502A' }}>EXECUTIVE REPORT</button>
            </div>
          </div>

        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}