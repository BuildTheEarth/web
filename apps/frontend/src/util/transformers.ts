import { MantineColor, MantineGradient } from '@mantine/core';

import { ApplicationStatus } from '@repo/db';

export function applicationStatusToColor(status: ApplicationStatus): MantineColor {
	switch (status) {
		case ApplicationStatus.SEND:
			return 'orange';
		case ApplicationStatus.TRIAL:
			return 'cyan';
		case ApplicationStatus.DECLINED:
			return 'red';
		case ApplicationStatus.ACCEPTED:
			return 'green';
		default:
			return 'gray';
	}
}
export function applicationStatusToGradient(status: ApplicationStatus): MantineGradient {
	switch (status) {
		case ApplicationStatus.SEND:
			return { from: 'indigo.9', to: 'indigo.6' };
		case ApplicationStatus.TRIAL:
			return { from: 'teal', to: 'green.7' };
		case ApplicationStatus.DECLINED:
			return { from: 'red', to: 'orange' };
		case ApplicationStatus.ACCEPTED:
			return { from: 'green', to: 'lime' };
		default:
			return { from: 'gray', to: 'gray' };
	}
}
