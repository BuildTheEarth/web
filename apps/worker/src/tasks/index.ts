import { ReviewActivityCheckTask } from './administrative/reviewActivityCheck.task';
import { BaseTask } from './base.task';
import { AuditLogBtTask } from './buildteams/auditLogBt.task';
import { SendDiscordDmTask } from './discord/sendDm.task';

export const taskRegistry: Record<string, BaseTask> = {};

function register(task: BaseTask) {
	taskRegistry[task.name] = task;
}

register(new SendDiscordDmTask());
register(new ReviewActivityCheckTask());
register(new AuditLogBtTask());
