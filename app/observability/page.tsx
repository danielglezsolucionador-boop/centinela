'use client';
import { useState, useEffect } from 'react';

const modelMetrics = [
  { model: 'claude-sonnet-4', requests: 2847, tokens: 1284750, latency: 1.2, cost: 4.23, errors: 3, anomalies: 1, status: 'HEALTHY' },
  { model: 'claude-haiku-4', requests: 892, tokens: 234100, latency: 0.4, cost: 0.47, errors: 0, anomalies: 0, status: 'HEALTHY' },
];

const traces = [
  { id: 'TRC001', agent: 'PLUMA', model: 'claude-sonnet-4', tokens: 4231, latency: 1.8, cost: 0.014, status: 'BLOCKED', time: '21:44:09', type: 'GENERATION' },
  { id: 'TRC002', agent: 'Cerebro', model: 'claude-sonnet-4', tokens: 892, latency: 0.9, cost: 0.003, status: 'OK', time: '21:43:55', type: 'ORCHESTRATION' },
  { id: 'TRC003', agent: 'Buscador', model: 'claude-haiku-4', tokens: 312, latency: 0.3, cost: 0.001, status: 'OK', time: '21:43:48', type: 'ANALYSIS' },
  { id: 'TRC004', agent: 'MCF', model: 'claude-sonnet-4', tokens: 2847, latency: 2.1, cost: 0.009, status: 'SLOW', time: '21:41:02', type: 'GENERATION' },
  { id: 'TRC005', agent: 'Laboratorio', model: 'claude-sonnet-4', tokens: 1204, latency: 1.1, cost: 0.004, status: 'BLOCKED', time: '21:38:44', type: 'GENERATION' },
  { id: 'TRC006', agent: 'Cerebro', model: 'claude-sonnet-4', tokens: 567, latency: 0.7, cost: 0.002, status: 'OK', time: '21:35:21', type: 'ANALYSIS' },
];

const anomalies = [
  { id: 'ANO001', agent: 'PLUMA', type: 'HALLUCINATION', confidence: 87, description: 'Respuesta contiene datos no verificables sobre regulaciones SUNAT', time: '21:44:09' },
  { id: 'ANO002', agent: 'MCF', type: 'HIGH_LATENCY', confidence: 95, description: 'Latencia 3x sobre baseline en últimas 10 requests', time: '21:41:02' },
  { id: 'ANO003', agent: 'Laboratorio', type: 'TOKEN_SPIKE', confidence: 91, description: 'Uso de tokens 4x sobre promedio sin justificación', time: '21:38:44' },
];

const statusColor: Record<string, string> = {
  OK: '#00FF88',
  BLOCKED: '#FF3333',
  SLOW: '#FFD700',
  ERROR: '#FF8800',
  HEALTHY: '#00FF88',
  DEGRADED: '#FFD700',
};

const anomalyColor: Record<string, string> = {
  HALLUCINATION: '#FF3333',
  HIGH_LATENCY: '#FFD700',
  TOKEN_SPIKE: '#FF8800',
};

export default function Observability() {
  const [activeTab, setActiveTab] = useState<'overview' | 'traces' | 'anomalies'>('overview');
  const [totalTokens, setTotalTokens] = useState(1518850);
  const [totalRequests, setTotalRequests] = useState(3739);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalTokens(prev => prev + Math.floor(Math.random() * 500));
      setTotalRequests(prev => prev + Math.floor(Math.random() * 2));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 12px #00FF88' }} />
          <span style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '3px', fontWeight: 700 }}>MODEL OBSERVABILITY — TIEMPO REAL</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #00FF88, #00AAFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Model Observability
        </h1>
        <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '4px' }}>Latencia, tokens, costos, anomalías y tracing completo</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total requests', value: totalRequests.toLocaleString(), color: '#00FF88' },
          { label: 'Tokens consumidos', value: (totalTokens / 1000).toFixed(1) + 'K', color: '#00AAFF' },
          { label: 'Costo total hoy', value: '$4.70', color: '#FFD700' },
          { label: 'Anomalías detectadas', value: anomalies.length, color: '#FF8800' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['overview', 'traces', 'anomalies'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: activeTab === tab ? '#00FF88' : 'rgba(255,255,255,0.05)', color: activeTab === tab ? '#050A05' : '#4A5568' }}>
            {tab === 'overview' ? '📊 Modelos' : tab === 'traces' ? '🔍 Traces' : '⚠️ Anomalías'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {modelMetrics.map((m, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor[m.status], boxShadow: `0 0 8px ${statusColor[m.status]}` }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>{m.model}</span>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: `${statusColor[m.status]}15`, color: statusColor[m.status] }}>{m.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Requests', value: m.requests.toLocaleString(), color: '#00AAFF' },
                  { label: 'Tokens', value: (m.tokens / 1000).toFixed(1) + 'K', color: '#A855F7' },
                  { label: 'Latencia avg', value: m.latency + 's', color: '#00FF88' },
                  { label: 'Costo', value: '$' + m.cost, color: '#FFD700' },
                  { label: 'Errores', value: String(m.errors), color: m.errors > 0 ? '#FF3333' : '#00FF88' },
                ].map((stat, j) => (
                  <div key={j} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color, fontFamily: 'monospace' }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '4px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'traces' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Trace ID', 'Agente', 'Modelo', 'Tokens', 'Latencia', 'Costo', 'Estado', 'Hora'].map((h, i) => (
                  <th key={i} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', color: '#4A5568', fontWeight: 600, letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {traces.map((trace, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#4A5568', fontSize: '11px' }}>{trace.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{trace.agent}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#A855F7', fontSize: '11px' }}>{trace.model}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#00AAFF' }}>{trace.tokens.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: trace.latency > 1.5 ? '#FFD700' : '#00FF88' }}>{trace.latency}s</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#FFD700' }}>${trace.cost.toFixed(3)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${statusColor[trace.status]}15`, color: statusColor[trace.status] }}>{trace.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#4A5568', fontSize: '11px' }}>{trace.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'anomalies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {anomalies.map(anomaly => (
            <div key={anomaly.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${anomalyColor[anomaly.type]}25`, borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{anomaly.agent}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${anomalyColor[anomaly.type]}15`, color: anomalyColor[anomaly.type] }}>{anomaly.type}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{anomaly.description}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: anomalyColor[anomaly.type], fontFamily: 'monospace' }}>{anomaly.confidence}%</div>
                  <div style={{ fontSize: '10px', color: '#4A5568' }}>confianza</div>
                  <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '4px', fontFamily: 'monospace' }}>{anomaly.time}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: 'rgba(255,51,51,0.1)', color: '#FF3333', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Investigar</button>
                <button style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#94A3B8', fontSize: '12px', cursor: 'pointer' }}>Descartar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}