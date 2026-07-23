# SITEAO OpsTracker

Frontend foundation for SITEAO logistics and committee operations.

## Stack

- React 19, TypeScript, and Vite
- Tailwind CSS v4
- shadcn/ui with the Radix Vega preset
- React Router
- Axios
- TanStack Table
- Chart.js and react-chartjs-2

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` in `.env` when the backend becomes available. No API endpoints or
authentication logic are implemented in this phase.

## Validation

```bash
npm run lint
npm run build
```

## Architecture

- `src/components` contains shared and feature-oriented UI building blocks.
- `src/layouts` contains authentication, logistics, and committee shells.
- `src/pages` contains route-level placeholder modules.
- `src/routes` contains the router and pass-through authentication guards.
- `src/context` and `src/hooks` contain future authentication integration points.
- `src/services` contains the Axios client and empty domain service boundaries.
