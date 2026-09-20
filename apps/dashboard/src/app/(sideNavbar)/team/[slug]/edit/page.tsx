import { getUser } from '@/actions/getUser'
import ContentWrapper from '@/components/core/ContentWrapper'
import { Protection } from '@/components/Protection'
import prisma from '@/util/db'
import { Divider } from '@mantine/core'
import { Metadata } from 'next'
import { EditTeamForm, GenerateTokenButton, SocialLinksEditor } from './interactivity'

export const metadata: Metadata = {
	title: 'Edit Build Team',
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
	const user = await getUser()
	const slug = (await params).slug

	const team = await prisma.buildTeam.findFirst({
		where: { slug },
		include: {
			creator: { select: { id: true, username: true, ssoId: true } },
			socials: true,
			responseTemplate: { select: { id: true, name: true, content: true } },
			UserPermission: {
				select: {
					id: true,
					permission: { select: { defaultValue: true, global: true, id: true } },
					user: { select: { id: true, username: true, ssoId: true } },
				},
			},
			_count: {
				select: {
					claims: true,
					members: true,
					showcases: true,
					Application: true,
				},
			},
		},
	})
	if (!team) throw Error('Could not find Build Team')

	return (
		<Protection requiredBuildTeam={{ permission: 'team.settings.edit', slug }}>
			<ContentWrapper maw="90vw">
				<EditTeamForm team={team} />
				<GenerateTokenButton teamId={team.id} />
				<Divider my="xl" />
				<SocialLinksEditor teamId={team.id} userId={user.id} socials={team.socials} />
			</ContentWrapper>
		</Protection>
	)
}
