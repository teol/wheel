# Agents Guidelines

This document serves as a high-level reference for AI agents interacting with this workspace.

## Core Rules

- **Build System**: Use `bun` for all package management and scripting (`bun run dev`, `bun run build`).
- **Stack**: Maintain separation between server logic (Fastify, Drizzle ORM, MySQL) and UI (Svelte 5, GSAP, TailwindCSS via DaisyUI).
- **Types**: Adhere to strict TypeScript standards across the full stack.
- **Verification & Finishing Tasks**: Before finalizing any task, you must run the following checks to ensure everything is correct:
  1. `bun run format` (auto-format code)
  2. `bun run lint` (verify ESLint diagnostics)
  3. `bunx tsc --noEmit` (verify TypeScript diagnostics)
  4. `bun run test` (run all tests)
  5. `bun run build` (verify production build succeeds)
