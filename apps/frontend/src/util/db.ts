import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@repo/db'

const prismaClientSingleton = () => {
	const max = process.env.NEXT_PHASE === 'phase-production-build' ? 2 : undefined
	const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max })
	return new PrismaClient({ adapter }).$extends({
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
