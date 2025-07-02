'use client';
import { toHumanDate } from '@/util/date';
import {
	ActionIcon,
	AppShellNavbar,
	AppShellSection,
	Card,
	Image,
	rem,
	ScrollArea,
	Text,
	TextInput,
} from '@mantine/core';
import { Claim } from '@repo/db';
import { IconSearch, IconX } from '@tabler/icons-react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { NewClaimButton } from './editor/interactivity';
import { useClaimEditorStore } from './editor/store';

export default function EditorNavbar({ claims }: { claims: (Claim & { imgSrc?: string })[] }) {
	const [searchValue, setSearchValue] = useState('');
	const editorStore = useClaimEditorStore();

	return (
		<AppShellNavbar p="md">
			<AppShellSection>
				<Text fw="bold" fz="xl">
					Your Claims
				</Text>
				<TextInput
					mt="md"
					placeholder="Search..."
					rightSection={
						searchValue ? (
							<ActionIcon size="md" variant="subtle" onClick={() => setSearchValue('')}>
								<IconX style={{ width: rem(18), height: rem(18) }} stroke={2} />
							</ActionIcon>
						) : (
							<IconSearch style={{ width: rem(16), height: rem(16) }} />
						)
					}
					value={searchValue}
					onChange={(event) => setSearchValue(event.currentTarget.value.toLowerCase())}
				/>
			</AppShellSection>
			<AppShellSection grow my="md" component={ScrollArea}>
				{claims
					.filter(
						(claim) =>
							claim.name.toLowerCase().includes(searchValue) || claim.city?.toLowerCase().includes(searchValue),
					)
					.sort((a, b) => {
						if (a.finished && !b.finished) return 1;
						if (!a.finished && b.finished) return -1;
						return b.createdAt.getTime() - a.createdAt.getTime();
					})
					.map((claim) => (
						<Card
							key={claim.id}
							mb="md"
							p="md"
							style={{ cursor: 'pointer' }}
							onClick={() => {
								if (location.pathname != '/editor') {
									redirect('/editor/' + claim.id);
								}

								if (!editorStore.drawInstance) return;
								if (!editorStore.claims) return;
								editorStore.switchClaim(claim.id, { keepPosition: false });
							}}
						>
							{claim.imgSrc && (
								<Card.Section>
									<Image
										src={claim.imgSrc}
										alt={`Image of ${claim.name}`}
										fit="cover"
										mb="xs"
										style={{ objectFit: 'cover' }}
									/>
								</Card.Section>
							)}
							<Text fz="lg" fw="bold" mb="xs" lineClamp={1}>
								{claim.name}
							</Text>
							<Text fz="xs" c="dimmed">
								{claim.city ? claim.city + ' • ' : ''}
								{toHumanDate(claim.createdAt) + ' • '}
								{claim.finished ? 'Completed' : 'In Progress'}
							</Text>
						</Card>
					))}
			</AppShellSection>
			<AppShellSection>
				<NewClaimButton />
			</AppShellSection>
		</AppShellNavbar>
	);
}
