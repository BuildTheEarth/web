'use client';
import { UserDisplay } from '@/components/data/User';
import { UserSelect } from '@/components/input/UserSelect';
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Code,
	Menu,
	MenuDivider,
	MenuDropdown,
	MenuItem,
	MenuTarget,
	rem,
	SimpleGrid,
	Skeleton,
	Switch,
	Table,
	Textarea,
	TextInput,
	Title,
} from '@mantine/core';
import { IconDeviceFloppy, IconDots, IconTransfer, IconTrash } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { AdvancedClaimEditorClaim, useAdvancedClaimEditorStore } from './store';

export function AdvancedEditor({ initialClaim }: { initialClaim: AdvancedClaimEditorClaim | null }) {
	const { claim, setClaim, setUserId, updateClaim, saveChanges, transferOwnership } = useAdvancedClaimEditorStore();
	const session = useSession();

	useEffect(() => {
		if (initialClaim && initialClaim.id != claim?.id) {
			setClaim(initialClaim);
			setUserId(session?.data?.user.id || 'XXXXX');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialClaim]);

	return (
		<SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" w="100%">
			<Box m="xl">
				<Title order={3} mb="md">
					Claim Details
				</Title>
				<TextInput
					label="Claim Name"
					required
					placeholder={`A claim in ${claim?.city || 'my city'}`}
					value={claim?.name || ''}
					onChange={(e) => updateClaim({ name: e.currentTarget.value })}
					mb="md"
				/>
				<Textarea
					label="Claim Description"
					placeholder="A description of the claim"
					value={claim?.description || ''}
					onChange={(e) => updateClaim({ description: e.currentTarget.value })}
					mb="md"
					autosize
					minRows={4}
					maxRows={4}
				/>
				<TextInput
					label="City"
					required
					placeholder={`Boston`}
					value={claim?.city || ''}
					onChange={(e) => updateClaim({ city: e.currentTarget.value })}
					mb="md"
				/>
				<Switch
					label="Claim is public"
					checked={claim?.active || false}
					onChange={(e) => updateClaim({ active: e.currentTarget.checked })}
					mb="md"
					mt="xl"
				/>
				<Switch
					label="Claim is finished"
					checked={claim?.finished || false}
					onChange={(e) => updateClaim({ finished: e.currentTarget.checked })}
					mb="md"
				/>
				<Title order={3} mb="md" mt="xl">
					Collaborators
				</Title>
				<Table>
					<Table.Tbody>
						<Table.Tr key={claim?.owner?.ssoId || 'owner'}>
							<Table.Td>
								{claim?.owner ? (
									<UserDisplay
										user={{ ssoId: claim?.owner?.ssoId, id: claim?.owner?.id, username: claim?.owner?.username || '' }}
									/>
								) : undefined}
							</Table.Td>
							<Table.Td>
								<Badge color="green" variant="light">
									Owner
								</Badge>
							</Table.Td>
						</Table.Tr>
						{claim?.builders?.map((builder) => (
							<Table.Tr key={builder.ssoId}>
								<Table.Td>
									{claim?.owner ? (
										<UserDisplay user={{ ssoId: builder.ssoId, id: builder.id, username: builder.username || '' }} />
									) : undefined}
								</Table.Td>
								<Table.Td>
									<Badge color="yellow" variant="light">
										Builder
									</Badge>
								</Table.Td>
								<Table.Td w="10%">
									<Menu position="right-start">
										<MenuTarget>
											<ActionIcon size="sm" variant="subtle" color="gray" aria-label="More Actions">
												<IconDots size={16} />
											</ActionIcon>
										</MenuTarget>
										<MenuDropdown>
											<MenuItem
												leftSection={<IconTransfer style={{ width: rem(14), height: rem(14) }} />}
												aria-label="View Application"
												onClick={() => transferOwnership({ id: builder.id, username: builder.username || '' })}
											>
												Transfer Ownership
											</MenuItem>
											<MenuDivider />
											<MenuItem
												leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
												color="red"
												onClick={() => {
													updateClaim({
														builders: claim?.builders?.filter((b) => b.ssoId !== builder.ssoId) || [],
													});
												}}
											>
												Remove Builder
											</MenuItem>
										</MenuDropdown>
									</Menu>
								</Table.Td>
							</Table.Tr>
						))}
						<Table.Tr key={'add-new'}>
							<Table.Td w="60%">
								<UserSelect
									mx="lg"
									px="lg"
									label=""
									placeholder="Add builder..."
									onChange={(d, reset) => {
										console.log(d);
										updateClaim({
											builders: [
												...(claim?.builders || []),
												{ ssoId: `XXX-newly-added-XXX-${d?.id}`, id: d?.id || '', username: d?.username || '' },
											],
										});
										reset();
									}}
								/>
							</Table.Td>
						</Table.Tr>
					</Table.Tbody>
				</Table>
				<Button
					variant="gradient"
					gradient={{ from: 'indigo', to: 'cyan' }}
					fullWidth
					mt="xl"
					onClick={() => saveChanges()}
					rightSection={<IconDeviceFloppy size={16} />}
				>
					Save
				</Button>
				{/* <pre>{JSON.stringify(claim, null, 2)}</pre> */}
			</Box>
			<Box m="xl">
				<Title order={3} mb="md">
					Images
				</Title>
				<Skeleton w="100%" style={{ aspectRatio: '16/9' }} visible={true} animate={false}></Skeleton>
				<Title order={3} mb="md" mt="xl">
					Details
				</Title>
				<Table mb="lg">
					<Table.Tbody>
						<Table.Tr>
							<Table.Td>Id</Table.Td>
							<Table.Td>
								<Code>{claim?.id}</Code>
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Owner</Table.Td>
							<Table.Td>
								<Code>{claim?.ownerId}</Code> / <Code>{claim?.owner?.username}</Code>
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>BuildTeam</Table.Td>
							<Table.Td>
								<Code>{claim?.buildTeamId}</Code> / <Code>{claim?.buildTeam?.name}</Code>
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Polygon</Table.Td>
							<Table.Td>
								<Code>{claim?.area ? claim.area.length - 1 : 0} Edges</Code>
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Coordinates</Table.Td>
							<Table.Td>
								<Code>{claim?.center}</Code>
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Created At</Table.Td>
							<Table.Td>
								<Code>{claim?.createdAt.toISOString()}</Code>
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>External ID</Table.Td>
							<Table.Td>
								<Code>{claim?.externalId || 'none provided'}</Code>
							</Table.Td>
						</Table.Tr>
					</Table.Tbody>
				</Table>
			</Box>
		</SimpleGrid>
	);
}
