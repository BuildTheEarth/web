import { CronJob } from '.';
import { getReviewActivityScore } from '../application/reviewActivity';
import { toHumanDate, toHumanDateTime } from '../date';
import prisma from '../db';

const CHUNK_SIZE = 9;

export async function reviewActivityCheck(job: CronJob, writeLog: (line: string) => void) {
	writeLog(`Starting job: ${job.name}`);

	const pastData = await fetchPastData(writeLog);
	const buildTeams = await fetchBuildTeams(writeLog);

	const newData = await calculateReviewActivityScores(buildTeams, pastData, writeLog);

	await saveDataToDB(newData, writeLog);
	await sendDiscordMessages(newData, buildTeams, writeLog);

	writeLog(`"${job.name}" is finished.`);
}

async function fetchPastData(writeLog: (line: string) => void) {
	writeLog('Fetching past data from DB...');
	const pastData = ((await prisma.jsonStore.findFirst({ where: { id: 'pastReviewActivity' } }))?.data || {
		date: new Date(),
		current: [],
		compared: [],
	}) as {
		date: Date;
		current: { id: string; art: number; par: number; ps: number; res: number; ras: number }[];
		compared: { id: string; art: number; par: number; ps: number; res: number; ras: number }[];
	};
	writeLog(`Found data from ${toHumanDateTime(pastData.date)} with ${pastData.current.length} build teams.`);
	return pastData;
}

async function fetchBuildTeams(writeLog: (line: string) => void) {
	writeLog('Fetching build regions...');
	return prisma.buildTeam.findMany({
		select: { id: true, name: true },
		where: { allowApplications: true },
	});
}

async function calculateReviewActivityScores(
	buildTeams: { id: string; name: string }[],
	pastData: any,
	writeLog: (line: string) => void,
) {
	const newData = {
		date: new Date(),
		current: [] as { id: string; art: number; par: number; ps: number; res: number; ras: number }[],
		compared: [] as { id: string; art: number; par: number; ps: number; res: number; ras: number }[],
	};

	const reviewActivities = await Promise.all(
		buildTeams.map(async (buildTeam, i) => {
			writeLog(`Calculating review activity score for build region ${buildTeam.id} (${i + 1}/${buildTeams.length})...`);
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

async function saveDataToDB(newData: any, writeLog: (line: string) => void) {
	writeLog('Saving data to DB...');
	try {
		await prisma.jsonStore.upsert({
			where: { id: 'pastReviewActivity' },
			update: { data: newData },
			create: { id: 'pastReviewActivity', data: newData },
		});
		writeLog('Data saved.');
	} catch (error) {
		writeLog(`Failed to save data to DB: ${(error as Error).message}`);
	}
}

async function sendDiscordMessages(
	newData: any,
	buildTeams: { id: string; name: string }[],
	writeLog: (line: string) => void,
) {
	writeLog('Sending data to Discord...');
	const filteredData = filterSignificantChanges(newData.compared, newData.current);

	if (filteredData.length > 0) {
		await sendChunkedMessages(filteredData, buildTeams, writeLog);
	} else {
		await sendNoChangesMessage(writeLog);
	}

	await sendSummaryMessage(newData, buildTeams, writeLog);
	writeLog('Data sent.');
}

function filterSignificantChanges(comparedData: any[], currentData: any[]) {
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

async function sendChunkedMessages(
	filteredData: any[],
	buildTeams: { id: string; name: string }[],
	writeLog: (line: string) => void,
) {
	const messages = [];
	for (let i = 0; i < filteredData.length; i += CHUNK_SIZE) {
		const chunk = filteredData.slice(i, i + CHUNK_SIZE);
		messages.push({
			embeds: chunk.map((team) => scoreToEmbed(buildTeams.find((t) => t.id === team.id)?.name || team.id, team)),
			attachments: [],
			components: [],
		});
	}

	for (const message of messages) {
		try {
			const res = await sendDiscordMessage(message);
			writeLog(`Message sent to Discord: ${res.statusText}`);
		} catch (err) {
			writeLog(`Failed to send message to Discord: ${err}`);
		}
	}
}

async function sendNoChangesMessage(writeLog: (line: string) => void) {
	try {
		const res = await sendDiscordMessage({
			content: 'No significant changes in review activity score.',
			author: 'Daily Review Activity Score Changes',
		});
		writeLog(`Message sent to Discord: ${res.statusText}`);
	} catch (err) {
		writeLog(`Failed to send message to Discord: ${err}`);
	}
}

async function sendSummaryMessage(
	newData: any,
	buildTeams: { id: string; name: string }[],
	writeLog: (line: string) => void,
) {
	const summaryMessage = {
		embeds: [
			{
				title: `Summary - ${toHumanDate(new Date())}`,
				color: 0x00ff00,
				fields: [
					{
						name: 'Bad Scores',
						value: formatScores(newData.current, buildTeams, (ras) => ras < 2),
						inline: true,
					},
					{
						name: 'Medium Scores',
						value: formatScores(newData.current, buildTeams, (ras) => ras >= 2 && ras < 3.75),
						inline: true,
					},
				],
				timestamp: new Date().toISOString(),
			},
		],
		attachments: [],
		components: [],
	};

	try {
		const res = await sendDiscordMessage(summaryMessage);
		writeLog(`Summary message sent to Discord: ${res.statusText}`);
	} catch (err) {
		writeLog(`Failed to send summary message to Discord: ${err}`);
	}
}

function formatScores(
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

async function sendDiscordMessage(message: any) {
	return fetch(process.env.REPORTS_WEBHOOK || '', {
		body: JSON.stringify(message),
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': 'Build Region Dashboard',
		},
		method: 'POST',
	});
}

function getColorForRas(ras: number): number {
	if (ras < 2) return 0xff0000; // Red
	if (ras < 3.75) return 0xffa500; // Orange
	return 0x00ff00; // Green
}

function scoreToEmbed(
	teamName: string,
	scores: { art: number; par: number; ps: number; res: number; ras: number },
): { title: string; color: number; fields: { name: string; value: string; inline: true }[] } {
	return {
		title: `Review Activity Score for ${teamName}`,
		color: getColorForRas(scores.ras),
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
