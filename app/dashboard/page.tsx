'use client';

import { useState, useEffect } from 'react';
import { api, ensureToken } from '@/lib/api';

export default function Dashboard() {
  const [backendData, setBackendData] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [risk, setRisk] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await ensureToken();
        const [memory, riskData, incidentsData] = await Promise.all([
          api.getThreatMemory(),
          api.getEcosystemRisk(),
          api.getIncidents(),
        ]);
        setBackendData(memory);
        setRisk(riskData);
        setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
      } catch (e) {
        console.error('Backend error:', e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalEvents = backendData?.total_events ?? 0;
  const threatEvents = backendData?.threat_events ?? 0;
  const blockedEvents = backendData?.blocked_events ?? 0;
  const totalIncidents = backendData?.total_incidents ?? 0;

  const globalScore = totalEvents > 0
    ? Math.max(0, Math.round(100 - (threatEvents / totalEvents) * 100))
    : 100;

  const agentesActivos = risk?.agents ? Object.keys(risk.agents).length : 0;

  const amenazasRecientes = incidents.slice(0, 6).map((inc: any) => ({
    id: inc.id,
    tipo: inc.threat_types?.[0] ?? 'Amenaza detectada',
    sistema: inc.agent?.toUpperCase() ?? 'UNKNOWN',
    severidad: inc.severity ?? 'LOW',
    tiempo: inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : '-',
    bloqueado: inc.policy_action === 'BLOCK',
  }));

  const timeline = incidents.slice(0, 7).map((inc: any) => ({
    tiempo: inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : '-',
    evento: inc.policy_action === 'BLOCK'
      ? `Amenaza bloqueada — ${inc.threat_types?.[0] ?? 'desconocida'}`
      : `Amenaza detectada — ${inc.threat_types?.[0] ?? 'desconocida'}`,
    sistema: inc.agent?.toUpperCase() ?? 'UNKNOWN',
    tipo: inc.policy_action === 'BLOCK' ? 'block' : 'info',
  }));

  const sistemas = risk?.agents
    ? Object.entries(risk.agents).map(([nombre, data]: [string, any]) => ({
        nombre: nombre.toUpperCase(),
        score: Math.max(0, Math.round(100 - data.score)),
        estado: data.score >= 70 ? 'warning' : 'live',
      }))
    : [];

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
          sub="Calculado en tiempo real"
          subColor="var(--green-neon)"
          icon="◉"
        />
        <MetricCard
          label="THREATS BLOQUEADAS"
          value={`${blockedEvents}`}
          color="var(--red-alert)"
          sub={`${totalIncidents} incidentes abiertos`}
          subColor="var(--red-alert)"
          icon="🛡"
        />
        <MetricCard
          label="PROMPTS ANALIZADOS"
          value={`${totalEvents}`}
          color="var(--green-neon)"
          sub="Total histórico real"
          subColor="var(--text-secondary)"
          icon="⚡"
        />
        <MetricCard
          label="AGENTES ACTIVOS"
          value={`${agentesActivos}`}
          color="var(--blue-info)"
          sub="Monitoreados en tiempo real"
          subColor="var(--green-neon)"
          icon="◈"
        />
      </div>

      {/* Fila 2 */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>

        {/* Security Score por sistema */}
        <div className="card-base" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8' }}>
              SECURITY SCORE POR SISTEMA
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LIVE</span>
          </div>
          {sistemas.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin datos de agentes disponibles.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sistemas.map((s: any) => (
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
          )}
        </div>

        {/* Timeline operacional */}
        <div className="card-base" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#E8F5E8' }}>
              TIMELINE OPERACIONAL
            </h2>
            <span className="badge badge-green" style={{ fontSize: '10px' }}>LIVE</span>
          </div>
          {timeline.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin eventos recientes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timeline.map((t: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  padding: '8px', borderRadius: '6px',
                  background: t.tipo === 'block' ? 'rgba(255,51,51,0.04)' : 'rgba(0,255,136,0.03)',
                }}>
                  <span style={{ fontSize: '10px', fontFamily: 'Courier New', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '1px' }}>
                    {t.tiempo}
                  </span>
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
          )}
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
        {amenazasRecientes.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin amenazas recientes.</p>
        ) : (
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
              {amenazasRecientes.map((a: any) => (
                <tr key={a.id}>
                  <td className="terminal-text">{a.id}</td>
                  <td style={{ fontSize: '13px' }}>{a.tipo}</td>
                  <td><span className="badge badge-gray">{a.sistema}</span></td>
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
        )}
      </div>

      {/* Resumen 24H */}
      <div className="card-base" style={{ padding: '20px' }}>
        <h2 className="font-syne" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', marginBottom: '14px', color: '#E8F5E8' }}>
          RESUMEN HISTÓRICO REAL
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Prompts analizados', valor: totalEvents.toString(), color: 'var(--green-neon)' },
            { label: 'Amenazas bloqueadas', valor: blockedEvents.toString(), color: 'var(--red-alert)' },
            { label: 'Eventos con amenaza', valor: threatEvents.toString(), color: 'var(--yellow-warn)' },
            { label: 'Incidentes abiertos', valor: totalIncidents.toString(), color: 'var(--red-alert)' },
            { label: 'Agentes monitoreados', valor: agentesActivos.toString(), color: 'var(--blue-info)' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(0,255,136,0.05)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.label}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: r.color }}>{r.valor}</span>
            </div>
          ))}
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