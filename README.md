# OmniSphere AI

OmniSphere AI es una plataforma SaaS multiempresa para crear y operar chatbots con IA generativa.

## Estructura del repositorio

- `backend/`: API y servicios (NestJS + Prisma).
- `frontend/`: cliente web (React + TypeScript + Vite).
- `shared/`: artefactos compartidos.

## Requisitos

- Node.js 18+
- npm 9+
- Base de datos PostgreSQL (para backend)

## Quickstart

### 1) Instalar dependencias por workspace

```bash
npm run bootstrap
```

También puedes instalar por separado:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2) Verificar estado local (preflight)

```bash
npm run preflight
```

Este check avisa si falta `node_modules` en alguno de los workspaces.

## Backend

### Configuración

1. Copia variables de entorno:

```bash
cp backend/.env.example backend/.env
```

2. Ajusta conexión de base de datos y claves requeridas en `backend/.env`.

### Migraciones y Prisma

```bash
npm run generate --prefix backend
npm run migrate --prefix backend
```

### Desarrollo y build

```bash
npm run start:dev --prefix backend
npm run build --prefix backend
```

> Nota: si intentas compilar sin dependencias instaladas, el script `prebuild` mostrará un mensaje guía.

### Pruebas backend

```bash
npm run test --prefix backend
npm run test:cov --prefix backend
```

## Frontend

### Desarrollo local

```bash
npm run dev --prefix frontend
```

### Build y preview

```bash
npm run build --prefix frontend
npm run preview --prefix frontend
```

## CI/CD y contribución

- GitHub Actions ejecuta pipelines separados para `backend/**` y `frontend/**`.
- Antes de abrir PR, valida:

```bash
npm run preflight
npm run build:backend
npm run build:frontend
```
