import { reviewActivityCheck } from './reviewActivityCheck'

export type CronJob = {
	name: string
	description: string
	handler: (job: CronJob, writeLog: (line: string) => void) => Promise<void> | void
}

export const CRON_JOBS: { [key: string]: CronJob } = {
	REVIEW_ACTIVITY_CHECK: {
		name: 'Review Activity Check',
		description: 'Checks if the review activity is up to date.',
		handler: reviewActivityCheck,
	},
}
