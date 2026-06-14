# SENTINELA Cloud Ecosystem Integration Report

Fecha/hora local: 2026-06-11 04:30 America/Lima

## Alcance

- Frente: CENTINELA Cabina Humana + integración cloud existente.
- Frontend: `C:\Users\admin\Desktop\centinela`.
- Backend: `C:\Users\admin\Desktop\centinela-backend`.
- No se tocó backend.
- No se tocó DCFT, HERMES, FORJA, CEREBRO, Mercado Pago ni componentes externos.
- No se expone fuente interna protegida en UI pública.

## Cambio aplicado

- Se reutilizó el panel existente de conversación de `components/ClientLayout.tsx`.
- El rótulo visible y accesible quedó normalizado como `SENTINELA HABLA`.
- `/human-cabin` mantiene el mismo shell principal que Overview, incluyendo sidebar y panel derecho.
- Se agregó un guard CSS mobile para Cabina Humana premium en `app/globals.css`, evitando cortes de texto y bottom nav incompleta en 390x844.

## Validación local

- `/`: HTTP 200.
- `/human-cabin`: HTTP 200.
- `/cabina`: redirige a `/human-cabin`.
- `/cabina-humana`: redirige a `/human-cabin`.
- CSS Next local: HTTP 200.
- JS Next local: HTTP 200.
- Navegación desde sidebar: `/` -> click `Cabina Humana` -> `/human-cabin`.
- Consola navegador: 0 errores.
- Overflow horizontal: no.
- HTML crudo: no.
- `SENTINELA HABLA`: visible en Overview y Cabina Humana.
- Input `Preguntar a SENTINELA`: presente.
- Sombra: no aparece en UI pública.
- Acceso CEO público: no aparece.

## Capturas locales

- `outputs/sentinela-overview-final-before-deploy.png`
- `outputs/sentinela-human-cabin-final-with-chat-desktop.png`
- `outputs/sentinela-human-cabin-final-with-chat-mobile-390x844.png`
- `outputs/sentinela-human-cabin-final-nav-from-home.png`
- `outputs/sentinela-overview-after-human-cabin-chat-fix.png`

## Validaciones técnicas

- `npm run build`: PASS.
- `git diff --check`: PASS.
- Secret scan local: PASS, sin hallazgos.

## Cloud

- Frontend cloud declarado por el repo: `https://centinela-alpha.vercel.app`.
- Backend cloud declarado por el frontend: `https://centinela-backend.vercel.app`.
- Push frontend ejecutado a `origin/main`.
- Auto-deploy Vercel reflejado en producción.
- `/`: HTTP 200.
- `/human-cabin`: HTTP 200.
- `/cabina`: HTTP 307 hacia ruta canónica.
- `/cabina-humana`: HTTP 307 hacia ruta canónica.
- CSS real de producción: HTTP 200.
- JS real de producción: HTTP 200.
- Browser producción desktop: consola 0, sin overflow horizontal, `SENTINELA HABLA` visible.
- Browser producción mobile 390x844: consola 0, sin overflow horizontal, `SENTINELA HABLA` visible.
- Sombra: no aparece en UI pública.
- Acceso CEO público: no aparece.
- Backend cloud `/api/v1/health`: TIMEOUT tras reintentos con PowerShell y `curl` de hasta 60 segundos.

## Riesgos

- El working tree contiene archivos untracked antiguos no relacionados. No deben incluirse en este cierre.
- El build local detecta rutas untracked bajo `app/api/`; no se agregarán al commit de este cierre.
- Backend Vercel no respondió health durante la validación final. No se tocó backend en este cierre.

## Estado

Frontend CENTINELA desplegado y validado en producción. Backend cloud queda con bloqueo operativo por timeout de health.
