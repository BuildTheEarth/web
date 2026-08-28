import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';

/**
 * Global on purpose, unlike the other shared providers here: QueueService owns a
 * Redis connection, and listing it in each module's own providers would open one
 * connection per module.
 */
@Global()
@Module({
	providers: [QueueService],
	exports: [QueueService],
})
export class QueueModule {}
