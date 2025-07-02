export async function sendBtWebhook(url: string | null, type: WebhookType, content: any) {
	if (url) {
		try {
			await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({ type, data: content }),
			});
			console.info(`Sent ${type} to ${url}`);
		} catch (e) {
			console.error(`Failed to send ${type} to ${url}: ${e}`);
			return false;
		}
	}
}

export const WebhookType = {
	APPLICATION: 'APPLICATION',
	APPLICATION_SEND: 'APPLICATION_SEND',
	CLAIM_CREATE: 'CLAIM_CREATE',
	CLAIM_UPDATE: 'CLAIM_UPDATE',
	CLAIM_DELETE: 'CLAIM_DELETE',
};

export type WebhookType = (typeof WebhookType)[keyof typeof WebhookType];
