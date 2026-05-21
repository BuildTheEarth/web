import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ApplicationQuestionsController } from 'src/sections/applications/questions/application-questions.controller';
import { ApplicationQuestionsService } from 'src/sections/applications/questions/application-questions.service';

describe('ApplicationQuestionsController', () => {
	let applicationQuestionsController: ApplicationQuestionsController;
	let applicationQuestionsService: {
		delete: jest.Mock;
	};

	beforeEach(async () => {
		applicationQuestionsService = {
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
