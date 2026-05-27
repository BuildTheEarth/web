import { PrismaClient } from '@repo/db';
import { Job } from 'bullmq';
import { BuildTeamWebhook, WebhookBuildTeam } from 'src/lib/buildteamWebhook';
import { Logger } from 'winston';
import { z } from 'zod';
import { BaseTask } from '../base.task';

enum AuditLogBuildTeamType {
	APPLICATION = 'APPLICATION',
	APPLICATION_SEND = 'APPLICATION_SEND',
	CLAIM_CREATE = 'CLAIM_CREATE',
	CLAIM_UPDATE = 'CLAIM_UPDATE',
	CLAIM_DELETE = 'CLAIM_DELETE',
}

const webhookBuildTeamSchema = z.union([
	z.object({ url: z.string().min(1) }),
	z.object({ id: z.string().min(1) }),
	z.object({ slug: z.string().min(1) }),
]);

const auditLogBtPayloadSchema = z.object({
	type: z.nativeEnum(AuditLogBuildTeamType),
	data: z.unknown().optional(),
	destination: z.array(webhookBuildTeamSchema),
});

type AuditLogBtPayload = z.infer<typeof auditLogBtPayloadSchema>;

class PartialBuildTeamWebhookFailureError extends Error {
	readonly failed: WebhookBuildTeam[];

	constructor(failed: WebhookBuildTeam[]) {
		super(`Failed to send BuildTeam Webhook to ${failed.length} BuildTeam(s)`);
		this.name = 'PartialBuildTeamWebhookFailureError';
		this.failed = failed;
	}
}

export class SendBuildTeamWebhookTask extends BaseTask<typeof auditLogBtPayloadSchema> {
	readonly name = 'BUILDTEAM_WEBHOOK';
	readonly schema = auditLogBtPayloadSchema;

	async execute(data: AuditLogBtPayload, job: Job) {
		const { type, data: content, destination } = data;

		if (!destination || destination.length === 0) {
			return;
		}
		if (!Object.values(AuditLogBuildTeamType).includes(type)) {
			this.logger.warn(`Unknown AuditLogBuildTeamType: ${type}`);
			return;
		}

		const failed: WebhookBuildTeam[] = [];

		for (const dest of destination) {
			try {
				const { ok, status, error } = await new BuildTeamWebhook().send(dest, type, this.transformData(type, content));
				if (!ok) {
					failed.push(dest);
					if (error) {
						this.logger.warn(`Failed to send BuildTeam Webhook`, {
							destination: 'url' in dest ? dest.url : 'id' in dest ? dest.id : 'slug' in dest ? dest.slug : 'unknown',
							error,
							status,
						});
					}
				}
			} catch (err: any) {
				failed.push(dest);
			}
		}

		if (failed.length > 0) {
			this.logger.warn(`Failed to send BuildTeam Webhook to some BuildTeams`, {
				successCount: destination.length - failed.length,
				failedCount: failed.length,
				failed: failed.map((d) => ('url' in d ? d.url : 'id' in d ? d.id : 'slug' in d ? d.slug : 'unknown')),
			});

			// Let BullMQ retry with the failed IDs
			await job.updateData({
				...data,
				destination: failed,
			});
			throw new PartialBuildTeamWebhookFailureError(failed);
		}
	}

	private transformData(type: AuditLogBuildTeamType, data: any): any {
		switch (type) {
			case AuditLogBuildTeamType.APPLICATION:
			case AuditLogBuildTeamType.APPLICATION_SEND:
				return {
					id: data.id,
					status: data.status,
					createdAt: data.createdAt,
					reviewedAt: data.reviewedAt,
					reason: data.reason,
					trial: data.trial,
					buildteamId: data.buildteamId,
					buildteam: {
						id: data.buildteam.id,
						name: data.buildteam.name,
						slug: data.buildteam.slug,
						acceptionMessage: data.buildteam.acceptionMessage,
						rejectionMessage: data.buildteam.rejectionMessage,
						trialMessage: data.buildteam.trialMessage,
					},
					userId: data.userId,
					user: {
						id: data.user.id,
						username: data.user.username,
						discordId: data.user.discordId,
						minecraft: data.user.minecraft,
					},
					reviewerId: data.reviewerId,
					reviewer: data.reviewer?.id
						? {
								id: data.reviewer?.id,
								username: data.reviewer?.username,
								discordId: data.reviewer?.discordId,
								minecraft: data.reviewer?.minecraft,
							}
						: undefined,
					ApplicationAnswer: data.ApplicationAnswer,
				};
			case AuditLogBuildTeamType.CLAIM_CREATE:
			case AuditLogBuildTeamType.CLAIM_UPDATE:
			case AuditLogBuildTeamType.CLAIM_DELETE:
				return {
					id: data.id,
					externalId: data.externalId,
					ownerId: data.ownerId,
					area: data.area,
					center: data.center,
					size: data.size,
					buildings: data.buildings,
					active: data.active,
					finished: data.finished,
					buildTeamId: data.buildTeamId,
					name: data.name,
					description: data.description,
					city: data.city,
					osmName: data.osmName,
					createdAt: data.createdAt,
				};
			default:
				// DOES NOT STRIP ANY TOKEN, WEBHOOK LINK etc.
				return data;
		}
	}
}
