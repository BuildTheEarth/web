import { Badge, BadgeProps, rem } from '@mantine/core'

import { IconConfetti } from '@tabler/icons-react'

export default function StatusBadge({ status, ...props }: { status: string } & BadgeProps) {
	switch (status.toLowerCase()) {
		// Application Status
		case 'send':
			return (
				<Badge variant="gradient" gradient={{ from: 'orange', to: 'yellow' }} {...props}>
					Needs Review
				</Badge>
			)
		case 'accepted':
			return (
				<Badge variant="gradient" gradient={{ from: 'green', to: 'lime' }} {...props}>
					Accepted
				</Badge>
			)
		case 'trial':
			return (
				<Badge variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} {...props}>
					Trial
				</Badge>
			)
		case 'accepted':
			return (
				<Badge variant="gradient" gradient={{ from: 'green', to: 'lime' }} {...props}>
					Accepted
				</Badge>
			)
		case 'declined':
			return (
				<Badge variant="gradient" gradient={{ from: 'red', to: 'orange' }} {...props}>
					Rejected
				</Badge>
			)

		// Claim Status
		case 'building':
			return (
				<Badge variant="gradient" gradient={{ from: 'orange', to: 'yellow' }} {...props}>
					Under Construction
				</Badge>
			)
		case 'finished':
			return (
				<Badge
					variant="gradient"
					gradient={{ from: 'green', to: 'lime' }}
					leftSection={<IconConfetti style={{ width: rem(12), height: rem(12) }} />}
					{...props}
				>
					Finished
				</Badge>
			)

		// Generic Status
		case 'active':
			return (
				<Badge variant="gradient" gradient={{ from: 'green', to: 'lime' }} {...props}>
					Active
				</Badge>
			)
		case 'inactive':
			return (
				<Badge variant="gradient" gradient={{ from: 'red', to: 'orange' }} {...props}>
					Inactive
				</Badge>
			)
		case 'on':
			return (
				<Badge variant="gradient" gradient={{ from: 'green', to: 'lime' }} {...props}>
					On
				</Badge>
			)
		case 'off':
			return (
				<Badge variant="gradient" gradient={{ from: 'red', to: 'orange' }} {...props}>
					Off
				</Badge>
			)
	}
}
