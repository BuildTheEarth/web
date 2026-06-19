export async function sendBotMessage(content: any, users: string[]) {
	try {
		const res = await fetch(process.env.DISCORD_BOT_URL + '/api/v1/website/message/blank', {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
				authorization: `Bearer ${process.env.DISCORD_BOT_SECRET}`,
			},
			body: JSON.stringify({ params: { text: content }, ids: users }),
		})
		const json = await res.json()
		return json
	} catch (e) {
		console.error(e)
		return {
			success: [],
			failure: users,
			sentMessage: {
				content,
			},
		}
	}
}

export async function updateBuilderRole(user: string, isBuilder: boolean) {
	try {
		await fetch(process.env.DISCORD_BOT_URL + `/api/v1/builder/${user}`, {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
				Authorization: `Bearer ${process.env.DISCORD_BOT_SECRET}`,
			},
			body: JSON.stringify({ add: isBuilder }),
		})
		return true
	} catch (e) {
		return false
	}
}

export async function getBuilderRole(user: string) {
	return fetch(process.env.DISCORD_BOT_URL + `/api/v1/builder/${user}`, {
		method: 'GET',
		headers: {
			'Content-type': 'application/json',
			Authorization: `Bearer ${process.env.DISCORD_BOT_SECRET}`,
		},
	})
		.then((res) => res.json())
		.catch((e) => {
			return { error: 'NOT_FOUND' }
		})
}

export async function isOnMainBTEServer(user: string) {
	const res = await getBuilderRole(user)
	if (res?.error == 'NOT_FOUND') {
		return false
	}
	return true
}
export async function getUserDiscordPunishments(user: string) {
	return fetch(process.env.DISCORD_BOT_URL + `/api/v1/punish/${user}`, {
		method: 'GET',
		headers: {
			'Content-type': 'application/json',
			Authorization: `Bearer ${process.env.DISCORD_BOT_SECRET}`,
		},
	}).then((res) => res.json())
}

export async function getUserRoles(user: string) {
	return fetch(process.env.DISCORD_BOT_URL + `/api/v1/role/${user}`, {
		method: 'GET',
		headers: {
			'Content-type': 'application/json',
			Authorization: `Bearer ${process.env.DISCORD_BOT_SECRET}`,
		},
	}).then((res) => res.json())
}
