import { PrismaClient } from '@repo/db';
import { Job } from 'bullmq';
import { config } from 'src/lib/config';
import { sendBotMessage } from 'src/lib/discordBot';
import discordWebhook from 'src/lib/discordWebhook';
import { getReviewActivityScore } from 'src/util/reviewActivity';
import { Logger } from 'winston';
import { z } from 'zod';
import { BaseTask } from '../base.task';

const reviewActivityCheckPayloadSchema = z.void();
type reviewActivityCheckPayloadSchema = z.infer<typeof reviewActivityCheckPayloadSchema>;

type ReviewActivityData = {
	date: Date;
	current: { id: string; art: number; par: number; ps: number; res: number; ras: number }[];
	compared: { id: string; art: number; par: number; ps: number; res: number; ras: number }[];
};

export class ReviewActivityCheckTask extends BaseTask<typeof reviewActivityCheckPayloadSchema> {
	readonly name = 'SEND_DISCORD_DM';
	readonly schema = reviewActivityCheckPayloadSchema;
	private readonly CHUNK_SIZE = 9;

	async execute(_data: reviewActivityCheckPayloadSchema, _job: Job) {
		const pastData = await this.fetchPastData();
		const buildTeams = await this.fetchBuildTeams();

		const newData = await this.calculateReviewActivityScores(buildTeams, pastData);

		await this.saveDataToDB(newData);
		await this.sendDiscordMessages(newData, buildTeams);
	}

	private async fetchPastData() {
		this.logger.debug('Fetching past data from DB...');

		const pastData = ((await this.prisma.jsonStore.findFirst({ where: { id: 'pastReviewActivity' } }))?.data || {
			date: new Date(),
			current: [],
			compared: [],
		}) as ReviewActivityData;

		this.logger.debug(`Found data from ${pastData.date.toISOString()} with ${pastData.current.length} BuildTeams.`);
		return pastData;
	}

	private async fetchBuildTeams() {
		this.logger.debug('Fetching BuildTeams...');

		return this.prisma.buildTeam.findMany({
			select: { id: true, name: true },
			where: { allowApplications: true },
		});
	}

	private async calculateReviewActivityScores(
		buildTeams: { id: string; name: string }[],
		pastData: ReviewActivityData,
	): Promise<ReviewActivityData> {
		const newData = {
			date: new Date(),
			current: [] as { id: string; art: number; par: number; ps: number; res: number; ras: number }[],
			compared: [] as { id: string; art: number; par: number; ps: number; res: number; ras: number }[],
		};

		const reviewActivities = await Promise.all(
			buildTeams.map(async (buildTeam, i) => {
				const reviewActivity = await getReviewActivityScore(buildTeam.id);
				const pastReviewActivity = pastData.current.find((team: any) => team.id === buildTeam.id) || {
					id: buildTeam.id,
					art: 0,
					par: 0,
					ps: 0,
					res: 0,
					ras: 0,
				};

				return { buildTeam, reviewActivity, pastReviewActivity };
			}),
		);

		reviewActivities.forEach(({ buildTeam, reviewActivity, pastReviewActivity }) => {
			newData.current.push({ id: buildTeam.id, ...reviewActivity });
			newData.compared.push({
				id: buildTeam.id,
				art: reviewActivity.art - pastReviewActivity.art,
				par: reviewActivity.par - pastReviewActivity.par,
				ps: reviewActivity.ps - pastReviewActivity.ps,
				res: reviewActivity.res - pastReviewActivity.res,
				ras: reviewActivity.ras - pastReviewActivity.ras,
			});
		});

		return newData;
	}

	private async saveDataToDB(newData: ReviewActivityData) {
		this.logger.debug('Saving new data to DB...');
		await this.prisma.jsonStore.upsert({
			where: { id: 'pastReviewActivity' },
			update: { data: newData },
			create: { id: 'pastReviewActivity', data: newData },
		});

		this.logger.debug('Data saved successfully.');
	}

	private async sendDiscordMessages(newData: ReviewActivityData, buildTeams: { id: string; name: string }[]) {
		this.logger.debug('Sending Discord messages for review activity changes...');
		const filteredData = this.filterSignificantChanges(newData.compared, newData.current);

		if (filteredData.length > 0) {
			await this.sendChunkedMessages(filteredData, buildTeams);
		} else {
			await this.sendNoChangesMessage();
		}

		await this.sendSummaryMessage(newData, buildTeams);
	}

	private filterSignificantChanges(comparedData: any[], currentData: any[]) {
		const significantIds = new Set(
			comparedData
				.filter(
					(team) =>
						Math.abs(team.art) > 1 ||
						Math.abs(team.par) > 1 ||
						Math.abs(team.ps) > 1 ||
						Math.abs(team.res) > 1 ||
						Math.abs(team.ras) > 1,
				)
				.map((team) => team.id),
		);
		return currentData.filter((team) => significantIds.has(team.id));
	}

	private async sendChunkedMessages(filteredData: any[], buildTeams: { id: string; name: string }[]) {
		const messages: any[] = [];
		for (let i = 0; i < filteredData.length; i += this.CHUNK_SIZE) {
			const chunk = filteredData.slice(i, i + this.CHUNK_SIZE);
			messages.push({
				embeds: chunk.map((team) => this.scoreToEmbed(buildTeams.find((t) => t.id === team.id)?.name || team.id, team)),
				attachments: [],
				components: [],
			});
		}

		for (const message of messages) {
			const res = await discordWebhook.send(config.webhooks.logging, message as any);

			if (!res.ok) {
				this.logger.warn(`Failed to send review activity changes message to Discord`, {
					status: res.status,
					error: res.error,
				});
			}
		}
	}

	private async sendNoChangesMessage() {
		const res = await discordWebhook.send(config.webhooks.logging, {
			content: 'No significant changes in review activity score.',
			author: 'Daily Review Activity Score Changes',
		});

		if (!res.ok) {
			this.logger.warn(`Failed to send 'No changes' message to Discord`, {
				status: res.status,
				error: res.error,
			});
		}
	}

	private async sendSummaryMessage(newData: any, buildTeams: { id: string; name: string }[]) {
		const summaryMessage = {
			embeds: [
				{
					title: `Summary - ${new Date().toLocaleDateString()}`,
					color: 0x00ff00,
					fields: [
						{
							name: 'Bad Scores',
							value: this.formatScores(newData.current, buildTeams, (ras) => ras < 2),
							inline: true,
						},
						{
							name: 'Medium Scores',
							value: this.formatScores(newData.current, buildTeams, (ras) => ras >= 2 && ras < 3.75),
							inline: true,
						},
					],
					timestamp: new Date().toISOString(),
				},
			],
			attachments: [],
			components: [],
		};

		const res = await discordWebhook.send(config.webhooks.logging, summaryMessage as any);

		if (!res.ok) {
			this.logger.warn(`Failed to send 'Summary' message to Discord`, {
				status: res.status,
				error: res.error,
			});
		}
	}

	private scoreToEmbed(
		teamName: string,
		scores: { art: number; par: number; ps: number; res: number; ras: number },
	): { title: string; color: number; fields: { name: string; value: string; inline: true }[] } {
		return {
			title: `Review Activity Score for ${teamName}`,
			color: this.getColorForRas(scores.ras),
			fields: [
				{ name: 'Average Review Time (ART)', value: `${scores.art.toFixed(2)} Days`, inline: true },
				{ name: 'Pending Application Ratio (PAR)', value: `${scores.par.toFixed(2)}%`, inline: true },
				{
					name: 'Review Efficiency Score (RES)',
					value: `${'⭐'.repeat(Math.min(5, Math.max(0, Math.round(scores.res)))).padEnd(5, '☆')}`,
					inline: true,
				},
				{
					name: 'Processing Speed (PS)',
					value: `${'⭐'.repeat(Math.min(5, Math.max(0, Math.round(scores.ps)))).padEnd(5, '☆')}`,
					inline: true,
				},
				{
					name: 'Review Activity Score (RAS)',
					value: `${'⭐'.repeat(Math.min(5, Math.max(0, Math.round(scores.ras)))).padEnd(5, '☆')}`,
					inline: true,
				},
			],
		};
	}

	private getColorForRas(ras: number): number {
		if (ras < 2) return 0xff0000; // Red
		if (ras < 3.75) return 0xffa500; // Orange
		return 0x00ff00; // Green
	}

	private formatScores(
		teams: { id: string; ras: number }[],
		buildTeams: { id: string; name: string }[],
		filterFn: (ras: number) => boolean,
	) {
		return (
			teams
				.filter((team) => filterFn(team.ras))
				.map((team) => `${buildTeams.find((t) => t.id === team.id)?.name || team.id}: ${team.ras.toFixed(2)}`)
				.join('\n') || 'None'
		);
	}
}
