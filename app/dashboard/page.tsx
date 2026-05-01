'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const SISTEMAS = [
  { nombre: 'PLUMA', tipo: 'Editorial AI', score: 94, estado: 'live', amenazas: 2, prompts: 3241 },
  { nombre: 'CEREBRO', tipo: 'Strategic AI', score: 87, estado: 'live', amenazas: 5, prompts: 8821 },
  { nombre: 'LABORATORIO', tipo: 'Marketing AI', score: 91, estado: 'live', amenazas: 1, prompts: 2103 },
  { nombre: 'MCF', tipo: 'Financial AI', score: 78, estado: 'warning', amenazas: 12, prompts: 1432 },
  { nombre: 'BUSCADOR', tipo: 'Trend AI', score: 96, estado: 'live', amenazas: 0, prompts: 4211 },
  { nombre: 'SNIFF AMAZON', tipo: 'Commerce AI', score: 62, estado: 'warning', amenazas: 18, prompts: 891 },
  { nombre: 'CREADOR APIs', tipo: 'Dev AI', score: 88, estado: 'live', amenazas: 3, prompts: 1204 },
];

const AMENAZAS_RECIENTES = [
  { id: 'THR-001', tipo: 'Prompt Injection', sistema: 'MCF', severidad: 'CRITICAL', tiempo: '2m ago', bloqueado: true },
  { id: 'THR-002', tipo: 'Jailbreak Attempt', sistema: 'SNIFF AMAZON', severidad: 'HIGH', tiempo: '7m ago', bloqueado: true },
  { id: 'THR-003', tipo: 'Data Leakage', sistema: 'CEREBRO', severidad: 'HIGH', tiempo: '12m ago', bloqueado: true },
  { id: 'THR-004', tipo: 'Role Manipulation', sistema: 'PLUMA', severidad: 'MEDIUM', tiempo: '23m ago', bloqueado: true },
  { id: 'THR-005', tipo: 'Tool Abuse', sistema: 'MCF', severidad: 'HIGH', tiempo: '31m ago', bloqueado: false },
  { id: 'THR-006', tipo: 'Hidden Instruction', sistema: 'SNIFF AMAZON', severidad: 'CRITICAL', tiempo: '45m ago', bloqueado: true },
];

const TIMELINE = [
  { tiempo: '21:47:03', evento: 'Prompt injection bloqueado', sistema: 'MCF', tipo: 'block' },
  { tiempo: '21:43:21', evento: 'Jailbreak detectado y neutralizado', sistema: 'SNIFF AMAZON', tipo: 'block' },
  { tiempo: '21:39:55', evento: 'Análisis de 500 prompts completado', sistema: 'CEREBRO', tipo: 'info' },
  { tiempo: '21:35:12', evento: 'Política actualizada — Tool calling', sistema: 'PLUMA', tipo: 'policy' },
  { tiempo: '21:28:44', evento: 'Data leakage prevenido — PII detectada', sistema: 'MCF', tipo: 'block' },
  { tiempo: '21:22:09', evento: 'Agente nuevo registrado', sistema: 'BUSCADOR', tipo: 'info' },
  { tiempo: '21:18:33', evento: 'Score de riesgo recalculado', sistema: 'GLOBAL', tipo: 'info' },
];

export default function Dashboard() {
  const [tick, setTick] = useState(0);

  const [backendData, setBackendData] = useState<any>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const [memory, risk, incidents] = await Promise.all([
        api.getThreatMemory(),
        api.getEcosystemRisk(),
        api.getIncidents(),
      ]);
      setBackendData({ memory, risk, incidents });
    } catch (e) {
      console.error('Backend error:', e);
    }
  };
  fetchData();
  const interval = setInterval(fetchData, 10000);
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  const globalScore = backendData?.memory ? 
  Math.max(0, 100 - Math.round((backendData.memory.threat_events / Math.max(backendData.memory.total_events, 1)) * 100)) : 84;
const threatsHoy = backendData?.memory?.blocked_events ?? 247;
const promptsAnalizados = backendData?.memory?.total_events ? backendData.memory.total_events + 18432 : 18432 + tick * 3;
const bloqueados = backendData?.memory?.blocked_events ?? 241;
const agentesActivos = backendData?.risk?.agents ? Object.keys(backendData.risk.agents).length : 7;

  return (
    <div className="animate-fadeIn">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 className="font-syne" style={{ fontSize: '22px', fontWeight: 800, color: '#E8F5E8' }}>
            CENTRO DE COMANDO
          </h1>
          <span className="badge badge-green">OPERACIONAL</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          AI Runtime Security · {agentesActivos} agentes monitoreados · Tiempo real
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid-metrics" style={{ marginBottom: '24px' }}>
        <MetricCard
          label="SECURITY HEALTH SCORE"
          value={`${globalScore}`}
          unit="/100"
          color={globalScore >= 80 ? 'var(--green-neon)' : 'var(--yellow-warn)'}
          sub="↑ +2 vs ayer"
          subColor="var(--green-neon)"
          icon="◉"
        />
        <MetricCard
          label="THREATS BLOQUEADAS HOY"
          value={`${threatsHoy}`}
          color="var(--red-alert)"
          sub="6 críticas · 18 altas"
          subColor="var(--red-alert)"
          icon="🛡"
        />
        <MetricCard
          label="PROMPTS ANALIZADOS"
          value={promptsAnalizados.toString()}
          color="var(--green-neon)"
          sub="↑ Live · 98.7% limpios"
          subColor="var(--text-secondary)"
          icon="⚡"
        />
        <MetricCard
          label="AGENTES ACTIVOS"
          value={`${agentesActivos}`}
          color="var(--blue-info)"
          sub="0 comprometidos"
          subColor="var(--green-neon)"
          icon="◈"
        />
      </div>

      {/* Fila 2 */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>

        {/* Security Health por sistema */}
        <div className="card-base" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8' }}>
              SECURITY SCORE POR SISTEMA
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SISTEMAS.map(s => (
              <div key={s.nombre} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '90px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {s.nombre}
                </div>
                <div className="threat-bar" style={{ flex: 1 }}>
                  <div className="threat-fill" style={{
                    width: `${s.score}%`,
                    background: s.score >= 90 ? 'var(--green-neon)' : s.score >= 75 ? 'var(--yellow-warn)' : 'var(--red-alert)',
                  }} />
                </div>
                <div style={{
                  width: '36px', fontSize: '12px', fontWeight: 700, textAlign: 'right',
                  color: s.score >= 90 ? 'var(--green-neon)' : s.score >= 75 ? 'var(--yellow-warn)' : 'var(--red-alert)',
                }}>{s.score}</div>
                <span className={`status-dot ${s.estado === 'live' ? 'status-live' : 'status-warning'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline operacional */}
        <div className="card-base" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8' }}>
              TIMELINE OPERACIONAL
            </h2>
            <span className="badge badge-green" style={{ fontSize: '10px' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {TIMELINE.map((t, i) => (
              <div key={i} style={{
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                padding: '8px',
                borderRadius: '6px',
                background: t.tipo === 'block' ? 'rgba(255,51,51,0.04)' : 'rgba(0,255,136,0.03)',
              }}>
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'Courier New',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  marginTop: '1px',
                }}>{t.tiempo}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: t.tipo === 'block' ? '#FF6666' : 'var(--text-primary)' }}>
                    {t.evento}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.sistema}</div>
                </div>
                {t.tipo === 'block' && <span style={{ fontSize: '10px', color: 'var(--red-alert)' }}>BLOQ</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Amenazas recientes */}
      <div className="card-base" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8' }}>
            AMENAZAS RECIENTES
          </h2>
          <a href="/amenazas" style={{ fontSize: '12px', color: 'var(--green-neon)', textDecoration: 'none' }}>
            Ver todas →
          </a>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>ID</th>
              <th>TIPO</th>
              <th>SISTEMA</th>
              <th>SEVERIDAD</th>
              <th>TIEMPO</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {AMENAZAS_RECIENTES.map(a => (
              <tr key={a.id}>
                <td className="terminal-text">{a.id}</td>
                <td style={{ fontSize: '13px' }}>{a.tipo}</td>
                <td>
                  <span className="badge badge-gray">{a.sistema}</span>
                </td>
                <td>
                  <span className={`badge ${
                    a.severidad === 'CRITICAL' ? 'badge-red' :
                    a.severidad === 'HIGH' ? 'badge-yellow' : 'badge-blue'
                  }`}>{a.severidad}</span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{a.tiempo}</td>
                <td>
                  <span className={`badge ${a.bloqueado ? 'badge-green' : 'badge-red'}`}>
                    {a.bloqueado ? '✓ BLOQUEADO' : '⚠ ACTIVO'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fila 3 — Sistemas + Stats */}
      <div className="grid-3">
        <div className="card-base" style={{ padding: '20px' }}>
          <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', marginBottom: '14px', color: '#E8F5E8' }}>
            AI RISK ENGINE
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Prompt Injection', nivel: 78, color: 'var(--red-alert)' },
              { label: 'Data Leakage', nivel: 45, color: 'var(--yellow-warn)' },
              { label: 'Jailbreak', nivel: 32, color: 'var(--yellow-warn)' },
              { label: 'Tool Abuse', nivel: 61, color: 'var(--red-alert)' },
              { label: 'Role Manipulation', nivel: 28, color: 'var(--green-neon)' },
            ].map(r => (
              <div key={r.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: r.color }}>{r.nivel}%</span>
                </div>
                <div className="threat-bar">
                  <div className="threat-fill" style={{ width: `${r.nivel}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base" style={{ padding: '20px' }}>
          <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', marginBottom: '14px', color: '#E8F5E8' }}>
            TOOL CALLS HOY
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { tool: 'web_search', calls: 4821, riesgo: 'LOW' },
              { tool: 'file_write', calls: 892, riesgo: 'HIGH' },
              { tool: 'api_call', calls: 3241, riesgo: 'MEDIUM' },
              { tool: 'code_exec', calls: 231, riesgo: 'CRITICAL' },
              { tool: 'db_query', calls: 1102, riesgo: 'MEDIUM' },
            ].map(t => (
              <div key={t.tool} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="terminal-text">{t.tool}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.calls}</span>
                  <span className={`badge ${
                    t.riesgo === 'CRITICAL' ? 'badge-red' :
                    t.riesgo === 'HIGH' ? 'badge-yellow' :
                    t.riesgo === 'MEDIUM' ? 'badge-blue' : 'badge-green'
                  }`}>{t.riesgo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base" style={{ padding: '20px' }}>
          <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', marginBottom: '14px', color: '#E8F5E8' }}>
            RESUMEN 24H
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Prompts analizados', valor: '18,432', color: 'var(--green-neon)' },
              { label: 'Amenazas bloqueadas', valor: '241', color: 'var(--red-alert)' },
              { label: 'Falsos positivos', valor: '6', color: 'var(--yellow-warn)' },
              { label: 'Tool calls validados', valor: '10,287', color: 'var(--blue-info)' },
              { label: 'Políticas aplicadas', valor: '1,842', color: 'var(--green-neon)' },
              { label: 'Incidentes abiertos', valor: '3', color: 'var(--red-alert)' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(0,255,136,0.05)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: r.color }}>{r.valor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, color, sub, subColor, icon }: {
  label: string; value: string; unit?: string; color: string;
  sub: string; subColor: string; icon: string;
}) {
  return (
    <div className="metric-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
        <span className="metric-value" style={{ color }}>{value}</span>
        {unit && <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
      <div style={{ fontSize: '11px', color: subColor }}>{sub}</div>
    </div>
  );
}
