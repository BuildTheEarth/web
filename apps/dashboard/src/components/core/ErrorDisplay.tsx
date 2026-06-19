'use client'

import { ActionIcon, Box, Button, Text, Title } from '@mantine/core'

import { useDisclosure } from '@mantine/hooks'
import { IconChevronDown } from '@tabler/icons-react'
import { usePathname, useRouter } from 'next/navigation'

export default function ErrorDisplay({
	title = 'Something is not right...',
	message = 'The Page you are trying to open does not exist. You may have mistyped the address, or the page has been moved to another URL. If you think this is an error please contact us.',
	showBackButton = true,
}: {
	title?: string
	message?: string
	showBackButton?: boolean
}) {
	const [opened, { toggle }] = useDisclosure(false)
	const pathname = usePathname()
	const router = useRouter()

	return (
		<Box mx="md" maw="90vw">
			<Title order={1} mt="xl" mb="md">
				{title}
			</Title>
			<Text c="dimmed" size="md" maw="40%">
				{message}{' '}
				<ActionIcon size="xs" variant="transparent" color="gray" pt="xs" onClick={toggle}>
					<IconChevronDown size={16} />
				</ActionIcon>
			</Text>
			{opened && (
				<Text c="dimmed" size="sm" maw="40%" mt="md">
					Page: {pathname}
				</Text>
			)}
			{showBackButton && (
				<Button variant="outline" size="sm" mt="lg" onClick={() => router.back()}>
					Go Back
				</Button>
			)}
		</Box>
	)
}
