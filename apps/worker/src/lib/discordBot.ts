export type DiscordDmResult = {
	success: string[];
	failure: string[];
};

export async function sendBotMessage(content: any, users: string[]): Promise<DiscordDmResult> {
	try {
		const res = await fetch(process.env.DISCORD_BOT_API_URL + '/api/v1/website/message/blank', {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
				authorization: `Bearer ${process.env.DISCORD_BOT_SECRET}`,
			},
			body: JSON.stringify({ params: { text: content }, ids: users }),
		});
		const json = await res.json();
		return {
			success: json.success || [],
			failure: json.failed || [],
		};
	} catch (e) {
		console.error(e);
		return {
			success: [],
			failure: users,
		};
	}
}
