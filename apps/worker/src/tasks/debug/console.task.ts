import { PrismaClient } from '@repo/db';
import { Job } from 'bullmq';
import { sendBotMessage } from 'src/lib/discordBot';
import { Logger } from 'winston';
import { BaseTask } from '../base.task';

interface ConsolePayload {
	content: string;
}

export class ConsoleTask extends BaseTask<ConsolePayload> {
	readonly name = 'DEBUG_CONSOLE';

	async execute(data: ConsolePayload, { prisma, logger, job }: { prisma: PrismaClient; logger: Logger; job: Job }) {
		logger.info(`Console Task: ${data.content}`);
	}
}
