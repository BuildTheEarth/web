import { PrismaService } from 'src/common/db/prisma.service';

describe('PrismaService', () => {
	it('should connect on module init', async () => {
		const prismaService = new PrismaService();
		prismaService.$connect = jest.fn();

		await prismaService.onModuleInit();

		expect(prismaService.$connect).toHaveBeenCalled();
	});
});