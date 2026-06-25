import { Queue } from 'bullmq'
import 'dotenv/config'
import { config } from '../src/lib/config'
import { redis } from '../src/lib/redis'

const testQueue = new Queue(config.eventQueueName, {
	connection: redis,
	...config.retryOptions,
	...config.removalOptions,
})

async function trigger() {
	console.log('🚀 Simulating Dashboard action: Queueing a Discord DM request...')

	await testQueue.add(
		'SEND_DISCORD_DM',
		{
			discordId: '635411595253776385',
			content: ' buhuwhd',
		},
		{
			...config.retryOptions,
			...config.removalOptions,
		},
	)

	console.log('✅ Job successfully pushed to Redis. Closing connection.')
	await testQueue.close()
	process.exit(0)
}

trigger()
