import { MantineColor, MantineGradient } from '@mantine/core';

import { IconCheck, IconChecks, IconClock, IconX } from '@tabler/icons-react';

type ApplicationStatus = 'SEND' | 'REVIEWING' | 'TRIAL' | 'DECLINED' | 'ACCEPTED';

const APPLICATION_STATUS = {
	SEND: 'SEND',
	REVIEWING: 'REVIEWING',
	TRIAL: 'TRIAL',
	DECLINED: 'DECLINED',
	ACCEPTED: 'ACCEPTED',
} as const;

export function applicationStatusToColor(status: ApplicationStatus): MantineColor {
	switch (status) {
		case APPLICATION_STATUS.SEND:
			return 'orange';
		case APPLICATION_STATUS.REVIEWING:
			return 'yellow';
		case APPLICATION_STATUS.TRIAL:
			return 'cyan';
		case APPLICATION_STATUS.DECLINED:
			return 'red';
		case APPLICATION_STATUS.ACCEPTED:
			return 'green';
		default:
			return 'gray';
	}
}
export function applicationStatusToGradient(status: ApplicationStatus): MantineGradient {
	switch (status) {
		case APPLICATION_STATUS.SEND:
			return { from: 'indigo.9', to: 'indigo.6' };
		case APPLICATION_STATUS.REVIEWING:
			return { from: 'yellow.8', to: 'orange.6' };
		case APPLICATION_STATUS.TRIAL:
			return { from: 'teal', to: 'green.7' };
		case APPLICATION_STATUS.DECLINED:
			return { from: 'red', to: 'orange' };
		case APPLICATION_STATUS.ACCEPTED:
			return { from: 'green', to: 'lime' };
		default:
			return { from: 'gray', to: 'gray' };
	}
}
export function applicationStatusToIcon(status: ApplicationStatus) {
	switch (status) {
		case APPLICATION_STATUS.SEND:
			return IconClock;
		case APPLICATION_STATUS.REVIEWING:
			return IconClock;
		case APPLICATION_STATUS.TRIAL:
			return IconCheck;
		case APPLICATION_STATUS.DECLINED:
			return IconX;
		case APPLICATION_STATUS.ACCEPTED:
			return IconChecks;
		default:
			return IconClock;
	}
}
export function applicationStatusToTooltip(status: ApplicationStatus) {
	switch (status) {
		case APPLICATION_STATUS.SEND:
			return 'The Team has received your application and is reviewing it.';
		case APPLICATION_STATUS.REVIEWING:
			return 'Your application is currently being reviewed by the team.';
		case APPLICATION_STATUS.TRIAL:
			return 'You have been accepted to the Team on a trial basis.';
		case APPLICATION_STATUS.DECLINED:
			return 'Your application has been declined. Please check the reason for more information.';
		case APPLICATION_STATUS.ACCEPTED:
			return 'You have been accepted to the Team.';
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
		case APPLICATION_STATUS.SEND:
			return {
				icon: applicationStatusToIcon(status),
				title: 'Application pending review',
				description:
					'The Build Team has received your application and is reviewing it. As soon as a decision is made, you will be notified via a Direct Message on Discord. If you have any questions about the status of this application, please contact the Build Team directly.',
				color: applicationStatusToColor(status),
			};
		case APPLICATION_STATUS.TRIAL:
			return {
				icon: applicationStatusToIcon(status),
				title: 'Trial Application accepted',
				description:
					'Congratulations! Your application has been accepted and you have been added to the Build Team as a Trial Member. If you have any questions about the Trial role or the status of this application, please contact the Build Team directly.',
				color: applicationStatusToColor(status),
			};
		case APPLICATION_STATUS.REVIEWING:
			return {
				icon: applicationStatusToIcon(status),
				title: 'Application under review',
				description:
					'Your application is currently being reviewed by the Build Team. You will be notified once a decision is made.',
				color: applicationStatusToColor(status),
			};

		case APPLICATION_STATUS.DECLINED:
			return {
				icon: applicationStatusToIcon(status),
				title: 'Application declined',
				description:
					'This application has been declined by the Build Team. Please check the reason for more information about possible mistakes and how to improve your application. If you have any questions about this feedback, please contact the Build Team directly. You can reapply to this Build Team at any time.',
				color: applicationStatusToColor(status),
			};
		case APPLICATION_STATUS.ACCEPTED:
			return {
				icon: applicationStatusToIcon(status),
				title: 'Application accepted',
				description:
					'Congratulations! Your application has been accepted by the Build Team. You are now a member of the Build Team. If you have any questions about your new role or the status of this application, please contact the Build Team directly.',
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
