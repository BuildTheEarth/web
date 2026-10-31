/**
 * Re-export all the types from the Prisma client to be used in apps. This way, we only need one prisma schema
 */
// export * from '@prisma/client';

// The explicit .ts extension is rewritten to .js by tsconfig.build.json (required for Node ESM).
// Consumers without allowImportingTsExtensions (e.g. apps/api) need the ignore.
// @ts-ignore
export * from './generated/prisma/client.ts'
