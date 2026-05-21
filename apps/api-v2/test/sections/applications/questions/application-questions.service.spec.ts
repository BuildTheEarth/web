import { ApplicationQuestionsService } from 'src/sections/applications/questions/application-questions.service';
import { PrismaService } from 'src/common/db/prisma.service';

describe('ApplicationQuestionsService', () => {
	let applicationQuestionsService: ApplicationQuestionsService;
	let prismaService: {
		applicationQuestion: {
			deleteMany: jest.Mock;
		};
	};

	beforeEach(() => {
		prismaService = {
			applicationQuestion: {
				deleteMany: jest.fn(),
			},
		};

		applicationQuestionsService = new ApplicationQuestionsService(prismaService as unknown as PrismaService);
	});

	describe('delete', () => {
		it('should delete the question for the given question and team ids', async () => {
			prismaService.applicationQuestion.deleteMany.mockResolvedValue({ count: 1 });

			const result = await applicationQuestionsService.delete('question-1', 'team-123');

			expect(prismaService.applicationQuestion.deleteMany).toHaveBeenCalledWith({
				where: {
					id: 'question-1',
					buildTeamId: 'team-123',
				},
			});
			expect(result).toEqual({ count: 1 });
		});
	});
});
