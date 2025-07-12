import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@repo/db';

/**
 * PrismaService is a wrapper around PrismaClient that handles connection management.
 * It implements OnModuleInit to connect to the database when the module is initialized.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	async onModuleInit() {
		await this.$connect();
	}
}
