/**
 * Re-export all the types from the Prisma client to be used in apps. This way, we only need one prisma schema
 */
// export * from '@prisma/client';

export * from './generated/prisma/client';

export {PrismaPg } from '@prisma/adapter-pg';