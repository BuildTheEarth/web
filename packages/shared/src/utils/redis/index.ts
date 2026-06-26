import { RedisEventQueue } from './redisEventQueue'
export * from './redisEventQueue'
export * from './redisEvents'

/*

	Singleton pattern for RedisEventQueue

*/
const redisEventQueueSingleton = () => {
	return new RedisEventQueue()
}

declare const globalThis: {
	redisEventQueueGlobal: ReturnType<typeof redisEventQueueSingleton>
} & typeof global

const redisEventQueue = globalThis.redisEventQueueGlobal ?? redisEventQueueSingleton()

export default redisEventQueue

if (process.env.NODE_ENV !== 'production') globalThis.redisEventQueueGlobal = redisEventQueue
