import { MantineColor, MantineGradient } from '@mantine/core';

import { ApplicationStatus } from '@repo/db';
import { IconCheck, IconChecks, IconClock, IconX } from '@tabler/icons-react';

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
export function applicationStatusToIcon(status: ApplicationStatus) {
	switch (status) {
		case ApplicationStatus.SEND:
			return IconClock;
		case ApplicationStatus.TRIAL:
			return IconCheck;
		case ApplicationStatus.DECLINED:
			return IconX;
		case ApplicationStatus.ACCEPTED:
			return IconChecks;
		default:
			return IconClock;
	}
}
export function applicationStatusToTooltip(status: ApplicationStatus) {
	switch (status) {
		case ApplicationStatus.SEND:
			return 'The region has received your application and is reviewing it.';
		case ApplicationStatus.TRIAL:
			return 'You have been accepted to the region on a trial basis.';
		case ApplicationStatus.DECLINED:
			return 'Your application has been declined. Please check the reason for more information.';
		case ApplicationStatus.ACCEPTED:
			return 'You have been accepted to the region.';
		default:
			return 'Unknown status.';
	}
}
export function applicationStatusToAlert(status: ApplicationStatus): {
	icon: any;
	title: string;
	description: string;
	color: string;
} {
	switch (status) {
		case ApplicationStatus.SEND:
			return {
				icon: applicationStatusToIcon(status),
				title: 'Application pending review',
				description:
					'The Build Region has received your application and is reviewing it. As soon as a decision is made, you will be notified via a Direct Message on Discord. If you have any questions about the status of this application, please contact the Build Region directly.',
				color: applicationStatusToColor(status),
			};
		case ApplicationStatus.TRIAL:
			return {
				icon: applicationStatusToIcon(status),
				title: 'Trial Application accepted',
				description:
					'Congratulations! Your application has been accepted and you have been added to the Build Region as a Trial Member. If you have any questions about the Trial role or the status of this application, please contact the Build Region directly.',
				color: applicationStatusToColor(status),
			};
		case ApplicationStatus.DECLINED:
			return {
				icon: applicationStatusToIcon(status),
				title: 'Application declined',
				description:
					'This application has been declined by the Build Region. Please check the reason for more information about possible mistakes and how to improve your application. If you have any questions about this feedback, please contact the Build Region directly. You can reapply to this Build Region at any time.',
				color: applicationStatusToColor(status),
			};
		case ApplicationStatus.ACCEPTED:
			return {
				icon: applicationStatusToIcon(status),
				title: 'Application accepted',
				description:
					'Congratulations! Your application has been accepted by the Build Region. You are now a member of the Build Region. If you have any questions about your new role or the status of this application, please contact the Build Region directly.',
				color: applicationStatusToColor(status),
			};
		default:
			return {
				icon: applicationStatusToIcon(status),
				title: 'Unknown status',
				description: 'The status of this application is unknown. Please contact us for more information.',
				color: applicationStatusToColor(status),
			};
	}
}
