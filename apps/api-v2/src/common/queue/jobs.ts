/**
 * The contract between this API and `apps/worker`.
 *
 * The worker is a separate service that consumes a BullMQ queue, so the two are
 * only coupled through the queue name, the job names and the payload shapes
 * declared here. Every job below has a matching task in
 * `apps/worker/src/tasks/`, and its payload mirrors that task's Zod schema — a
 * change on either side has to be made on both.
 */
export const EVENT_QUEUE_NAME = 'EventQueue';

export enum WorkerJob {
	/** Fills in a claim's center, building count and geocoded location. */
	SyncClaimOsm = 'SYNC_CLAIM_OSM',
	/** Delivers an event to the webhook URLs of the given build teams. */
	BuildTeamWebhook = 'BUILDTEAM_WEBHOOK',
	/** Posts a message to the staff-only Discord logging channel. */
	SendDiscordLog = 'SEND_DISCORD_LOG',
	/** Sends a Discord DM to one or more users. */
	SendDiscordDm = 'SEND_DISCORD_DM',
	/** Adds or removes the Discord builder role for a user. */
	SyncDiscordRoles = 'SYNC_DISCORD_ROLES',
	/** Asks the frontend to revalidate cached pages. */
	RevalidateWebsite = 'REVALIDATE_WEBSITE',
}

/**
 * The event types the build team webhook task understands.
 */
export enum BuildTeamWebhookEvent {
	Application = 'APPLICATION',
	ApplicationSend = 'APPLICATION_SEND',
	ClaimCreate = 'CLAIM_CREATE',
	ClaimUpdate = 'CLAIM_UPDATE',
	ClaimDelete = 'CLAIM_DELETE',
}

/**
 * A webhook destination. The worker resolves a team by ID or slug and reads its
 * stored webhook URL, so this API never has to hold that URL itself.
 */
export type WebhookDestination = { id: string } | { slug: string } | { url: string };

export interface WorkerJobPayloads {
	[WorkerJob.SyncClaimOsm]: { claimId: string };
	[WorkerJob.BuildTeamWebhook]: {
		type: BuildTeamWebhookEvent;
		data?: unknown;
		destination: WebhookDestination[];
	};
	[WorkerJob.SendDiscordLog]: Record<string, unknown>;
	[WorkerJob.SendDiscordDm]: {
		userId?: string;
		userIds?: string[];
		discordId?: string;
		discordIds?: string[];
		content: unknown;
	};
	[WorkerJob.SyncDiscordRoles]: { discordId: string; isBuilder: boolean };
	[WorkerJob.RevalidateWebsite]: { paths?: string[]; tags?: string[] };
}
