import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationQuestionType } from '@repo/db';
import { Request } from 'express';
import { ApplicationQuestionsController } from 'src/sections/applications/questions/application-questions.controller';
import { ApplicationQuestionsService } from 'src/sections/applications/questions/application-questions.service';

describe('ApplicationQuestionsController', () => {
	let applicationQuestionsController: ApplicationQuestionsController;
	let applicationQuestionsService: {
		findAll: jest.Mock;
		create: jest.Mock;
		update: jest.Mock;
		upsertMany: jest.Mock;
		delete: jest.Mock;
	};

	const question = {
		title: 'What is your experience?',
		subtitle: 'Tell us about your past projects and roles.',
		type: ApplicationQuestionType.TEXT,
		icon: 'briefcase',
		sort: 1,
	};

	beforeEach(async () => {
		applicationQuestionsService = {
			findAll: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			upsertMany: jest.fn(),
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

	describe('createApplicationQuestion', () => {
		it('should create the question for the authenticated team', async () => {
			applicationQuestionsService.create.mockResolvedValue({ id: 'question-1' });

			const req = { token: { id: 'team-123' } } as Request;

			const result = await applicationQuestionsController.createApplicationQuestion(question, req);

			expect(applicationQuestionsService.create).toHaveBeenCalledWith(question, 'team-123');
			expect(result).toEqual({ id: 'question-1' });
		});
	});

	describe('upsertApplicationQuestions', () => {
		it('should upsert the questions for the authenticated team', async () => {
			applicationQuestionsService.upsertMany.mockResolvedValue([{ id: 'question-1' }]);

			const questions = [{ ...question, id: 'question-1' }];
			const req = { token: { id: 'team-123' } } as Request;

			const result = await applicationQuestionsController.upsertApplicationQuestions(questions, req);

			expect(applicationQuestionsService.upsertMany).toHaveBeenCalledWith(questions, 'team-123');
			expect(result).toEqual([{ id: 'question-1' }]);
		});
	});

	describe('updateApplicationQuestion', () => {
		it('should update the question for the authenticated team', async () => {
			applicationQuestionsService.update.mockResolvedValue({ id: 'question-1', title: 'Updated' });

			const req = { token: { id: 'team-123' } } as Request;

			const result = await applicationQuestionsController.updateApplicationQuestion(
				'question-1',
				{ title: 'Updated' },
				req,
			);

			expect(applicationQuestionsService.update).toHaveBeenCalledWith('question-1', { title: 'Updated' }, 'team-123');
			expect(result).toEqual({ id: 'question-1', title: 'Updated' });
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
