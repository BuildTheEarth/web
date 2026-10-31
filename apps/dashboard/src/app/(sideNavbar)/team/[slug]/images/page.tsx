import ContentWrapper from '@/components/core/ContentWrapper'
import { Protection } from '@/components/Protection'
import prisma from '@/util/db'
import { Group, Title } from '@mantine/core'
import { Metadata } from 'next'
import ShowcasesDatatable from './datatable'
import { UploadShowcaseButton } from './interactivity'

export const metadata: Metadata = {
	title: 'Showcase Images',
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
	const slug = (await params).slug

	const showcases = await prisma.showcase.findMany({
		where: { buildTeam: { slug } },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			title: true,
			city: true,
			approved: true,
			createdAt: true,
			image: { select: { src: true, width: true, height: true } },
		},
	})

	return (
		<Protection requiredBuildTeam={{ permission: 'team.showcases.edit', slug }}>
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1} mt="xl" mb="md">
						Showcase Images
					</Title>
					<UploadShowcaseButton slug={slug} />
				</Group>
				<ShowcasesDatatable
					slug={slug}
					showcases={showcases.map((s) => ({
						id: s.id,
						title: s.title,
						city: s.city,
						approved: s.approved,
						createdAt: s.createdAt.toISOString(),
						src: s.image.src,
						width: s.image.width,
						height: s.image.height,
					}))}
				/>
			</ContentWrapper>
		</Protection>
	)
}
