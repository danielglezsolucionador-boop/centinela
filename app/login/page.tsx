'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await auth.login(email, password);
      router.push('/human-cabin');
    } catch {
      setError('No se pudo iniciar sesión con esas credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="sentinela-login-page">
      <section className="sentinela-login-panel">
        <div className="sentinela-login-copy">
          <span className="sentinela-eyebrow">Cabina premium de ciberseguridad defensiva</span>
          <h1>Acceso cliente SENTINELA</h1>
          <p>
            Entra a tu cabina para revisar riesgo, evidencia, decisiones humanas
            y reportes ejecutivos. La demo visual no entrega protección real.
          </p>
          <div className="sentinela-login-plans">
            <span>Empresa S/199/mes</span>
            <span>Premium S/499/mes</span>
            <span>Corporativo desde S/999/mes</span>
          </div>
        </div>

        <div className="sentinela-login-card">
          <div>
            <span className="sentinela-eyebrow">Iniciar sesión</span>
            <h2>Cuenta protegida</h2>
          </div>

          <label>
            Correo
            <input
              autoComplete="email"
              inputMode="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
              placeholder="correo@empresa.com"
            />
          </label>

          <label>
            Contraseña
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
              placeholder="Contraseña"
            />
          </label>

          {error && <p className="sentinela-login-error">{error}</p>}

          <button className="sentinela-login-primary" onClick={handleLogin} disabled={loading}>
            {loading ? 'Validando sesión...' : 'Iniciar sesión'}
          </button>

          <button className="sentinela-login-secondary" type="button" disabled>
            Continuar con Google — próximamente
          </button>

          <div className="sentinela-login-footer">
            <Link href="/human-cabin">Ver demo visual</Link>
            <button type="button" disabled>Crear cuenta — activación comercial</button>
          </div>
        </div>
      </section>
    </main>
  );
}
