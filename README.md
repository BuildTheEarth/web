<!-- markdownlint-disable -->
<div align="center">

<img width="128" src="https://github.com/BuildTheEarth/assets/blob/main/logos/logo_archive_2.png?raw=true" />

# @BuildTheEarth/web

_A Monorepo containing all website-related projects._

![official](https://go.buildtheearth.net/official-shield)
[![chat](https://img.shields.io/discord/706317564904472627.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.gg/buildtheearth)
[![Crowdin](https://badges.crowdin.net/buildtheearth-website/localized.svg)](https://crowdin.com/project/buildtheearth-website)

</div>
<!-- markdownlint-restore -->

## Apps and Packages

This repository contains the following apps and other shared packages:

| Name                       | Description                           | Stack                  | URL                           |
| -------------------------- | ------------------------------------- | ---------------------- | ----------------------------- |
| apps/frontend              | BuildTheEarth Website frontend        | Next.js, TypeScript    | https://buildtheearth.net     |
| apps/api                   | BuildTheEarth API and Website backend | Express.js, TypeScript | https://api.buildtheearth.net |
| apps/dashboard             | BuildTheEarth Dashboard               | Next.js, TypeScript    | https://my.buildtheearth.net  |
| packages/typescript-config | Shared tsconfig for all apps          | TypeScript, JSON       | -/-                           |
| packages/prettier-config   | Shared Prettier config for all apps   | Prettier, JSON         | -/-                           |
| packages/db                | Shared Prisma client and schema       | Prisma.js              | -/-                           |

## Table of Contents

- [@BuildTheEarth/web](#buildtheearthweb)
  - [Apps and Packages](#apps-and-packages)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Bugs and Features](#bugs-and-features)
  - [Building](#building)
    - [Building all applications](#building-all-applications)
    - [Building a single application](#building-a-single-application)
  - [CI/CD](#cicd)

## Getting Started

First, clone this repository:

```bash
git clone https://github.com/BuildTheEarth/web.git
```

It is recommended to install [Turborepo](https://turbo.build/repo/docs) globally:

```bash
yarn global add turbo@2.1.1
```

To install all dependencies, run:

```bash
yarn install
# and optionally
yarn db:generate
```

Now, copy the example `.env` file and change all its options:

```bash
yarn env:copy
```

Then you can start the development server with:

```bash
yarn dev
```

This will also start the Prisma Studio.

## Bugs and Features

We use [GitHub Issues](https://github.com/BuildTheEarth/website-frontend/issues) to manage all bugs and features. You can submit a new bug or feature request [here](https://github.com/BuildTheEarth/website-frontend/issues/new). An overview of the state of bugs and features can be found [here](https://github.com/orgs/BuildTheEarth/projects/11).

## Building

Usually, you will never need to build any app yourself, as it will automatically happen once you push your changes to GitHub. If you ever need to build all applications or only a single one, follow this guide:

(All commands are executed from the root `web/` folder.)

Optionally, start by clearing all existing builds:

```bash
yarn clean
```

### Building all applications

```bash
yarn build
```

Due to the use of Turborepo, this command will only build applications that have changed since the last build!

### Building a single application

You can select only one application to be built:

```bash
yarn build:api
# or
yarn build:frontend
```

If you need to filter with more information, you can run the root turbo command (see [the docs](https://turbo.build/repo/docs/reference/run#--filter-string)):

```bash
turbo build --filter=[...]
```

## CI/CD

This monorepo uses [GitHub Actions](https://github.com/BuildTheEarth/web/actions) to create deployable Docker images, which are pushed to the [GitHub Container Registry](https://github.com/orgs/BuildTheEarth/packages).
