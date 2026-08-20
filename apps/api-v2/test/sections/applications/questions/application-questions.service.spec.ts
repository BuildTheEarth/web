import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApplicationQuestionType } from '@repo/db';
import { PrismaService } from 'src/common/db/prisma.service';
import { ApplicationQuestionsService } from 'src/sections/applications/questions/application-questions.service';

describe('ApplicationQuestionsService', () => {
	let applicationQuestionsService: ApplicationQuestionsService;
	let prismaService: {
		$transaction: jest.Mock;
		applicationQuestion: {
			findMany: jest.Mock;
			count: jest.Mock;
			create: jest.Mock;
			update: jest.Mock;
			updateMany: jest.Mock;
			findUnique: jest.Mock;
			deleteMany: jest.Mock;
		};
		buildTeam: {
			findUnique: jest.Mock;
		};
	};

	const question = {
		title: 'What is your experience?',
		subtitle: 'Tell us about your past projects and roles.',
		type: ApplicationQuestionType.TEXT,
		icon: 'briefcase',
		sort: 1,
	};

	beforeEach(() => {
		prismaService = {
			$transaction: jest.fn(),
			applicationQuestion: {
				findMany: jest.fn(),
				count: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
				updateMany: jest.fn(),
				findUnique: jest.fn(),
				deleteMany: jest.fn(),
			},
			buildTeam: {
				findUnique: jest.fn(),
			},
		};

		applicationQuestionsService = new ApplicationQuestionsService(prismaService as unknown as PrismaService);
	});

	describe('findAll', () => {
		it('should apply pagination, sorting, filter, and build team constraints', async () => {
			prismaService.applicationQuestion.findMany.mockResolvedValue([{ id: 'question-1' }]);
			prismaService.applicationQuestion.count.mockResolvedValue(4);

			const result = await applicationQuestionsService.findAll(
				{ page: 2, limit: 2 },
				'sort',
				'desc',
				{ required: true },
				'team-123',
			);

			expect(prismaService.applicationQuestion.findMany).toHaveBeenCalledWith({
				where: { required: true, buildTeamId: 'team-123' },
				orderBy: { sort: 'desc' },
				skip: 2,
				take: 2,
			});
			expect(result).toEqual({
				data: [{ id: 'question-1' }],
				meta: { page: 2, perPage: 2, totalItems: 4, totalPages: 2 },
			});
		});
	});

	describe('findAllForTeam', () => {
		it('should resolve the team by id and return its questions', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-123' });
			prismaService.applicationQuestion.findMany.mockResolvedValue([{ id: 'question-1' }]);
			prismaService.applicationQuestion.count.mockResolvedValue(1);

			const result = await applicationQuestionsService.findAllForTeam(
				'team-123',
				false,
				{ page: 1, limit: 20 },
				'sort',
				'asc',
			);

			expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith({
				where: { id: 'team-123' },
				select: { id: true },
			});
			expect(prismaService.applicationQuestion.findMany).toHaveBeenCalledWith({
				where: { buildTeamId: 'team-123' },
				orderBy: { sort: 'asc' },
				skip: 0,
				take: 20,
			});
			expect(result.data).toEqual([{ id: 'question-1' }]);
		});

		it('should resolve the team by slug when requested', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-123' });
			prismaService.applicationQuestion.findMany.mockResolvedValue([]);
			prismaService.applicationQuestion.count.mockResolvedValue(0);

			await applicationQuestionsService.findAllForTeam('my-team', true, { page: 1, limit: 20 });

			expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith({
				where: { slug: 'my-team' },
				select: { id: true },
			});
		});

		it('should throw when the team does not exist', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue(null);

			await expect(
				applicationQuestionsService.findAllForTeam('missing', false, { page: 1, limit: 20 }),
			).rejects.toThrow(NotFoundException);
			expect(prismaService.applicationQuestion.findMany).not.toHaveBeenCalled();
		});
	});

	describe('create', () => {
		it('should create the question for the given team', async () => {
			prismaService.applicationQuestion.create.mockResolvedValue({ id: 'question-1' });

			const result = await applicationQuestionsService.create(question, 'team-123');

			expect(prismaService.applicationQuestion.create).toHaveBeenCalledWith({
				data: { ...question, buildTeamId: 'team-123' },
			});
			expect(result).toEqual({ id: 'question-1' });
		});
	});

	describe('update', () => {
		it('should only update questions of the given team', async () => {
			prismaService.applicationQuestion.updateMany.mockResolvedValue({ count: 1 });
			prismaService.applicationQuestion.findUnique.mockResolvedValue({ id: 'question-1', title: 'Updated' });

			const result = await applicationQuestionsService.update('question-1', { title: 'Updated' }, 'team-123');

			expect(prismaService.applicationQuestion.updateMany).toHaveBeenCalledWith({
				where: { id: 'question-1', buildTeamId: 'team-123' },
				data: { title: 'Updated' },
			});
			expect(result).toEqual({ id: 'question-1', title: 'Updated' });
		});

		it('should throw when the question does not belong to the team', async () => {
			prismaService.applicationQuestion.updateMany.mockResolvedValue({ count: 0 });

			await expect(applicationQuestionsService.update('question-1', { title: 'Updated' }, 'team-123')).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.applicationQuestion.findUnique).not.toHaveBeenCalled();
		});
	});

	describe('upsertMany', () => {
		beforeEach(() => {
			prismaService.$transaction.mockImplementation(async (operations: unknown[]) => await Promise.all(operations));
		});

		it('should update existing questions and create new ones', async () => {
			prismaService.applicationQuestion.findMany.mockResolvedValue([{ id: 'question-1', buildTeamId: 'team-123' }]);
			prismaService.applicationQuestion.update.mockResolvedValue({ id: 'question-1' });
			prismaService.applicationQuestion.create.mockResolvedValue({ id: 'question-2' });

			const result = await applicationQuestionsService.upsertMany(
				[
					{ ...question, id: 'question-1' },
					{ ...question, sort: 2 },
				],
				'team-123',
			);

			expect(prismaService.applicationQuestion.findMany).toHaveBeenCalledWith({
				where: { id: { in: ['question-1'] } },
				select: { id: true, buildTeamId: true },
			});
			expect(prismaService.applicationQuestion.update).toHaveBeenCalledWith({
				where: { id: 'question-1' },
				data: question,
			});
			expect(prismaService.applicationQuestion.create).toHaveBeenCalledWith({
				data: { ...question, sort: 2, buildTeamId: 'team-123' },
			});
			expect(result).toEqual([{ id: 'question-1' }, { id: 'question-2' }]);
		});

		it('should create a question with the given id when it does not exist yet', async () => {
			prismaService.applicationQuestion.findMany.mockResolvedValue([]);
			prismaService.applicationQuestion.create.mockResolvedValue({ id: 'question-9' });

			await applicationQuestionsService.upsertMany([{ ...question, id: 'question-9' }], 'team-123');

			expect(prismaService.applicationQuestion.update).not.toHaveBeenCalled();
			expect(prismaService.applicationQuestion.create).toHaveBeenCalledWith({
				data: { ...question, id: 'question-9', buildTeamId: 'team-123' },
			});
		});

		it('should not look up ids when every question is new', async () => {
			prismaService.applicationQuestion.create.mockResolvedValue({ id: 'question-1' });

			await applicationQuestionsService.upsertMany([question], 'team-123');

			expect(prismaService.applicationQuestion.findMany).not.toHaveBeenCalled();
		});

		it('should refuse to touch questions of another team', async () => {
			prismaService.applicationQuestion.findMany.mockResolvedValue([{ id: 'question-1', buildTeamId: 'other-team' }]);

			await expect(
				applicationQuestionsService.upsertMany([{ ...question, id: 'question-1' }], 'team-123'),
			).rejects.toThrow(ForbiddenException);
			expect(prismaService.$transaction).not.toHaveBeenCalled();
		});
	});

	describe('delete', () => {
		it('should delete the question for the given question and team ids', async () => {
			prismaService.applicationQuestion.deleteMany.mockResolvedValue({ count: 1 });

			await expect(applicationQuestionsService.delete('question-1', 'team-123')).resolves.toBeUndefined();

			expect(prismaService.applicationQuestion.deleteMany).toHaveBeenCalledWith({
				where: {
					id: 'question-1',
					buildTeamId: 'team-123',
				},
			});
		});

		it('should throw when the question does not belong to the team', async () => {
			prismaService.applicationQuestion.deleteMany.mockResolvedValue({ count: 0 });

			await expect(applicationQuestionsService.delete('question-1', 'team-123')).rejects.toThrow(NotFoundException);
		});
	});
});
