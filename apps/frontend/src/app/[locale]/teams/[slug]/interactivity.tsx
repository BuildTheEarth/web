'use client';
import Anchor from '@/components/core/Anchor';
import {
	Alert,
	AspectRatio,
	Box,
	Button,
	Code,
	Group,
	Kbd,
	List,
	ListItem,
	SimpleGrid,
	Stepper,
	StepperCompleted,
	StepperStep,
	Text,
	Title,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function JoinServerGuide(props: { ip: string; version: string; name: string; slug: string }) {
	const t = useTranslations('teams.ownPage.joinServer');

	const tags = {
		...props,
		i: (c: string) => <i>{c}</i>,
		b: (c: string) => <b>{c}</b>,
		code: (c: string) => (
			<Code fz="sm" color="dark.7">
				{c}
			</Code>
		),
		launcherButton: (c: string) => (
			<Code color="green.9" style={{ border: '1px solid var(--mantine-color-dark-3)' }} fz="sm" fw="700">
				{c}
			</Code>
		),
		button: (c: string) => (
			<Code color="dark.7" style={{ border: '1px solid var(--mantine-color-dark-3)' }} fz="sm" fw="700">
				{c}
			</Code>
		),
		link: (c: string) => (
			<Anchor href="http://docs.buildtheearth.net/joining-build-teams-othkh12RGf#h-change-your-game-version" fz="sm">
				{c}
			</Anchor>
		),
		kbd: (c: string) => <Kbd>{c}</Kbd>,
	};

	return (
		<Box
			style={{
				backgroundColor: 'var(--mantine-color-dark-6)',
				borderRadius: 0,
				boxShadow: 'var(--mantine-shadow-block)',
			}}
			p="lg"
			mt="calc(var(--mantine-spacing-xl) * 2)"
		>
			<SimpleGrid cols={2}>
				<Box h="100%" w="100%" mx="auto">
					<Title order={3} mb="xl">
						{t('step1.0')}
					</Title>
					<List>
						<ListItem>{t.rich('step1.1', tags)}</ListItem>
						<ListItem>{t.rich('step1.2', tags)}</ListItem>
						<ListItem>{t.rich('step1.3', tags)}</ListItem>
						<ListItem>{t.rich('step1.4', tags)}</ListItem>
					</List>
					<Alert variant="light" color="green" mt="md" maw="80%">
						{t.rich('tip', tags)}
					</Alert>
				</Box>
				<Box h="100%" w="100%" mx="auto">
					<Title order={3} mb="xl">
						{t('step2.0')}
					</Title>
					<List>
						<ListItem>{t.rich('step2.1', tags)}</ListItem>
						<ListItem>
							{t.rich('step2.2', { ...tags, name: props.ip == 'buildtheearth.net' ? 'BuildTheEarth Hub' : props.name })}
						</ListItem>
						<ListItem>{t.rich('step2.3', tags)}</ListItem>
						<ListItem>{t.rich('step2.4', tags)}</ListItem>
						{props.ip == 'buildtheearth.net' && <ListItem>{t.rich('step2.5', tags)}</ListItem>}
					</List>
					<Text mt="sm">{t.rich('done', tags)}</Text>
				</Box>
			</SimpleGrid>
		</Box>
	);
}
