'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api, ensureToken } from '@/lib/api';
import { classifyDataState, DataState, isVerifiedData, protectedValue } from '@/components/OperationalState';

type ChatMessage = {
  role: 'centinela' | 'user';
  text: string;
};

type RuntimeStats = {
  total_events?: number;
  total_incidents?: number;
  blocked_events?: number;
};

const NAV = [
  { label: 'Overview', href: '/' },
  { label: 'Cabina Humana', href: '/human-cabin' },
  { label: 'Runtime', href: '/runtime' },
  { label: 'Firewall IA', href: '/firewall' },
  { label: 'Agentes', href: '/agentes' },
  { label: 'Permisos', href: '/permissions' },
  { label: 'Politicas', href: '/policy' },
  { label: 'Observabilidad', href: '/observability' },
  { label: 'Amenazas', href: '/amenazas' },
  { label: 'Forensics', href: '/forensics' },
  { label: 'Incidentes', href: '/incidentes' },
  { label: 'Grafo', href: '/grafo' },
  { label: 'Respuesta', href: '/response' },
  { label: 'Reporte', href: '/reporte' },
];

const MOBILE_NAV = [
  { label: 'Inicio', href: '/' },
  { label: 'Cabina', href: '/human-cabin' },
  { label: 'Alertas', href: '/incidentes' },
  { label: 'Reportes', href: '/reporte' },
];

function dataStateStatus(state: DataState) {
  if (isVerifiedData(state)) return 'OPERATIONAL';
  if (state === 'auth_required') return 'DEGRADED';
  if (state === 'loading') return 'UNKNOWN';
  return 'DEGRADED';
}

function pillClass(status: string) {
  const value = String(status || '').toUpperCase();
  if (['OPERATIONAL', 'READY', 'VERIFIED'].includes(value)) return 'status-pill good';
  if (['BLOCKED', 'ERROR', 'FAILED'].includes(value)) return 'status-pill danger';
  return 'status-pill warn';
}

function sentinelaLocalReply(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('permiso')) {
    return 'Permisos en observación: revisa capacidades de escritura, despliegue y acceso a datos antes de activar tareas reales.';
  }
  if (normalized.includes('reporte')) {
    return 'Reporte ejecutivo: protección activa, riesgo global medio y una alerta prioritaria sobre permisos sensibles.';
  }
  if (normalized.includes('app') || normalized.includes('mirar')) {
    return 'Mira primero la cola de decisiones humanas: allí está lo crítico, lo bloqueado y lo que requiere evidencia.';
  }
  return 'Estoy protegiendo aplicaciones, agentes IA, datos sensibles y permisos críticos con una cabina local preparada, sin conexión externa real.';
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [stats, setStats] = useState<RuntimeStats | null>(null);
  const [dataState, setDataState] = useState<DataState>('loading');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'centinela',
      text: 'Estoy en guardia. Protejo aplicaciones, agentes, datos y permisos solo con evidencia verificable.',
    },
  ]);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const token = await ensureToken();
        if (!token) {
          if (!active) return;
          setStats(null);
          setDataState('auth_required');
          return;
        }
        const data = await api.getDbStats();
        if (!active) return;
        setStats(data);
        setDataState('verified');
      } catch (error) {
        if (!active) return;
        setStats(null);
        setDataState(classifyDataState(error));
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const globalStatus = dataStateStatus(dataState);

  const evidenceCopy = useMemo(() => {
    if (isVerifiedData(dataState)) return 'Tengo evidencia autenticada del backend.';
    if (dataState === 'auth_required') return 'Sesión requerida para ver datos.';
    if (dataState === 'loading') return 'Estoy verificando el runtime.';
    return 'No tengo evidencia suficiente para afirmar protección total.';
  }, [dataState]);

  function submitChat(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    const reply = sentinelaLocalReply(message);
    setMessages((current) => [
      ...current,
      { role: 'user', text: message },
      { role: 'centinela', text: reply },
    ]);
    setChatInput('');
  }

  function ask(prompt: string) {
    setChatInput(prompt);
  }

  return (
    <div className="human-cabin-shell centinela-theme">
      <aside className="human-left-panel">
        <div className="human-brand">
          <div className="human-avatar shield-avatar" aria-hidden="true" />
          <div>
            <span>SENTINELA</span>
            <strong>Cabina premium de ciberseguridad defensiva</strong>
          </div>
        </div>

        <section className="human-status-card">
          <div>
            <span>Estado global</span>
            <strong>{globalStatus}</strong>
            <p>{evidenceCopy}</p>
          </div>
          <span className={pillClass(globalStatus)}>{globalStatus}</span>
        </section>

        <section className="human-kpis">
          <article>
            <span>Eventos</span>
            <strong>{protectedValue(dataState, stats?.total_events ?? 0, 'NO DATA')}</strong>
            <small>{isVerifiedData(dataState) ? 'Evidencia autenticada.' : 'Esperando datos reales.'}</small>
          </article>
          <article>
            <span>Incidentes</span>
            <strong>{protectedValue(dataState, stats?.total_incidents ?? 0, 'NO DATA')}</strong>
            <small>{isVerifiedData(dataState) ? 'Registro verificado.' : 'Sin visibilidad autenticada.'}</small>
          </article>
          <article>
            <span>Bloqueos</span>
            <strong>{protectedValue(dataState, stats?.blocked_events ?? 0, 'NO DATA')}</strong>
            <small>{isVerifiedData(dataState) ? 'Defensas registradas.' : 'No existe evidencia verificable.'}</small>
          </article>
          <article>
            <span>Chat IA</span>
            <strong>LOCAL</strong>
            <small>Sin conexión externa real.</small>
          </article>
        </section>

        <nav className="human-nav" aria-label="Navegacion CENTINELA">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="human-center-panel">
        {children}
      </main>

      <aside className="human-right-panel">
        <section className="human-chat-card">
          <header className="human-chat-heading">
            <div className="human-avatar shield-avatar" aria-hidden="true" />
            <div>
              <span>SENTINELA habla</span>
              <strong>Guardia ejecutivo en vigilancia</strong>
            </div>
            <small>LOCAL PREPARED</small>
          </header>

          <div className="human-director-feed">
            <article>
              <div>
                <span>Vigilancia</span>
                <strong>{isVerifiedData(dataState) ? 'Tengo evidencia autenticada.' : 'Visibilidad limitada.'}</strong>
              </div>
              <span className={pillClass(globalStatus)}>{globalStatus}</span>
            </article>
            <article>
              <div>
                <span>Bloqueo</span>
                <strong>{isVerifiedData(dataState) ? 'Incidentes verificados solamente.' : 'Sin amenazas declaradas.'}</strong>
              </div>
              <span className={pillClass(dataState === 'auth_required' ? 'DEGRADED' : globalStatus)}>{dataState === 'auth_required' ? 'AUTH' : globalStatus}</span>
            </article>
            <article>
              <div>
                <span>Siguiente paso</span>
                <strong>{isVerifiedData(dataState) ? 'Mantendré vigilancia.' : 'Necesito autenticación.'}</strong>
              </div>
              <span className="status-pill warn">NEXT</span>
            </article>
          </div>

          <div className="human-prompt-grid">
            <button type="button" onClick={() => ask('Qué estás protegiendo?')}>Qué proteges?</button>
            <button type="button" onClick={() => ask('Qué decisión debo mirar primero?')}>Qué miro?</button>
            <button type="button" onClick={() => ask('Qué permisos debo revisar?')}>Permisos</button>
            <button type="button" onClick={() => ask('Dame reporte ejecutivo')}>Reporte</button>
          </div>

          <div className="human-chat-log" aria-live="polite">
            {messages.slice(-6).map((message, index) => (
              <div className={`human-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </div>
            ))}
          </div>

          <form className="human-chat-form" onSubmit={submitChat}>
            <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Preguntar a SENTINELA" />
            <button type="submit" disabled={!chatInput.trim()}>Enviar</button>
          </form>
        </section>
      </aside>

      <nav className="human-mobile-nav" aria-label="Navegacion mobile SENTINELA">
        {MOBILE_NAV.map((item) => (
          <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
