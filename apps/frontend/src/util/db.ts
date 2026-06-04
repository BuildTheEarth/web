import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/db';

const prismaClientSingleton = () => {
	const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
	return new PrismaClient({ adapter }).$extends({
		name: 'uploadSrc',
		result: {
			upload: {
				src: {
					needs: { name: true },
					compute: (upload) => {
						return `${process.env.NEXT_PUBLIC_CDN_URL}/uploads/${upload.name}`;
					},
				},
			},
		},
	});
};

declare const globalThis: { prismaGlobal: ReturnType<typeof prismaClientSingleton> } & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
