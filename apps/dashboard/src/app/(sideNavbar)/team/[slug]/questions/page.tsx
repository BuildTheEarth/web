import { saveBuildTeamApplicationQuestions } from '@/actions/buildTeams';
import { getUser } from '@/actions/getUser';
import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import prisma from '@/util/db';
import { Group, Title } from '@mantine/core';
import QuestionsEditor from './interactivity';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
	const user = await getUser();
	const slug = (await params).slug;

	const team = await prisma.buildTeam.findFirst({
		where: { slug },
		select: {
			id: true,
			slug: true,
			applicationQuestions: true,
			allowTrial: true,
		},
	});
	if (!team) throw Error('Could not find Build Team');

	return (
		<Protection requiredBuildTeam={{ permission: 'team.application.edit', slug }}>
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1} mt="xl" mb="md">
						Application Questions
					</Title>
				</Group>
				<QuestionsEditor
					teamId={team.id}
					userId={user.ssoId}
					buildTeamSlug={team.slug}
					initialQuestions={team.applicationQuestions}
					allowTrial={team.allowTrial}
					saveQuestionsAction={saveBuildTeamApplicationQuestions}
				/>
			</ContentWrapper>
		</Protection>
	);
}
