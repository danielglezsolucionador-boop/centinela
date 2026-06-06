import Link from 'next/link';

const securitySignals = [
  {
    name: 'Aplicaciones',
    state: 'Protegidas',
    detail: '12 apps bajo vigilancia preventiva.',
    action: 'Mantener monitoreo activo.',
    tone: 'safe',
  },
  {
    name: 'Agentes IA',
    state: 'En observacion',
    detail: '1 agente requiere revision de permisos.',
    action: 'Revisar capacidades antes de ejecucion prolongada.',
    tone: 'watch',
  },
  {
    name: 'Datos sensibles',
    state: 'Protegidos',
    detail: 'Sin fuga detectada en la cabina local.',
    action: 'Conservar politicas de minimo acceso.',
    tone: 'safe',
  },
  {
    name: 'Permisos criticos',
    state: 'Atencion',
    detail: '2 permisos sensibles deben quedar bajo aprobacion humana.',
    action: 'Validar antes de activar tareas reales.',
    tone: 'watch',
  },
];

const watchedApps = [
  {
    app: 'FORJA',
    state: 'En observacion',
    risk: 'Medio',
    event: 'Agente local con capacidad de escritura.',
    action: 'Validar permisos persistentes.',
    tone: 'watch',
  },
  {
    app: 'DCFT',
    state: 'Protegida',
    risk: 'Bajo',
    event: 'Cabina operacional estable.',
    action: 'Mantener vigilancia tributaria.',
    tone: 'safe',
  },
  {
    app: 'CEREBRO',
    state: 'Bajo vigilancia',
    risk: 'Medio',
    event: 'Decisiones deben conservar trazabilidad.',
    action: 'Auditar cambios de autoridad.',
    tone: 'watch',
  },
  {
    app: 'PLUMA',
    state: 'Protegida',
    risk: 'Bajo',
    event: 'Flujo editorial sin incidente activo.',
    action: 'Vigilar contexto y fuentes.',
    tone: 'safe',
  },
  {
    app: 'LENTE',
    state: 'Protegida',
    risk: 'Bajo',
    event: 'Observacion sin alerta prioritaria.',
    action: 'Mantener evidencia visible.',
    tone: 'safe',
  },
  {
    app: 'HERMES',
    state: 'Pendiente',
    risk: 'Pendiente',
    event: 'Esperando senal autenticada.',
    action: 'No declarar normalidad sin datos.',
    tone: 'pending',
  },
];

const quickAccess = [
  { label: 'Incidentes', href: '/incidentes' },
  { label: 'Agentes', href: '/agentes' },
  { label: 'Permisos', href: '/permissions' },
  { label: 'Forensics', href: '/forensics' },
  { label: 'Reporte', href: '/reporte' },
  { label: 'CEREBRO', href: '#cerebro-guard' },
];

const preparedModules = [
  'Overview',
  'Runtime Protection',
  'AI Firewall',
  'Agent Security',
  'Permissions',
  'Policy Engine',
  'Observability',
  'Threat Intelligence',
  'Prompt Forensics',
  'Incident Center',
  'Security Graph',
  'Response Engine',
  'Executive Report',
];

function toneClass(tone: string) {
  return `sentinela-tone ${tone}`;
}

function riskPill(tone: string) {
  if (tone === 'safe') return 'status-pill good';
  if (tone === 'alert') return 'status-pill danger';
  return 'status-pill warn';
}

export default function HomePage() {
  return (
    <section className="sentinela-home">
      <header className="sentinela-hero">
        <div className="sentinela-hero-copy">
          <span className="sentinela-eyebrow">Centro de proteccion del ecosistema IA</span>
          <h1>SENTINELA mantiene el ecosistema bajo vigilancia preventiva.</h1>
          <p>
            Una cabina ejecutiva para entender en segundos si las aplicaciones,
            agentes, datos y permisos estan protegidos.
          </p>
        </div>
        <aside className="sentinela-hero-status">
          <span>Ecosistema bajo vigilancia</span>
          <strong>Proteccion activa</strong>
          <p>Riesgo global medio por permisos de agente local en observacion.</p>
          <span className="status-pill warn">RIESGO MEDIO</span>
        </aside>
      </header>

      <section className="sentinela-summary-grid" aria-label="Resumen ejecutivo de seguridad">
        <article>
          <span>Proteccion actual</span>
          <strong>Activa</strong>
          <p>Defensa preventiva encendida.</p>
        </article>
        <article>
          <span>Ultima revision</span>
          <strong>Local</strong>
          <p>Datos demo/controlados hasta autenticar runtime completo.</p>
        </article>
        <article>
          <span>Apps protegidas</span>
          <strong>12</strong>
          <p>Ecosistema principal mapeado.</p>
        </article>
        <article>
          <span>Incidentes activos</span>
          <strong>1</strong>
          <p>Prioridad media, sin alerta critica.</p>
        </article>
      </section>

      <section className="sentinela-section">
        <div className="sentinela-section-header">
          <div>
            <span className="sentinela-eyebrow">Semaforo de seguridad</span>
            <h2>Que esta protegido y que necesita atencion</h2>
          </div>
          <p>Colores usados como senal operativa, no decoracion.</p>
        </div>

        <div className="sentinela-signal-grid">
          {securitySignals.map((signal) => (
            <article className={toneClass(signal.tone)} key={signal.name}>
              <div>
                <span>{signal.name}</span>
                <strong>{signal.state}</strong>
                <p>{signal.detail}</p>
              </div>
              <em>{signal.action}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="sentinela-priority" aria-label="Alerta prioritaria">
        <div className="sentinela-priority-main">
          <span className="sentinela-eyebrow">Alerta prioritaria</span>
          <h2>FORJA ejecuto una tarea con agente local.</h2>
          <p>
            Riesgo medio: el agente tiene capacidades de escritura y debe operar
            con aprobacion humana antes de consumir tareas reales prolongadas.
          </p>
        </div>
        <div className="sentinela-priority-side">
          <div>
            <span>Motivo</span>
            <strong>Capacidad de escritura activa</strong>
          </div>
          <div>
            <span>Accion recomendada</span>
            <strong>Revisar permisos antes de mantener heartbeat productivo.</strong>
          </div>
          <Link href="/forensics">Ver analisis</Link>
        </div>
      </section>

      <section className="sentinela-section">
        <div className="sentinela-section-header">
          <div>
            <span className="sentinela-eyebrow">Apps bajo vigilancia</span>
            <h2>Que app o agente debo mirar ahora</h2>
          </div>
          <p>Lista compacta para decision ejecutiva, sin tabla tecnica.</p>
        </div>

        <div className="sentinela-watch-grid">
          {watchedApps.map((item) => (
            <article className="sentinela-app-card" key={item.app}>
              <div className="sentinela-app-topline">
                <strong>{item.app}</strong>
                <span className={riskPill(item.tone)}>{item.risk}</span>
              </div>
              <p>{item.event}</p>
              <small>{item.action}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="sentinela-action-strip">
        <div>
          <span className="sentinela-eyebrow">Accion recomendada</span>
          <strong>
            Mantener FORJA activo, pero limitar tareas del agente local hasta
            validar permisos persistentes y cola controlada.
          </strong>
        </div>
        <Link href="/permissions">Revisar permisos</Link>
      </section>

      <section className="sentinela-section" id="cerebro-guard">
        <div className="sentinela-section-header">
          <div>
            <span className="sentinela-eyebrow">Accesos rapidos</span>
            <h2>Ir directo al punto de control</h2>
          </div>
          <p>El detalle tecnico existe, pero no domina la primera pantalla.</p>
        </div>

        <div className="sentinela-quick-grid">
          {quickAccess.map((item) => (
            <Link href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="sentinela-section sentinela-prepared">
        <div className="sentinela-section-header">
          <div>
            <span className="sentinela-eyebrow">Modulos preparados</span>
            <h2>Defensa completa, home sin saturacion</h2>
          </div>
          <p>Estado local/demo cuando no exista backend real autenticado.</p>
        </div>

        <div className="sentinela-module-grid">
          {preparedModules.map((module) => (
            <span key={module}>{module}</span>
          ))}
        </div>
      </section>
    </section>
  );
}
