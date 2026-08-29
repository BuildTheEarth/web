import { PurgeClaimsTask } from './administrative/purgeClaims.task'
import { PurgeVerificationsTask } from './administrative/purgeVerifications.task'
import { RemindApplicationsTask } from './administrative/remindApplications.task'
import { ReviewActivityCheckTask } from './administrative/reviewActivityCheck.task'
import { BaseTask } from './base.task'
import { SendBuildTeamWebhookTask } from './buildteams/sendWebhook.task'
import { SyncClaimOsmTask } from './claims/syncClaimOsm.task'
import { SendDiscordDmTask } from './discord/sendDm.task'
import { SendDiscordLogTask } from './discord/sendLog.task'
import { SyncDiscordRolesTask } from './discord/syncDiscordRoles.task'
import { RevalidateWebsitePageTask } from './website/revalidatePage.task'

export type TaskConstructor = new () => BaseTask

export const taskRegistry: Record<string, TaskConstructor> = {}

function register(taskClass: TaskConstructor) {
	const instance = new taskClass()
	taskRegistry[instance.name] = taskClass
}

register(SendDiscordDmTask)
register(SendDiscordLogTask)
register(SendBuildTeamWebhookTask)
register(ReviewActivityCheckTask)
register(PurgeClaimsTask)
register(PurgeVerificationsTask)
register(RemindApplicationsTask)
register(SyncClaimOsmTask)
register(SyncDiscordRolesTask)
register(RevalidateWebsitePageTask)
