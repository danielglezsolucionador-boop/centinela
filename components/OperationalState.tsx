'use client';

import { isAuthError } from '@/lib/api';

export type DataState =
  | 'loading'
  | 'live_runtime'
  | 'verified'
  | 'auth_required'
  | 'data_unavailable'
  | 'mock'
  | 'simulated';

const META: Record<DataState, { label: string; color: string; bg: string; copy: string }> = {
  loading: {
    label: 'LOADING',
    color: '#7A9A80',
    bg: 'rgba(122,154,128,0.08)',
    copy: 'Loading operational data.',
  },
  live_runtime: {
    label: 'LIVE RUNTIME',
    color: '#00FF88',
    bg: 'rgba(0,255,136,0.08)',
    copy: 'Runtime shell is reachable. Protected data may require authentication.',
  },
  verified: {
    label: 'VERIFIED DATA',
    color: '#00FF88',
    bg: 'rgba(0,255,136,0.1)',
    copy: 'Authenticated backend data loaded successfully.',
  },
  auth_required: {
    label: 'AUTH REQUIRED',
    color: '#FFB800',
    bg: 'rgba(255,184,0,0.1)',
    copy: 'Protected operational data requires a valid session.',
  },
  data_unavailable: {
    label: 'DATA UNAVAILABLE',
    color: '#FF6B00',
    bg: 'rgba(255,107,0,0.1)',
    copy: 'Backend data could not be verified right now.',
  },
  mock: {
    label: 'MOCK/SIMULATED',
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.1)',
    copy: 'This section is using sample data, not live telemetry.',
  },
  simulated: {
    label: 'SIMULATED',
    color: '#00AAFF',
    bg: 'rgba(0,170,255,0.1)',
    copy: 'This value is simulated and should not be treated as live evidence.',
  },
};

export function classifyDataState(error: unknown): DataState {
  return isAuthError(error) ? 'auth_required' : 'data_unavailable';
}

export function isVerifiedData(state: DataState) {
  return state === 'verified';
}

export function DataProvenanceBadge({ state, label }: { state: DataState; label?: string }) {
  const meta = META[state];
  return (
    <span style={{
      fontSize: '10px',
      padding: '3px 8px',
      borderRadius: '4px',
      background: meta.bg,
      color: meta.color,
      border: `1px solid ${meta.color}33`,
      fontWeight: 800,
      letterSpacing: '1px',
      fontFamily: 'Syne, sans-serif',
      whiteSpace: 'nowrap',
    }}>
      {label || meta.label}
    </span>
  );
}

export function OperationalNotice({ state, subject = 'protected operational data' }: { state: DataState; subject?: string }) {
  if (state === 'verified' || state === 'loading' || state === 'live_runtime') return null;
  const meta = META[state];
  return (
    <div style={{
      color: meta.color,
      textAlign: 'center',
      padding: 32,
      border: `1px solid ${meta.color}33`,
      background: meta.bg,
      borderRadius: 8,
      fontSize: '13px',
      lineHeight: 1.6,
    }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, letterSpacing: '1px', marginBottom: 6 }}>
        {meta.label}
      </div>
      <div style={{ color: '#7A9A80' }}>{meta.copy}</div>
      <div style={{ color: '#4A5568', fontSize: '11px', marginTop: 6 }}>Scope: {subject}</div>
    </div>
  );
}

export function protectedValue(state: DataState, value: string | number, fallback = '--') {
  return isVerifiedData(state) ? value : fallback;
}
