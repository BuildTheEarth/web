import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationQuestionsService } from 'src/sections/applications/questions/application-questions.service';
import { TeamApplicationQuestionsController } from 'src/sections/applications/questions/team-application-questions.controller';

describe('TeamApplicationQuestionsController', () => {
	let teamApplicationQuestionsController: TeamApplicationQuestionsController;
	let applicationQuestionsService: {
		findAllForTeam: jest.Mock;
	};

	beforeEach(async () => {
		applicationQuestionsService = {
			findAllForTeam: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [TeamApplicationQuestionsController],
			providers: [
				{
					provide: ApplicationQuestionsService,
					useValue: applicationQuestionsService,
				},
			],
		}).compile();

		teamApplicationQuestionsController = module.get<TeamApplicationQuestionsController>(
			TeamApplicationQuestionsController,
		);
	});

	describe('getTeamApplicationQuestions', () => {
		it('should request the questions of the team in the path', async () => {
			applicationQuestionsService.findAllForTeam.mockResolvedValue({
				data: [{ id: 'question-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});

			const pagination = { page: 1, limit: 20 };
			const sorting = { sortBy: 'sort', order: 'asc' };

			const result = await teamApplicationQuestionsController.getTeamApplicationQuestions(
				'team-123',
				pagination as never,
				sorting as never,
				{ filter: {} } as never,
			);

			expect(applicationQuestionsService.findAllForTeam).toHaveBeenCalledWith(
				'team-123',
				false,
				pagination,
				'sort',
				'asc',
			);
			expect(result).toEqual({
				data: [{ id: 'question-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});
		});

		it('should forward the slug flag when it is set', async () => {
			applicationQuestionsService.findAllForTeam.mockResolvedValue({ data: [], meta: {} });

			await teamApplicationQuestionsController.getTeamApplicationQuestions(
				'my-team',
				{ page: 1, limit: 20 } as never,
				{ sortBy: 'sort', order: 'asc' } as never,
				{ filter: { slug: true } } as never,
			);

			expect(applicationQuestionsService.findAllForTeam).toHaveBeenCalledWith(
				'my-team',
				true,
				{ page: 1, limit: 20 },
				'sort',
				'asc',
			);
		});
	});
});
