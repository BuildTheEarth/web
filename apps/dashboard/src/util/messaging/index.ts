import { sendBotMessage } from '../discordIntegration'

export const messages = {
	applicationAccepted: {
		vars: {
			buildTeam: '',
			message: '',
		},
		message:
			'## Application Accepted \n{{{message}}}\n\n-# This is an automated message. Contact {{{buildTeam}}} for help',
	},
	applicationRejected: {
		vars: {
			buildTeam: '',
			message: '',
		},
		message:
			'@silent## Application Rejected \n{{{message}}}\n\n-# This is an automated message. Contact {{{buildTeam}}} for help',
	},

	blank: {
		vars: {
			title: '',
			message: '',
		},
		message:
			'## {{{title}}}\n{{{message}}}\n\n-# This is an automated message. Respond by messaging <@!1231681049961168956>',
	},
	blankStaff: {
		vars: {
			title: '',
			message: '',
		},
		message:
			'## {{{title}}}\n{{{message}}}\n\n-# This message was sent by BTE Support. Respond by messaging <@!1231681049961168956>',
	},
}

type MessageKeys = keyof typeof messages
type MessageContent<T extends MessageKeys> = {
	[K in keyof (typeof messages)[T]['vars']]: string
}

export async function messageUser<T extends MessageKeys>(
	discordId: string,
	messageType: T,
	content: MessageContent<T>,
) {
	const rawMessage = messages[messageType].message

	let message = rawMessage.replace(/{{{(.*?)}}}/g, (_, key: keyof MessageContent<T>) => {
		return content[key]
	})

	const response = await sendBotMessage(message, [discordId])

	if (response.success.includes(discordId)) {
		return true
	}

	return false
}
