'use client'

import { toHumanDate } from '@/util/date'
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
} from '@mantine/core'
import type { Claim } from '@repo/db'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { NewClaimButton } from './claims/editor/interactivity'
import { useClaimEditorStore } from './claims/editor/store'

export default function EditorNavbar({ claims: initialClaims }: { claims: (Claim & { imgSrc?: string })[] }) {
	const router = useRouter()
	const [searchValue, setSearchValue] = useState('')
	const storeClaims = useClaimEditorStore((s) => s.claims)
	const isInitialized = useClaimEditorStore((s) => s.isInitialized)

	const claims = isInitialized ? storeClaims : initialClaims

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
						(claim: any) =>
							(claim.name && claim.name.toLowerCase().includes(searchValue)) ||
							(claim.city && claim.city.toLowerCase().includes(searchValue)),
					)
					.sort((a: any, b: any) => {
						if (a.finished && !b.finished) return 1
						if (!a.finished && b.finished) return -1
						const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
						const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
						return timeB - timeA
					})
					.map((claim: any) => {
						const imgSrc =
							claim.imgSrc || (claim.images?.[0]?.name ? `/api/media/image/${claim.images[0].name}` : undefined)
						return (
							<Card
								key={claim.id}
								mb="md"
								p="md"
								style={{ cursor: 'pointer' }}
								onClick={() => {
									if (typeof window !== 'undefined' && window.location.pathname !== '/claims/editor') {
										router.push('/claims/editor?id=' + claim.id)
										return
									}

									const store = useClaimEditorStore.getState()
									if (!store.drawInstance) return
									store.switchClaim(claim.id, { keepPosition: false })
								}}
							>
								{imgSrc && (
									<Card.Section>
										<Image
											src={imgSrc}
											alt={`Image of ${claim.name}`}
											fit="cover"
											mb="xs"
											style={{ objectFit: 'cover' }}
										/>
									</Card.Section>
								)}
								<Text fz="lg" fw="bold" mb="xs" lineClamp={1}>
									{claim.name || 'Untitled Claim'}
								</Text>
								<Text fz="xs" c="dimmed">
									{claim.city ? claim.city + ' • ' : ''}
									{claim.createdAt ? toHumanDate(claim.createdAt) + ' • ' : ''}
									{claim.finished ? 'Completed' : 'In Progress'}
								</Text>
							</Card>
						)
					})}
			</AppShellSection>
			<AppShellSection>
				<NewClaimButton />
			</AppShellSection>
		</AppShellNavbar>
	)
}
