import { logger } from './logger';

type WebhookPayload = {
	content?: string;
	username?: string;
	avatar_url?: string;
	embeds?: unknown[];
	[key: string]: unknown;
};

export class DiscordWebhook {
	async send(
		url: string,
		payload: WebhookPayload,
	): Promise<{ ok: boolean; status: number; body?: unknown; error?: string }> {
		if (!url) throw new Error('Discord webhook URL is required');

		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			const text = await res.text();
			let body: unknown = text;
			try {
				body = JSON.parse(text);
			} catch {
				body = text;
			}

			if (!res.ok) {
				logger.error('Discord webhook request failed', { status: res.status, body });
				return { ok: false, status: res.status, body, error: typeof body === 'string' ? body : undefined };
			}

			logger.debug('Discord webhook sent', { status: res.status });
			return { ok: true, status: res.status, body };
		} catch (err: any) {
			logger.error('Discord webhook error', { error: err?.message });
			return { ok: false, status: 0, error: err?.message };
		}
	}
}

export default new DiscordWebhook();
