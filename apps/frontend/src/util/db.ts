import { PrismaClient } from '@repo/db';

const prismaClientSingleton = () => {
	return new PrismaClient({ datasourceUrl: process.env.DATABASE_URL }).$extends({
		name: 'uploadSrc',
		result: {
			upload: {
				src: {
					needs: { name: true },
					compute: (upload) => {
						return `https://cdn.buildtheearth.net/uploads/${upload.name}`;
					},
				},
			},
		},
	});
};

declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
