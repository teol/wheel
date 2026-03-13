# Custom Wheel Webapp

A modern web application for creating custom spinning wheels.

## Tech Stack
- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Backend:** Fastify, Pino, Drizzle ORM, MySQL2 (MariaDB)
- **Frontend:** Svelte 5, Vite, HTML5 Canvas API, GSAP, Tailwind CSS, DaisyUI (Dark Theme)
- **Testing:** Vitest
- **Formatting:** Prettier

## Prerequisites
- [Bun](https://bun.sh/) installed on your machine
- A running MariaDB or MySQL database

## Installation & Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Setup environment variables:
   Update the `.env` file with your database credentials.
   ```bash
   # .env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=secret
   DB_NAME=wheel_db
   ```

3. Database Setup:
   Generate migrations and push the schema to your database.
   ```bash
   bun run db:generate
   bun run db:push
   ```

## Development

Run both the Fastify backend and Vite frontend concurrently:

```bash
bun run dev
```
Alternatively, you can run them in separate terminals:
- Backend: `bun run dev:server` (runs on http://localhost:3000)
- Frontend: `bun run dev:client` (runs on http://localhost:5173)

## Production

1. Build the frontend and backend:
   ```bash
   bun run build
   ```

2. Start the production server:
   ```bash
   bun run start
   ```