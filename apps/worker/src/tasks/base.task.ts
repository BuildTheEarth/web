import { PrismaClient } from '@repo/db';
import { Job, Queue } from 'bullmq';
import { Logger } from 'winston';
import { type ZodTypeAny, z } from 'zod';

export abstract class BaseTask<TSchema extends ZodTypeAny = ZodTypeAny> {
	abstract readonly name: string;
	abstract readonly schema: TSchema;
	logger: Logger;
	prisma: PrismaClient;

	setContext(logger: Logger, prisma: PrismaClient) {
		this.logger = logger;
		this.prisma = prisma;
	}

	validate(data: unknown): z.infer<TSchema> {
		return this.schema.parse(data);
	}

	abstract execute(data: z.infer<TSchema>, job: Job, queue: Queue): Promise<void>;
}
