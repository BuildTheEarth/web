import ContentWrapper from '@/components/core/ContentWrapper'
import { Skeleton } from '@mantine/core'

export default function Loading() {
	return (
		<ContentWrapper maw="90vw">
			<Skeleton h={40} w={300} mt="xl" mb="md" />
			<Skeleton h={400} />
		</ContentWrapper>
	)
}
