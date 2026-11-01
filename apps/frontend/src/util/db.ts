import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@repo/db'

const prismaClientSingleton = () => {
	// next build prerenders in many parallel workers, each with its own pool: keep the pools small to not exhaust the
	// database connections, and let transactions wait for a free connection instead of failing the build
	const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
	const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: isBuild ? 4 : undefined })
	return new PrismaClient({
		adapter,
		transactionOptions: isBuild ? { maxWait: 60_000, timeout: 60_000 } : undefined,
	}).$extends({
		name: 'uploadSrc',
		result: {
			upload: {
				src: {
					needs: { name: true },
					compute: (upload) => {
						return `${process.env.NEXT_PUBLIC_CDN_URL}/uploads/${upload.name}`
					},
				},
			},
		},
	})
}

declare const globalThis: { prismaGlobal: ReturnType<typeof prismaClientSingleton> } & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
