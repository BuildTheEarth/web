/**
 * A list of events that can be added to the Redis queue.
 */
export enum RedisEvent {
	SEND_DISCORD_DM = 'SEND_DISCORD_DM',
	SEND_DISCORD_LOG = 'SEND_DISCORD_LOG',
	BUILDTEAM_WEBHOOK = 'BUILDTEAM_WEBHOOK',
}

/**
 * A list of administrative events that can be triggered.
 * These events should not be added to the queue by a regular user.
 */
export enum RedisAdminEvent {
	REVIEW_ACTIVITY_CHECK = 'REVIEW_ACTIVITY_CHECK',
	PURGE_CLAIMS = 'PURGE_CLAIMS',
	PURGE_VERIFICATIONS = 'PURGE_VERIFICATIONS',
	REMIND_APPLICATIONS = 'REMIND_APPLICATIONS',
}

export type AnyRedisEvent = RedisEvent | RedisAdminEvent
