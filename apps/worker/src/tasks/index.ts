import { PurgeClaimsTask } from './administrative/purgeClaims.task';
import { PurgeVerificationsTask } from './administrative/purgeVerifications.task';
import { RemindApplicationsTask } from './administrative/remindApplications.task';
import { ReviewActivityCheckTask } from './administrative/reviewActivityCheck.task';
import { BaseTask } from './base.task';
import { SendBuildTeamWebhookTask } from './buildteams/sendWebhook.task';
import { SendDiscordDmTask } from './discord/sendDm.task';
import { SendDiscordLogTask } from './discord/sendLog.task';

export const taskRegistry: Record<string, BaseTask> = {};

function register(task: BaseTask) {
	taskRegistry[task.name] = task;
}

register(new SendDiscordDmTask());
register(new SendDiscordLogTask());
register(new SendBuildTeamWebhookTask());
register(new ReviewActivityCheckTask());
register(new PurgeClaimsTask());
register(new PurgeVerificationsTask());
register(new RemindApplicationsTask());
