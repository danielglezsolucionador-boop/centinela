'use client';

import { useEffect, useState } from 'react';
import { api, ensureToken } from '@/lib/api';
import {
  classifyDataState,
  DataProvenanceBadge,
  DataState,
  isVerifiedData,
  OperationalNotice,
  protectedValue,
} from '@/components/OperationalState';
import { frontendProvenance, shortCommit } from '@/lib/provenance';

type RuntimeState = {
  backendStatus?: string;
  backendDatabase?: string;
  backendCommit?: string;
  frontendCommit?: string;
  protectedStats?: {
    total_events?: number;
    total_incidents?: number;
    blocked_events?: number;
  } | null;
};

export default function Datos() {
  const [runtime, setRuntime] = useState<RuntimeState>({});
  const [dataState, setDataState] = useState<DataState>('loading');
  const [runtimeState, setRuntimeState] = useState<DataState>('loading');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [health, backendProvenance] = await Promise.all([
          api.health(),
          api.provenance(),
        ]);

        if (!active) return;
        setRuntime(prev => ({
          ...prev,
          backendStatus: health?.status,
          backendDatabase: health?.database,
          backendCommit: shortCommit(backendProvenance?.current_commit),
          frontendCommit: shortCommit(frontendProvenance.commit),
        }));
        setRuntimeState('verified');
      } catch (error) {
        if (!active) return;
        setRuntimeState(classifyDataState(error));
      }

      try {
        const token = await ensureToken();
        if (!active) return;

        if (!token) {
          setRuntime(prev => ({ ...prev, protectedStats: null }));
          setDataState('auth_required');
          return;
        }

        const stats = await api.getDbStats();
        if (!active) return;
        setRuntime(prev => ({ ...prev, protectedStats: stats }));
        setDataState('verified');
      } catch (error) {
        if (!active) return;
        setRuntime(prev => ({ ...prev, protectedStats: null }));
        setDataState(classifyDataState(error));
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const verified = isVerifiedData(dataState);
  const runtimeVerified = isVerifiedData(runtimeState);

  const cards = [
    {
      label: 'Protected events',
      value: protectedValue(dataState, runtime.protectedStats?.total_events ?? 0),
      state: dataState,
      color: '#00FF88',
    },
    {
      label: 'Protected incidents',
      value: protectedValue(dataState, runtime.protectedStats?.total_incidents ?? 0),
      state: dataState,
      color: '#FF8800',
    },
    {
      label: 'Blocked events',
      value: protectedValue(dataState, runtime.protectedStats?.blocked_events ?? 0),
      state: dataState,
      color: '#FF3333',
    },
    {
      label: 'Backend database',
      value: runtimeVerified ? runtime.backendDatabase ?? 'UNKNOWN' : '--',
      state: runtimeState,
      color: runtime.backendDatabase === 'CONNECTED' ? '#00FF88' : '#FFB800',
    },
  ];

  return (
    <div style={{ background: '#050A05', minHeight: '100vh', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 12px #00FF88' }} />
          <span style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '3px', fontWeight: 700 }}>DATA GOVERNANCE - RUNTIME VISIBILITY</span>
          <DataProvenanceBadge state={runtimeState} label="RUNTIME" />
          <DataProvenanceBadge state={dataState} label={verified ? 'VERIFIED DATA' : undefined} />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #00FF88, #00AAFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Data Visibility
        </h1>
        <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '4px' }}>
          Estado honesto de datos protegidos, runtime publico y provenance basica.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map(card => (
          <div key={card.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '18px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#4A5568', letterSpacing: '1px', textTransform: 'uppercase' }}>{card.label}</div>
              <DataProvenanceBadge state={card.state} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: card.color, fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {!verified && (
        <div style={{ marginBottom: '24px' }}>
          <OperationalNotice state={dataState} subject="protected database metrics" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '22px' }}>
          <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '18px', fontWeight: 800 }}>RUNTIME PROVENANCE</div>
          {[
            ['Frontend commit', runtime.frontendCommit ?? '--'],
            ['Backend commit', runtime.backendCommit ?? '--'],
            ['Backend status', runtime.backendStatus ?? '--'],
            ['Backend database', runtime.backendDatabase ?? '--'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 0' }}>
              <span style={{ fontSize: '12px', color: '#4A5568' }}>{label}</span>
              <span style={{ fontSize: '12px', color: '#E8F5E8', fontFamily: 'monospace', overflowWrap: 'anywhere', textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '22px' }}>
          <div style={{ fontSize: '11px', color: '#00FF88', letterSpacing: '2px', marginBottom: '18px', fontWeight: 800 }}>DATA STATE RULES</div>
          {[
            ['LIVE RUNTIME', 'La aplicacion y el backend responden, pero esto no implica datos protegidos verificados.'],
            ['AUTH REQUIRED', 'Metricas protegidas no deben renderizarse como estabilidad normal sin token valido.'],
            ['VERIFIED DATA', 'Solo se muestra cuando el backend autenticado responde correctamente.'],
            ['DATA UNAVAILABLE', 'Fallo operativo visible; nunca se maquilla como estado estable.'],
          ].map(([label, copy]) => (
            <div key={label} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 0' }}>
              <div style={{ fontSize: '12px', color: '#E8F5E8', fontWeight: 800 }}>{label}</div>
              <div style={{ fontSize: '12px', color: '#4A5568', lineHeight: 1.5, marginTop: '4px' }}>{copy}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
