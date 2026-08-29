import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@repo/db'
import { logger } from './logger'

const prismaClientSingleton = () => {
	const connectionString = process.env.DATABASE_URL
	if (!connectionString || connectionString.trim() === '') {
		throw new Error(
			'DATABASE_URL environment variable is missing or empty. Please ensure DATABASE_URL is set in your runtime environment.',
		)
	}

	const adapter = new PrismaPg(
		{
			connectionString,
			connectionTimeoutMillis: 10000,
			max: 10,
		},
		{
			onPoolError: (err) => {
				logger.error('Prisma PostgreSQL pool error', { error: err.message })
			},
			onConnectionError: (err) => {
				logger.error('Prisma PostgreSQL connection error', { error: err.message })
			},
		},
	)

	return new PrismaClient({ adapter }).$extends({
		name: 'uploadSrc',
		result: {
			upload: {
				src: {
					needs: { name: true },
					compute: (upload) => {
						return `https://cdn.buildtheearth.net/uploads/${upload.name}`
					},
				},
			},
		},
	}) as unknown as PrismaClient
}

declare const globalThis: { prismaGlobal: ReturnType<typeof prismaClientSingleton> } & typeof global

const prisma = (globalThis.prismaGlobal ?? prismaClientSingleton()) as ReturnType<typeof prismaClientSingleton>

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
