import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationQuestionType } from '@repo/db';
import { Request } from 'express';
import { ApplicationQuestionsController } from 'src/sections/applications/questions/application-questions.controller';
import { ApplicationQuestionsService } from 'src/sections/applications/questions/application-questions.service';

describe('ApplicationQuestionsController', () => {
	let applicationQuestionsController: ApplicationQuestionsController;
	let applicationQuestionsService: {
		findAll: jest.Mock;
		findAllForTeam: jest.Mock;
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

	const pagination = { page: 1, limit: 100 };
	const sorting = { sortBy: 'sort', order: 'asc' };
	const authed = { token: { id: 'team-123' } } as Request;

	beforeEach(async () => {
		applicationQuestionsService = {
			findAll: jest.fn(),
			findAllForTeam: jest.fn(),
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
		it('should use the authenticated team when no team is in the path', async () => {
			applicationQuestionsService.findAll.mockResolvedValue({
				data: [{ id: 'question-1' }],
				meta: { page: 1, perPage: 100, totalItems: 1, totalPages: 1 },
			});

			const result = await applicationQuestionsController.getApplicationQuestions(
				undefined,
				pagination as never,
				sorting as never,
				{ filter: { required: true } } as never,
				authed,
			);

			expect(applicationQuestionsService.findAll).toHaveBeenCalledWith(
				pagination,
				'sort',
				'asc',
				{ required: true },
				'team-123',
			);
			expect(applicationQuestionsService.findAllForTeam).not.toHaveBeenCalled();
			expect(result).toEqual({
				data: [{ id: 'question-1' }],
				meta: { page: 1, perPage: 100, totalItems: 1, totalPages: 1 },
			});
		});

		it('should use the team in the path without requiring a token', async () => {
			applicationQuestionsService.findAllForTeam.mockResolvedValue({ data: [], meta: {} });

			await applicationQuestionsController.getApplicationQuestions(
				'team-999',
				pagination as never,
				sorting as never,
				{ filter: { required: true } } as never,
				{} as Request,
			);

			expect(applicationQuestionsService.findAllForTeam).toHaveBeenCalledWith(
				'team-999',
				false,
				pagination,
				'sort',
				'asc',
				{
					required: true,
				},
			);
			expect(applicationQuestionsService.findAll).not.toHaveBeenCalled();
		});

		it('should forward the slug flag without passing it on as a filter', async () => {
			applicationQuestionsService.findAllForTeam.mockResolvedValue({ data: [], meta: {} });

			await applicationQuestionsController.getApplicationQuestions(
				'my-team',
				pagination as never,
				sorting as never,
				{ filter: { slug: true } } as never,
				{} as Request,
			);

			expect(applicationQuestionsService.findAllForTeam).toHaveBeenCalledWith(
				'my-team',
				true,
				pagination,
				'sort',
				'asc',
				{},
			);
		});

		it('should reject the unprefixed route without a token', async () => {
			await expect(
				applicationQuestionsController.getApplicationQuestions(
					undefined,
					pagination as never,
					sorting as never,
					{ filter: {} } as never,
					{} as Request,
				),
			).rejects.toThrow(UnauthorizedException);
			expect(applicationQuestionsService.findAll).not.toHaveBeenCalled();
		});
	});

	describe('createApplicationQuestion', () => {
		it('should create the question for the authenticated team', async () => {
			applicationQuestionsService.create.mockResolvedValue({ id: 'question-1' });

			const result = await applicationQuestionsController.createApplicationQuestion(question, 'team-123');

			expect(applicationQuestionsService.create).toHaveBeenCalledWith(question, 'team-123');
			expect(result).toEqual({ id: 'question-1' });
		});
	});

	describe('upsertApplicationQuestions', () => {
		it('should upsert the questions for the authenticated team', async () => {
			applicationQuestionsService.upsertMany.mockResolvedValue([{ id: 'question-1' }]);

			const questions = [{ ...question, id: 'question-1' }];
			const result = await applicationQuestionsController.upsertApplicationQuestions(questions, 'team-123');

			expect(applicationQuestionsService.upsertMany).toHaveBeenCalledWith(questions, 'team-123');
			expect(result).toEqual([{ id: 'question-1' }]);
		});
	});

	describe('updateApplicationQuestion', () => {
		it('should update the question for the authenticated team', async () => {
			applicationQuestionsService.update.mockResolvedValue({ id: 'question-1', title: 'Updated' });

			const result = await applicationQuestionsController.updateApplicationQuestion(
				'question-1',
				{ title: 'Updated' },
				'team-123',
			);

			expect(applicationQuestionsService.update).toHaveBeenCalledWith('question-1', { title: 'Updated' }, 'team-123');
			expect(result).toEqual({ id: 'question-1', title: 'Updated' });
		});
	});

	describe('deleteApplicationQuestion', () => {
		it('should delete the question for the authenticated team', async () => {
			applicationQuestionsService.delete.mockResolvedValue(undefined);

			const result = await applicationQuestionsController.deleteApplicationQuestion('question-1', 'team-123');

			expect(applicationQuestionsService.delete).toHaveBeenCalledWith('question-1', 'team-123');
			expect(result).toBeUndefined();
		});
	});
});
