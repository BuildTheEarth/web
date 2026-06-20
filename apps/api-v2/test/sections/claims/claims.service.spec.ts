import { ClaimsService } from 'src/sections/claims/claims.service';
import { PrismaService } from 'src/common/db/prisma.service';

describe('ClaimsService', () => {
	let claimsService: ClaimsService;
	let prismaService: {
		claim: {
			findMany: jest.Mock;
			count: jest.Mock;
		};
	};

	beforeEach(() => {
		prismaService = {
			claim: {
				findMany: jest.fn(),
				count: jest.fn(),
			},
		};
		claimsService = new ClaimsService(prismaService as unknown as PrismaService);
	});

	it('should paginate and include claim counts and images', async () => {
		prismaService.claim.findMany.mockResolvedValue([{ id: 'claim-1' }]);
		prismaService.claim.count.mockResolvedValue(3);

		const result = await claimsService.findAll({ page: 2, limit: 1 } as any, { active: true } as any);

		expect(prismaService.claim.findMany).toHaveBeenCalledWith({
			where: { active: true },
			skip: 1,
			take: 1,
			include: {
				_count: { select: { builders: true, images: true } },
				images: { select: { id: true, name: true, hash: true } },
			},
		});
		expect(result).toEqual({
			data: [{ id: 'claim-1' }],
			meta: { page: 2, perPage: 1, totalItems: 3, totalPages: 3 },
		});
	});
});