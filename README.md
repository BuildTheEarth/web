<!-- markdownlint-disable -->
<div align="center">

<img width="128" src="https://github.com/BuildTheEarth/assets/blob/main/logos/logo_archive_2.png?raw=true" alt="BuildTheEarth Logo" />

# BuildTheEarth Web Monorepo

_A unified monorepo housing all website portals, dashboards, API services, queue processors, and database configurations._

![official](https://go.buildtheearth.net/official-shield)
[![chat](https://img.shields.io/discord/706317564904472627.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.gg/buildtheearth)

</div>
<!-- markdownlint-restore -->

---

## Apps and Packages

This repository contains the following apps and other shared packages:

| Name                       | Description                           | Stack                  | URL                           |
| -------------------------- | ------------------------------------- | ---------------------- | ----------------------------- |
| apps/frontend              | BuildTheEarth Website frontend        | Next.js, TypeScript    | https://buildtheearth.net     |
| apps/api                   | BuildTheEarth API and Website backend | Express.js, TypeScript | https://api.buildtheearth.net |
| apps/dashboard             | BuildTheEarth Dashboard               | Next.js, TypeScript    | https://my.buildtheearth.net  |
| apps/worker                | Queue Worker for async tasks          | BullMQ, TypeScript     | -/-                           |
| packages/typescript-config | Shared tsconfig for all apps          | TypeScript, JSON       | -/-                           |
| packages/prettier-config   | Shared Prettier config for all apps   | Prettier, JSON         | -/-                           |
| packages/db                | Shared Prisma client and schema       | Prisma.js              | -/-                           |

---

## Local Development Setup

To configure this repository on your local computer, follow the instructions below:

### 1. Prerequisites

- **Node.js**: Ensure you are running Node.js `20.x` or `22.x` (LTS is recommended).
- **Yarn Modern**: Modern Yarn (`yarn@4.9.1`) is configured for workspace lock files. Do **not** run standard `npm` or `pnpm` commands as it will alter the workspace configuration.
- **Infisical CLI** (Recommended): Secrets management tool. If configured, you can log in to inject secrets automatically:
  ```bash
  infisical login
  ```

### 2. Installation

Clone the repository and run yarn to link internal workspaces and download npm dependencies:

```bash
git clone https://github.com/BuildTheEarth/web.git
cd web
yarn install
```

### 3. Environment Setup

If you are not utilizing the Infisical Secrets CLI, copy the mock template environment settings across the applications:

```bash
yarn env:copy
```

Ensure you inspect the generated `.env` configurations inside:

- `apps/api/.env`
- `apps/frontend/.env`
- `packages/db/.env`

### 4. Database Setup

Build the database client locally from the schema:

```bash
yarn db:generate
```

You can also spin up the interactive Prisma Database viewer:

```bash
yarn db:studio
```

### 5. Running the Apps

Start the development server. Turborepo runs the servers in parallel:

```bash
yarn dev
```

- **Frontend**: `http://localhost:3000`
- **Dashboard**: `http://localhost:3001`
- **API Backend**: `http://localhost:8080`

---

## Release Lifecycle & Tagging

Each app is versioned independently. We use helper TS scripts to run clean check verification, bump versions in package manifests, create Git tagging, and push changes.

### Get App Information

```bash
# Syntax: yarn app:info <app-name>
yarn app:info frontend
```

### Release & Publish Tag

```bash
# Syntax: yarn app:release <app-name> <patch|minor|major|x.y.z> [--push]
yarn app:release dashboard patch --push
```

_The `--push` flag will automatically push the commit and tag to the remote origin server._

---

## CI/CD

1. **Selective Builds**: When changes are pushed to `main`, workflows utilize `turbo-ignore` (`npx turbo-ignore <app-name>`) to build only the services that have changed code.
2. **Container Registry**: Builds are packaged in the context of the monorepo root (enabling local copy tasks of `@repo/db` and configuration workspaces) and pushed to the **GitHub Container Registry (GHCR)**:
   - **Frontend**: `ghcr.io/buildtheearth/website-frontend:latest`
   - **API**: `ghcr.io/buildtheearth/website-node-backend:latest`
   - **Dashboard**: `ghcr.io/buildtheearth/website-dashboard:latest`
   - **Worker**: `ghcr.io/buildtheearth/website-worker:latest`
