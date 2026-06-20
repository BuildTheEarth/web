import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ApplicationQuestionsController } from 'src/sections/applications/questions/application-questions.controller';
import { ApplicationQuestionsService } from 'src/sections/applications/questions/application-questions.service';

describe('ApplicationQuestionsController', () => {
	let applicationQuestionsController: ApplicationQuestionsController;
	let applicationQuestionsService: {
		findAll: jest.Mock;
		delete: jest.Mock;
	};

	beforeEach(async () => {
		applicationQuestionsService = {
			findAll: jest.fn(),
			delete: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ApplicationQuestionsController],
			providers: [
				{
					provide: ApplicationQuestionsService,
					useValue: applicationQuestionsService,
				},
			],
		}).compile();

		applicationQuestionsController = module.get<ApplicationQuestionsController>(ApplicationQuestionsController);
	});

	describe('getApplicationQuestions', () => {
		it('should request application questions for the authenticated team', async () => {
			applicationQuestionsService.findAll.mockResolvedValue({
				data: [{ id: 'question-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});

			const pagination = { page: 1, limit: 20 };
			const sorting = { sortBy: 'title', order: 'asc' };
			const filter = { filter: { required: true } };
			const req = { token: { id: 'team-123' } } as Request;

			const result = await applicationQuestionsController.getApplicationQuestions(
				pagination as never,
				sorting as never,
				filter as never,
				req,
			);

			expect(applicationQuestionsService.findAll).toHaveBeenCalledWith(
				pagination,
				'title',
				'asc',
				{ required: true },
				'team-123',
			);
			expect(result).toEqual({
				data: [{ id: 'question-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});
		});
	});

	describe('deleteApplicationQuestion', () => {
		it('should delete the question for the authenticated team', async () => {
			applicationQuestionsService.delete.mockResolvedValue(undefined);

			const req = { token: { id: 'team-123' } } as unknown as Request;

			const result = await applicationQuestionsController.deleteApplicationQuestion('question-1', req);

			expect(applicationQuestionsService.delete).toHaveBeenCalledWith('question-1', 'team-123');
			expect(result).toBeUndefined();
		});
	});
});
