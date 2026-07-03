# AuditFlow — Frontend

SPA en Angular 21 (standalone, signals, zoneless-ready) para la plataforma de auditoría de código con IA.

## Stack

- **Angular 21** — componentes standalone, signals, control flow (`@if`/`@for`)
- **Arquitectura DDD** — `core` / `features` / `shared`
- **JWT auth** — interceptor funcional + guard funcional
- **jsPDF** — export de reportes (plan Pro)
- Identidad visual tipo IDE: `JetBrains Mono` para datos, `Inter` para UI

## Estructura

```
src/app/
├── core/
│   ├── auth/           # AuthService (signals)
│   ├── guards/         # authGuard funcional
│   ├── interceptors/   # authInterceptor funcional (Bearer + 401)
│   └── models/         # tipos del dominio
├── features/
│   ├── auth/           # login + callback OAuth
│   ├── dashboard/      # vista general con métricas
│   ├── repos/          # conectar repos + lanzar auditorías
│   └── audits/         # lista + detalle (polling en vivo) + PDF
└── shared/
    ├── components/     # ScoreGauge (firma visual), AppShell
    └── pipes/          # AuditStatus, Category
```

## Setup

```bash
npm install
npm start          # ng serve en http://localhost:4200
```

El backend debe estar corriendo en `http://localhost:8080` (configurable en
`src/environments/environment.development.ts`).

## Flujo de usuario

1. **Login** → OAuth con GitHub (redirige al backend)
2. **Callback** → recibe el JWT, carga el perfil, redirige al dashboard
3. **Repos** → conecta repos de GitHub, lanza auditorías
4. **Detalle de auditoría** → polling en vivo cada 3s mientras analiza,
   luego muestra score general, scores por categoría, issues filtrables
   por categoría/severidad, y export a PDF

## Piezas destacadas

- `ScoreGaugeComponent` — anillo SVG animado que cambia de color según el
  rango del score. Es el elemento visual distintivo del producto.
- `AuditService.pollAudit()` — usa `timer` + `switchMap` + `takeWhile` para
  seguir auditorías en progreso sin sobrecargar el backend.
- `PdfExportService` — genera el reporte con jsPDF: header, scores con barras,
  issues ordenados por severidad con colores semánticos.

## Build de producción

```bash
npm run build      # genera dist/auditflow-frontend
```

## Despliegue en Vercel

```
Framework preset: Angular
Build command: npm run build
Output directory: dist/auditflow-frontend/browser
```

Configurar la `apiUrl` de producción en `src/environments/environment.ts`.
```
