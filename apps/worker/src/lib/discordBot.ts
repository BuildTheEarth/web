import { z } from 'zod';

export type DiscordDmResult = {
	success: string[];
	failure: string[];
};

export enum DiscordBotEmojisRaw {
	WARN = '<:warn:1441532241628102686>',
	UNMUTE = '<:unmute:1441532234573156433>',
	UNBAN = '<:unban:1441532232627130548>',
	MUTE = '<:mute:1441532230643224587>',
	KICK = '<:kick:1441532228550131725>',
	INVALID = '<:invalid:1441532226427813901>',
	INFORMATION = '<:information:1441532225119191175>',
	INPROGRESS = '<:inprogress:1441532224473268234>',
	FORWARDED = '<:forwarded:1441532223298863305>',
	DUPLICATE = '<:duplicate:1441532221470146663>',
	DENIED = '<:denied:1441532217779294350>',
	BAN = '<:ban:1441532215828676790>',
	APPROVED = '<:approved:1441532214562128034>',
}
export enum DiscordBotEmojis {
	WARN = 'WARN',
	UNMUTE = 'UNMUTE',
	UNBAN = 'UNBAN',
	MUTE = 'MUTE',
	KICK = 'KICK',
	INVALID = 'INVALID',
	INFORMATION = 'INFORMATION',
	INPROGRESS = 'INPROGRESS',
	FORWARDED = 'FORWARDED',
	DUPLICATE = 'DUPLICATE',
	DENIED = 'DENIED',
	BAN = 'BAN',
	APPROVED = 'APPROVED',
}

export const discordBotMessageMessageSchema = z.object({
	title: z.string(),
	emoji: z.nativeEnum(DiscordBotEmojis),
	body: z.string(),
	footer: z.string().optional(),
});

export async function sendDiscordDm(
	message: string | z.infer<typeof discordBotMessageMessageSchema>,
	users: string[],
): Promise<DiscordDmResult> {
	try {
		const content =
			typeof message === 'string'
				? message
				: `## ${DiscordBotEmojisRaw[message.emoji]} ${message.title}\n\n${message.body}${
						message.footer ? `\n\n-# ${message.footer}` : ''
					}`;

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
