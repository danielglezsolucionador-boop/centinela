'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { api, ensureToken } from '@/lib/api';
import { classifyDataState, DataProvenanceBadge, DataState, isVerifiedData, protectedValue } from '@/components/OperationalState';
import { frontendProvenance, RuntimeProvenance, shortCommit } from '@/lib/provenance';
const NAV = [
  { section: 'COMANDO', items: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Runtime', href: '/runtime' }] },
  { section: 'PROTECCION', items: [{ label: 'Firewall', href: '/firewall' }, { label: 'Response', href: '/response' }, { label: 'Agentes', href: '/agentes' }] },
  { section: 'GOVERNANCE', items: [{ label: 'Permissions', href: '/permissions' }, { label: 'Policy', href: '/policy' }, { label: 'Datos', href: '/datos' }] },
  { section: 'INTELIGENCIA', items: [{ label: 'Observability', href: '/observability' }, { label: 'Amenazas', href: '/amenazas' }, { label: 'Forensics', href: '/forensics' }, { label: 'Incidentes', href: '/incidentes' }] },
  { section: 'ANALISIS', items: [{ label: 'Grafo', href: '/grafo' }, { label: 'Reporte', href: '/reporte' }] },
];
const ALERT_HREFS = new Set(['/runtime', '/amenazas', '/incidentes']);
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dateStr, setDateStr] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [dataState, setDataState] = useState<DataState>('loading');
  const [frontendRuntimeProvenance, setFrontendRuntimeProvenance] = useState<RuntimeProvenance | null>(null);
  const [backendProvenance, setBackendProvenance] = useState<RuntimeProvenance | null>(null);
  useEffect(() => {
    const fmt = () => new Date().toLocaleString('es-PE', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    setDateStr(fmt());
    const t = setInterval(() => setDateStr(fmt()), 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await ensureToken();
        if (!token) {
          setStats(null);
          setDataState('auth_required');
          return;
        }
        const data = await api.getDbStats();
        setStats(data);
        setDataState('verified');
      } catch (error) {
        setStats(null);
        setDataState(classifyDataState(error));
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    let active = true;
    const fetchProvenance = async () => {
      try {
        const frontend = await fetch('/api/provenance', { cache: 'no-store' });
        if (frontend.ok && active) setFrontendRuntimeProvenance(await frontend.json());
      } catch {}
      try {
        const data = await api.provenance();
        if (active) setBackendProvenance(data);
      } catch {
        try {
          const health = await api.health();
          if (active) setBackendProvenance(health?.provenance ?? null);
        } catch {
          if (active) setBackendProvenance(null);
        }
      }
    };
    fetchProvenance();
    return () => { active = false; };
  }, []);
  const frontendCommit = shortCommit(frontendRuntimeProvenance?.current_commit ?? frontendProvenance.commit);
  const backendCommit = shortCommit(backendProvenance?.current_commit);
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#050A05' }}>
      <aside style={{ width: '210px', minWidth: '210px', background: '#070D07', borderRight: '1px solid #1A2A1A', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <div style={{ height: '52px', borderBottom: '1px solid #1A2A1A', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L21 6.5V12C21 16.75 17 20.85 12 22C7 20.85 3 16.75 3 12V6.5Z" stroke="#00FF88" strokeWidth="1.5" fill="rgba(0,255,136,0.1)" style={{ filter: 'drop-shadow(0 0 4px #00FF88)' }} />
            <path d="M12 7L16 9.2V12C16 14.2 14.2 16.1 12 16.8C9.8 16.1 8 14.2 8 12V9.2Z" fill="rgba(0,255,136,0.2)" stroke="#00FF88" strokeWidth="0.8" />
          </svg>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '13px', color: '#E8F5E8', letterSpacing: '3px' }}>CENTINELA</div>
            <div style={{ fontSize: '8px', color: '#2A4A2A', letterSpacing: '1.5px', fontFamily: 'Syne, sans-serif' }}>AI SECURITY</div>
          </div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: '#1A3A1A', letterSpacing: '2px', padding: '10px 10px 4px', fontFamily: 'Syne, sans-serif' }}>{group.section}</div>
              {group.items.map(item => {
                const active = pathname === item.href;
                const alert = ALERT_HREFS.has(item.href);
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', margin: '1px 0', borderRadius: '3px', borderLeft: active ? '2px solid #00FF88' : '2px solid transparent', background: active ? 'rgba(0,255,136,0.08)' : 'transparent', cursor: 'pointer', transition: 'all .15s' }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: active ? '#00FF88' : '#3A6A3A', transition: 'color .15s' }}>{item.label}</span>
                      {alert && !active && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FF3333', boxShadow: '0 0 5px #FF3333', animation: 'pulse 2s infinite', flexShrink: 0 }} />}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 14px', borderTop: '1px solid #1A2A1A', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 6px #00FF88', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '9px', color: '#2A5A2A', letterSpacing: '1px' }}>SISTEMA OPERATIVO</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF3333', boxShadow: '0 0 4px #FF3333', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '9px', color: '#2A5A2A', letterSpacing: '1px' }}>{isVerifiedData(dataState) ? `${stats?.total_incidents ?? 0} INCIDENTES` : dataState === 'auth_required' ? 'AUTH REQUIRED' : 'DATA UNAVAILABLE'}</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '8px', color: '#1A3A1A', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>FE {frontendCommit} / BE {backendCommit}</div>
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ height: '52px', background: '#070D07', borderBottom: '1px solid #1A2A1A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px #00FF88', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '11px', color: '#00FF88', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '1px' }}>LIVE RUNTIME</span>
            </div>
            <DataProvenanceBadge state={dataState} />
            <span style={{ fontSize: '10px', color: '#2A4A2A', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
              FE {frontendCommit} · BE {backendCommit}
            </span>
            <span style={{ fontSize: '11px', color: '#2A4A2A', fontFamily: 'monospace' }}>{dateStr}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: '#2A4A2A', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>THREATS</span>
              <span style={{ fontSize: '13px', color: '#FF3333', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{protectedValue(dataState, stats?.blocked_events ?? 0)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: '#2A4A2A', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>PROMPTS</span>
              <span style={{ fontSize: '13px', color: '#00FF88', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{protectedValue(dataState, stats?.total_events ?? 0)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: '#2A4A2A', fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>INCIDENTES</span>
              <span style={{ fontSize: '13px', color: '#FF8800', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{protectedValue(dataState, stats?.total_incidents ?? 0)}</span>
            </div>
          </div>
        </div>
        <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} } * { box-sizing: border-box; } nav::-webkit-scrollbar { width: 3px; } nav::-webkit-scrollbar-track { background: transparent; } nav::-webkit-scrollbar-thumb { background: #1A3A1A; border-radius: 2px; }`}</style>
    </div>
  );
}
