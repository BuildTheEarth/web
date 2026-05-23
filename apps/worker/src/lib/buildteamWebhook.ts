import { logger } from './logger';
import prisma from './prisma';

type WebhookPayload = {
	type: string;
	data: any;
};
export type WebhookBuildTeam =
	| {
			url: string;
	  }
	| { id: string }
	| { slug: string };

export class BuildTeamWebhook {
	async send(
		destination: WebhookBuildTeam,
		type: string,
		data: WebhookPayload['data'],
	): Promise<{ ok: boolean; status: number; error?: string }> {
		const url = 'url' in destination ? destination.url : await this.resolveUrl(destination);

		if (!url) {
			return { ok: true, status: 202 };
		}

		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'BuildTheEarth Worker',
					Accept: 'application/json',
				},
				body: JSON.stringify({ type, data }),
			});

			const body = await res.text();

			if (!res.ok) {
				logger.error('BuildTeam webhook request failed', { status: res.status });
				return { ok: false, status: res.status, error: typeof body === 'string' ? body : undefined };
			}

			logger.debug('BuildTeam webhook sent', { status: res.status });
			return { ok: true, status: res.status };
		} catch (err: any) {
			logger.error('BuildTeam webhook error', { error: err?.message });
			return { ok: false, status: 0, error: err?.message };
		}
	}

	private async resolveUrl(destination: WebhookBuildTeam): Promise<string | null> {
		const bt = await prisma.buildTeam.findUnique({
			where:
				'id' in destination ? { id: destination.id } : 'slug' in destination ? { slug: destination.slug } : { id: '' },
		});
		return bt?.webhook || null;
	}
}

export default new BuildTeamWebhook();
