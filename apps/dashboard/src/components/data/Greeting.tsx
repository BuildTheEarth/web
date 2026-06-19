'use client'

export function Greeting({ username }: { username?: string }) {
	let greeting = 'Hello'
	const hours = new Date().getHours()

	if (hours < 12) {
		greeting = 'Good Morning'
	} else if (hours < 18) {
		greeting = 'Good Afternoon'
	} else {
		greeting = 'Good Evening'
	}

	return username ? `${greeting}, ${username}!` : `${greeting}!`
}
