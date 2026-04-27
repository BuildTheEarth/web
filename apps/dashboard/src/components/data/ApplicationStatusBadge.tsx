/*
{a.status == 'SEND' ? (
												<Badge variant="gradient" gradient={{ from: 'orange', to: 'yellow' }}>
													Needs Review
												</Badge>
											) : a.status == 'ACCEPTED' ? (
												<Badge variant="gradient" gradient={{ from: 'green', to: 'lime' }}>
													Accepted
												</Badge>
											) : a.status == 'TRIAL' ? (
												<Badge variant="gradient" gradient={{ from: 'green', to: 'lime' }}>
													Trial
												</Badge>
											) : (
												<Badge variant="gradient" gradient={{ from: 'red', to: 'orange' }}>
													Rejected
												</Badge>
											)}*/

import { Badge, BadgeProps } from '@mantine/core';

import { applicationStatusToGradient } from '@/util/transformers';

type ApplicationStatus = 'SEND' | 'REVIEWING' | 'TRIAL' | 'DECLINED' | 'ACCEPTED';

const APPLICATION_STATUS = {
	SEND: 'SEND',
	REVIEWING: 'REVIEWING',
	TRIAL: 'TRIAL',
	DECLINED: 'DECLINED',
	ACCEPTED: 'ACCEPTED',
} as const;

export function ApplicationStatusBadge({ status, ...props }: { status: ApplicationStatus } & BadgeProps) {
	let text = '';

	switch (status) {
		case APPLICATION_STATUS.SEND:
			text = 'Needs Review';
			break;
		case APPLICATION_STATUS.REVIEWING:
			text = 'Reviewing';
			break;
		case APPLICATION_STATUS.TRIAL:
			text = 'Trial';
			break;
		case APPLICATION_STATUS.DECLINED:
			text = 'Rejected';
			break;
		case APPLICATION_STATUS.ACCEPTED:
			text = 'Accepted';
			break;
		default:
			text = 'Unknown';
	}

	return (
		<Badge {...props} variant="gradient" gradient={applicationStatusToGradient(status)}>
			{text}
		</Badge>
	);
}
