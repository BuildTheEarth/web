import { PrismaClient } from '@repo/db';
import { Job } from 'bullmq';
import { Logger } from 'winston';

export abstract class BaseTask<T = any> {
	abstract readonly name: string;

	abstract execute(data: T, context: { prisma: PrismaClient; logger: Logger; job: Job }): Promise<void>;
}
