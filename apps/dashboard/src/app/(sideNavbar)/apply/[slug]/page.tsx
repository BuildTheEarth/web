import {
	Accordion,
	AccordionControl,
	AccordionItem,
	AccordionPanel,
	Alert,
	Badge,
	Box,
	Divider,
	Group,
	Text,
	Title,
} from '@mantine/core';

import { applyToBuildTeam } from '@/actions/buildTeams';
import { ApplyForm } from '@/app/(sideNavbar)/apply/[slug]/interactivity';
import Anchor from '@/components/core/Anchor';
import { TextCard } from '@/components/core/card/TextCard';
import ContentWrapper from '@/components/core/ContentWrapper';
import ErrorDisplay from '@/components/core/ErrorDisplay';
import { Greeting } from '@/components/data/Greeting';
import { getSession } from '@/util/auth';
import { getCountryNames } from '@/util/countries';
import { toHumanDate } from '@/util/date';
import prisma from '@/util/db';
import { ApplicationStatus } from '@repo/db';
import { IconArrowForward, IconCheck, IconClock, IconConfetti, IconX } from '@tabler/icons-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Apply to Build Team',
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
	const session = await getSession();
	const slug = (await params).slug;
	const joiningBuildTeam = await prisma.buildTeam.findUnique({
		where: {
			slug,
		},
		select: {
			id: true,
			slug: true,
			name: true,
			location: true,
			invite: true,
			color: true,
			allowApplications: true,
			applicationQuestions: {
				where: { sort: { gt: 0 } },
			},
		},
	});
	const user = await prisma.user.findUnique({
		where: {
			ssoId: session?.user.id,
		},
		include: {
			_count: {
				select: {
					joinedBuildTeams: true,
					createdBuildTeams: true,
				},
			},
			applications: {
				where: { buildteam: { slug } },
				select: { id: true, status: true, createdAt: true, reviewedAt: true },
				orderBy: { createdAt: 'desc' },
			},
		},
	});

	const isNewbie = true || (user?._count.joinedBuildTeams === 0 && user?._count.createdBuildTeams === 0);

	if (!joiningBuildTeam) {
		return (
			<ErrorDisplay
				title="We couldn't find that Build Team"
				message="The Build Team you want to apply to does not seem to exist. Are you sure the address is correct? If you think this is an error, please contact us."
			/>
		);
	}

	if (!user) {
		throw Error('User not found');
	}

	const applyToBuildTeamBinded = applyToBuildTeam.bind(null, { userId: session?.user.id || '', buildTeamSlug: slug });

	if (user?.applications.length > 0) {
		const latestApplication = user.applications[0];
		if (latestApplication.status === ApplicationStatus.ACCEPTED) {
			return (
				<ContentWrapper maw="90vw">
					<Title order={1} mt="xl">
						Congratulations, {session?.user.given_name || session?.user.username}!
					</Title>
					<Text mb="md" c="dimmed">
						It looks like you want to apply to {joiningBuildTeam?.name}.
					</Text>
					<Box maw={{ base: '100%', sm: '85%', md: '60%', xl: '45%' }} mt="md">
						<Alert
							variant="light"
							color="green"
							radius="md"
							title="Application accepted"
							icon={<IconConfetti size={16} />}
						>
							Your application to {joiningBuildTeam?.name} was accepted on{' '}
							{latestApplication.reviewedAt ? toHumanDate(latestApplication.reviewedAt) : 'unknown date'}!
						</Alert>

						<Text mt="md">
							If you haven&apos;t already, please make sure to join {joiningBuildTeam?.name}&apos;s{' '}
							<Anchor href={joiningBuildTeam.invite} target="_blank">
								Discord server
							</Anchor>{' '}
							to get in touch with the community. Please also check your Discord DMs, you have received a message from
							our <b>bot</b> with an message from {joiningBuildTeam?.name} and next steps to get started.
						</Text>
						<Text mt="md">
							Thank you for your interest in building with {joiningBuildTeam?.name}, and we can&apos;t wait to see what
							you will build!
						</Text>
						<Divider mt="xl" />
						<Text mt="md" c="dimmed" fz="xs">
							If you have any issues or did not receive a DM, please let us know as soon as possible. The application
							decision was made by {joiningBuildTeam.name}. Any questions regarding the decision should be directed
							towards the Build Team.
						</Text>
					</Box>
				</ContentWrapper>
			);
		}
	}

	return (
		<ContentWrapper maw="90vw">
			<Title order={1} mt="xl">
				<Greeting username={session?.user.given_name || session?.user.username} />
			</Title>
			<Text mb="md" c="dimmed">
				It looks like you want to apply to {joiningBuildTeam?.name}.
			</Text>

			<Box maw={{ base: '100%', sm: '85%', md: '60%', xl: '45%' }} mt="md">
				{user.applications.length > 0 && user.applications[0].status === ApplicationStatus.DECLINED && (
					<Alert
						variant="light"
						color="orange"
						radius="md"
						title="Application rejected"
						mb="md"
						icon={<IconArrowForward size={16} />}
					>
						Your application to {joiningBuildTeam?.name} was rejected on{' '}
						{user.applications[0].reviewedAt ? toHumanDate(user.applications[0].reviewedAt) : 'unknown date'}.
						Don&apos;t worry though! You should have received feedback from the Build Team in your Discord DMs. Please
						check them out to see how you can improve and re-apply below.
					</Alert>
				)}
				{user.applications.length > 0 && user.applications[0].status === ApplicationStatus.SEND && (
					<Alert
						variant="light"
						color="yellow"
						radius="md"
						title="Application pending"
						mb="md"
						icon={<IconClock size={16} />}
					>
						Your application to {joiningBuildTeam?.name} is still pending. The Build Team will review it as soon as
						possible and get back to you. This process can usually take up to 48 hours, but it can sometimes take a bit
						longer. You will receive a notification on discord once the status changes.
					</Alert>
				)}
				<Text>
					You will find everything you need to get started building with <b>{joiningBuildTeam?.name}</b> in the next
					steps. We will ask you a few questions about your experience and what you want to build, and then we will
					review your application and get back to you as soon as possible.
				</Text>

				<Title order={2} mt="xl" mb="md">
					Before you start
				</Title>
				{isNewbie ? (
					<Text>
						BuildTheEarth can seem a bit overwhelming at first, but don&apos;t worry! As this is your first time
						applying to a build team, we recommend joining our global{' '}
						<Anchor href="https://go.buildtheearth.net/dc" target="_blank">
							Discord server
						</Anchor>{' '}
						and the local Discord server for {joiningBuildTeam?.name} (
						<Anchor href={joiningBuildTeam?.invite} target="_blank">
							here
						</Anchor>
						). There you can ask any questions you have, get to know the community, and find resources to help you get
						started.
					</Text>
				) : (
					<Text>
						As you are already part of the BuildTheEarth community, you probably know the drill. Please make sure to
						join the local Discord server for {joiningBuildTeam?.name} (
						<Anchor href={joiningBuildTeam?.invite} target="_blank">
							here
						</Anchor>
						) if you haven&apos;t already.
					</Text>
				)}

				<Title order={2} mt="xl" mb="md">
					Region selection
				</Title>
				{isNewbie ? (
					<Text mb="md">
						To make sure you are applying to the correct Build Team, please make sure to check the list of countries of{' '}
						{joiningBuildTeam?.name} below.
					</Text>
				) : (
					<Text mb="md">
						Please cross-check the list of countries of {joiningBuildTeam?.name} below to make sure you are applying to
						the correct Build Team.
					</Text>
				)}
				<TextCard title={`${joiningBuildTeam.name} is building in...`}>
					<Group gap="xs">
						{getCountryNames(joiningBuildTeam.location.split(', ')).map((country) => (
							<Badge variant="light" color={joiningBuildTeam.color} size="lg" radius="sm" key={country}>
								{country}
							</Badge>
						))}
					</Group>
				</TextCard>
				<Accordion variant="separated" order={3} mt="md">
					<AccordionItem value="countriesCorrect">
						<AccordionControl icon={<IconCheck size={22} color="var(--mantine-color-green-7)" />}>
							My country is listed above
						</AccordionControl>
						<AccordionPanel>
							<Text>
								Great! Please continue with the application form below. Note that when your application gets accepted,
								you will also be able to build in the other counties listed above.
							</Text>
						</AccordionPanel>
					</AccordionItem>
					<AccordionItem value="countriesNotCorrect">
						<AccordionControl icon={<IconX size={22} color="var(--mantine-color-red-7)" />}>
							My country is <b>not</b> listed above
						</AccordionControl>
						<AccordionPanel>
							<Text>
								Oh no! It looks like {joiningBuildTeam?.name} is not building in your country. You can either apply to a
								different Build Team that is building in your country, or you can still apply to{' '}
								{joiningBuildTeam?.name} and build in one of the listed countries if you would like.
								<br />
								You can search for other Build Teams that are building in your country on our{' '}
								<Anchor href="https://buildtheearth.net/teams" target="_blank">
									Website
								</Anchor>
								.
							</Text>
							<Text mb="md" fz="xs" mt="md" c="dimmed">
								If you know what you are doing, you can still proceed with the application.
							</Text>
						</AccordionPanel>
					</AccordionItem>
				</Accordion>

				<Title order={2} mt="xl" mb="md">
					Application form
				</Title>
				<Text mb="md">
					Please fill out the form below and send it our way. The Build Team will review your application and get back
					to you as soon as possible. Usually this process can take up to 48 hours, but it can sometimes take a bit
					longer.
				</Text>
				{!joiningBuildTeam.allowApplications && (
					<Alert
						variant="light"
						color="yellow"
						radius="md"
						title="Applications are currently disabled for this Build Team"
						icon={<IconClock size={16} />}
					>
						Unfortunately, {joiningBuildTeam.name} is not accepting new applications using this form at the moment. This
						can be due to various reasons, such as the Build Team using a different system or it going through a
						transition. Please check back later or contact the Build Team for more information.
					</Alert>
				)}

				<ApplyForm
					applyAction={applyToBuildTeamBinded}
					questions={joiningBuildTeam.applicationQuestions.sort((a, b) => a.sort - b.sort)}
					allowApplications={
						joiningBuildTeam.allowApplications! && user.applications[0]?.status !== ApplicationStatus.SEND
					}
				/>
			</Box>
		</ContentWrapper>
	);
}
