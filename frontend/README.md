# CivicLens — React + Vite

Converted from the original Lovable/TanStack Start project to a standard React 19 + Vite + Tailwind CSS project.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite (normally `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

### What was changed
- Removed TanStack Start, TanStack Router, Nitro, and Lovable-specific Vite configuration.
- Added a standard Vite React entry point (`src/main.tsx`).
- Converted the homepage route into `src/App.tsx`.
- Kept the CivicLens design, Tailwind styling, images, header, footer, responsive layout, and accessibility controls.
- Kept the `@/*` TypeScript path alias through `vite-tsconfig-paths`.
