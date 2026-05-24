import { BaseTask } from './base.task';
import { SendDiscordDmTask } from './discord/sendDm.task';

export const taskRegistry: Record<string, BaseTask> = {};

function register(task: BaseTask) {
	taskRegistry[task.name] = task;
}

register(new SendDiscordDmTask());
