import { Skeleton, Title } from '@mantine/core'

import ContentWrapper from '@/components/core/ContentWrapper'

export default function Page() {
	return (
		<ContentWrapper maw="90vw">
			<Skeleton w="fit-content" ml="sm">
				<Title order={1} mt="xl" mb="md" display="flex">
					Claim XXXXXXXX
				</Title>
			</Skeleton>
		</ContentWrapper>
	)
}
